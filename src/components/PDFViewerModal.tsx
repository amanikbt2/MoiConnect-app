import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { DownloadIcon, CheckIcon, ArrowLeftIcon, VolumeIcon, VolumeOffIcon } from './Icons';
import { OfflineState } from './OfflineState';
import { subscribeToDownloadUpdates, OfflinePaper, personalizeLectureText } from '../services/offlineStorage';
import { ttsService, TTSState } from '../services/ttsService';
import { config } from '../config';

const HIDE_PDF_TOOLBAR_SCRIPT = `(function(){
  var css='#toolbarContainer,#toolbarViewer,#toolbarViewerLeft,#toolbarViewerMiddle,#toolbarViewerRight,#secondaryToolbar,#sidebarContainer,#sidebarResizer,#findbar,#editorModeButtons,#loadingBar,.toolbar,.findbar,.doorHanger,[role="toolbar"]{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;overflow:hidden!important}#outerContainer,#mainContainer,#viewerContainer{top:0!important;left:0!important;margin-left:0!important;height:100%!important}';
  function apply(){
    var root=document.head||document.documentElement;
    if(!root)return;
    var style=document.getElementById('mconnect-pdf-toolbar-style');
    if(!style){style=document.createElement('style');style.id='mconnect-pdf-toolbar-style';root.appendChild(style)}
    if(style.textContent!==css)style.textContent=css;
    ['toolbarContainer','toolbarViewer','secondaryToolbar','sidebarContainer','findbar'].forEach(function(id){var el=document.getElementById(id);if(el){el.style.display='none';el.style.visibility='hidden';el.style.height='0px'}});
  }
  apply();
  document.addEventListener('DOMContentLoaded',apply);
  window.addEventListener('load',apply);
  var observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(apply,1000);
  true;
})();`;

export interface PDFDocumentItem {
  id: string;
  mtid?: string;
  title: string;
  unitCode: string;
  unitName?: string;
  school?: string;
  fileUrl: string;
  ttsTextUrl?: string;
  author?: string;
  summary?: string;
  sampleText?: string;
  downloads?: number | string;
  ratingScore?: number;
  starCount?: number;
}

interface PDFViewerModalProps {
  visible: boolean;
  document: PDFDocumentItem | null;
  onClose: () => void;
  onDownload: (doc: PDFDocumentItem) => void;
}

export function formatCount(input: number | string | undefined | null): string {
  if (input === undefined || input === null) return '0';
  let num: number;
  if (typeof input === 'string') {
    const cleaned = input.replace(/,/g, '').trim();
    num = parseFloat(cleaned);
  } else {
    num = input;
  }

  if (isNaN(num) || !num) return '0';
  if (num < 1000) return `${num}`;

  if (num < 1_000_000) {
    const val = num / 1000;
    return val % 1 === 0 ? `${val.toFixed(0)}k` : `${val.toFixed(1).replace(/\.0$/, '')}k`;
  }

  if (num < 1_000_000_000) {
    const val = num / 1_000_000;
    return val % 1 === 0 ? `${val.toFixed(0)}m` : `${val.toFixed(1).replace(/\.0$/, '')}m`;
  }

  const val = num / 1_000_000_000;
  return val % 1 === 0 ? `${val.toFixed(0)}b` : `${val.toFixed(1).replace(/\.0$/, '')}b`;
}

export function getCleanPdfUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl;

  // 1. If url is already pointing to our backend streaming proxy, use it directly
  if (url.includes('/api/v1/papers/') || url.includes('/api/papers/')) {
    return url;
  }

  // 2. If url is a Cloudinary URL (res.cloudinary.com or api.cloudinary.com or /raw/upload/),
  // route it through backend streaming proxy to bypass 401 Unauthorized delivery restriction!
  if (url.includes('cloudinary.com') || url.includes('/raw/upload/')) {
    const apiBase = config.apiUrl.replace(/\/$/, '');
    const cleanRaw = url.split('#')[0];
    return `${apiBase}/papers/stream-url?url=${encodeURIComponent(cleanRaw)}`;
  }

  return url;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  visible,
  document,
  onClose,
  onDownload
}) => {
  const [activePage, setActivePage] = useState(1);
  const [actualPageCount, setActualPageCount] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const initialPinchDist = useRef<number>(0);
  const initialPinchScale = useRef<number>(1.0);
  const lastTapRef = useRef<number>(0);

  const [downloadInfo, setDownloadInfo] = useState<{
    status?: 'downloading' | 'completed' | 'failed';
    progress?: number;
  }>({});

  const [ttsState, setTtsState] = useState<TTSState>({ isSpeaking: false, isPaused: false, voices: [], selectedVoiceId: null, speechRate: 0.92, speechPitch: 1.0 });
  const [showVoicePicker, setShowVoicePicker] = useState<boolean>(false);
  const [isPreparingTTS, setIsPreparingTTS] = useState(false);
  const [isReadingTTS, setIsReadingTTS] = useState(false);
  const isTtsBuffering = isPreparingTTS || (isReadingTTS && !ttsState.isSpeaking && !ttsState.isPaused);
  const ttsSessionRef = useRef(0);
  const [hasPdfLoadError, setHasPdfLoadError] = useState<boolean>(false);
  const [pdfRetryKey, setPdfRetryKey] = useState<number>(0);
  const [isPdfRetrying, setIsPdfRetrying] = useState<boolean>(false);

  useEffect(() => {
    setActualPageCount(null);
  }, [document?.id, document?.fileUrl, visible, pdfRetryKey]);

  const handleRetryPdfLoad = () => {
    setIsPdfRetrying(true);
    setHasPdfLoadError(false);
    setPdfRetryKey((k) => k + 1);
    setTimeout(() => {
      setIsPdfRetrying(false);
    }, 1200);
  };

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = ttsService.subscribe((st) => setTtsState(st));
    return () => {
      unsub();
      ttsService.stop();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      ttsSessionRef.current += 1;
      setIsPreparingTTS(false);
      setIsReadingTTS(false);
      ttsService.stop();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      ttsSessionRef.current += 1;
      setIsReadingTTS(false);
      ttsService.stop();
    };
  }, [document?.id]);

  const splitLectureTextIntoChunks = (text: string): string[] => {
    const lines = text
      .replace(/([.!?])\s+/g, '$1\n')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const chunks: string[] = [];
    let current = '';
    for (const line of lines) {
      const candidate = current ? `${current} ${line}` : line;
      if (current && candidate.length > 520) {
        chunks.push(current);
        current = line;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [text.trim()];
  };


  const handleToggleTTS = async () => {
    if (!document) return;

    if (ttsState.isSpeaking || isReadingTTS) {
      ttsService.stop();
      setIsReadingTTS(false);
      return;
    }

    setIsPreparingTTS(true);
    const sessionId = ++ttsSessionRef.current;

    try {
      if (!document.ttsTextUrl) throw new Error('No lecture text file is attached');

      const lectureTextRaw = document.ttsTextUrl.startsWith('file://')
        ? await FileSystem.readAsStringAsync(document.ttsTextUrl)
        : await (async () => {
            const separator = document.ttsTextUrl!.includes('?') ? '&' : '?';
            const freshTtsUrl = `${document.ttsTextUrl}${separator}refresh=${Date.now()}`;
            const response = await fetch(freshTtsUrl, { cache: 'no-store' });
            if (!response.ok) throw new Error(`TTS text request failed (${response.status})`);
            return response.text();
          })();
      const lectureText = (await personalizeLectureText(lectureTextRaw)).replace(/^\uFEFF/, '').trim();
      if (!lectureText || /^\s*<(?:!doctype|html|body)\b/i.test(lectureText)) {
        throw new Error('Lecture text file is empty or invalid');
      }

      const chunks = splitLectureTextIntoChunks(lectureText);
      // The file/chunk preparation is complete. From this point onward the
      // speaker icon represents active speech, including between chunks.
      setIsPreparingTTS(false);
      setIsReadingTTS(true);
      for (let index = 0; index < chunks.length; index += 1) {
        if (ttsSessionRef.current !== sessionId) return;
        await ttsService.speakAndWait(chunks[index]);
      }
    } catch (error) {
      console.warn('[TTS] Could not load lecture text:', error);
      if (ttsSessionRef.current !== sessionId) return;
      await ttsService.speak('No lecture recording for this document');
    } finally {
      setIsPreparingTTS(false);
      setIsReadingTTS(false);
    }
  };

  useEffect(() => {
    if (!document) return;
    setActivePage(1);
    setZoomScale(1.0);
    setHasPdfLoadError(false);
    setIsPdfRetrying(false);
    const docId = document.id;
    const unsubscribe = subscribeToDownloadUpdates((papers) => {
      const found = papers.find(
        (p) =>
          p._id === docId ||
          p._id === `note_${docId}` ||
          p._id === `paper_${docId}` ||
          p.title === document.title
      );
      if (found) {
        setDownloadInfo({ status: found.status, progress: found.progress });
      } else {
        setDownloadInfo({});
      }
    });

    return () => unsubscribe();
  }, [document]);

  useEffect(() => {
    if (downloadInfo.status === 'downloading') {
      spinValue.setValue(0);
      const loopAnim = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web'
        })
      );
      loopAnim.start();
      return () => loopAnim.stop();
    }
  }, [downloadInfo.status]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleSave = () => {
    if (document) {
      onDownload(document);
    }
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
  };

  const handleMaxZoom = () => {
    setZoomScale(3.0);
  };

  const handleTouchStart = (e: any) => {
    const touches = e.nativeEvent?.touches || [];
    if (touches.length === 2) {
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
      initialPinchDist.current = dist;
      initialPinchScale.current = zoomScale;
    } else if (touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        setZoomScale((prev) => (prev > 1.2 ? 1.0 : 1.8));
      }
      lastTapRef.current = now;
    }
  };

  const handleTouchMove = (e: any) => {
    const touches = e.nativeEvent?.touches || [];
    if (touches.length === 2 && initialPinchDist.current > 0) {
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
      const ratio = dist / initialPinchDist.current;
      const calculated = Math.min(Math.max(initialPinchScale.current * ratio, 0.75), 3.5);
      setZoomScale(Number(calculated.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    initialPinchDist.current = 0;
  };

  if (!document) return null;

  const isDownloading = downloadInfo.status === 'downloading';
  const isCompleted = downloadInfo.status === 'completed';
  const rawFileUrl = document.fileUrl?.startsWith('/')
    ? config.apiUrl.replace(/\/api\/v1\/?$/, '') + document.fileUrl
    : document.fileUrl;
  const fileUrl = getCleanPdfUrl(rawFileUrl);
  const hasRealDocument = /^https?:\/\//i.test(fileUrl || '') || /^\/\/[^/]/.test(fileUrl || '');
  const embeddedFileUrl = fileUrl
    ? fileUrl + (fileUrl.includes('#') ? '' : '#toolbar=0&navpanes=0&scrollbar=0&view=FitH')
    : fileUrl;
  const nativeReaderUrl = hasRealDocument && Platform.OS !== 'web'
    ? 'https://mozilla.github.io/pdf.js/web/viewer.html?file=' + encodeURIComponent(fileUrl)
    : fileUrl;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeftIcon color="#ffffff" size={22} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {document.unitCode} - {document.title}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1} ellipsizeMode="tail">
              Lightning PDF Reader • {actualPageCount ? `${actualPageCount} pages` : 'PDF document'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Audio TTS Voice Mode Toggle Button */}
            <TouchableOpacity
              style={[
                styles.audioIconBtn,
                (ttsState.isSpeaking || isReadingTTS) && styles.audioIconBtnActive
              ]}
              onPress={handleToggleTTS}
              disabled={isPreparingTTS}
              activeOpacity={0.8}
              accessibilityLabel={ttsState.isSpeaking || isReadingTTS ? 'Stop voice reading' : 'Read document aloud'}
            >
              {isTtsBuffering ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : ttsState.isSpeaking || isReadingTTS ? (
                <VolumeOffIcon color="#ffffff" size={20} />
              ) : (
                <VolumeIcon color="#ffffff" size={20} />
              )}
            </TouchableOpacity>

            {/* Top Right Header Action Button: Download / Save PDF */}
            <TouchableOpacity
              style={[
                styles.downloadIconBtn,
                isCompleted && styles.downloadIconBtnSuccess,
                isDownloading && styles.downloadIconBtnActive
              ]}
              onPress={handleSave}
              disabled={isDownloading}
              activeOpacity={0.8}
              accessibilityLabel={isCompleted ? 'Downloaded' : isDownloading ? 'Downloading' : 'Download PDF for offline access'}
            >
              {isDownloading ? (
                <View style={styles.spinnerWrapper}>
                  <Animated.View style={[styles.spinRing, { transform: [{ rotate: spin }] }]} />
                  <Text style={styles.progressPercentText}>{downloadInfo.progress || 5}%</Text>
                </View>
              ) : isCompleted ? (
                <CheckIcon color="#ffffff" size={20} />
              ) : (
                <DownloadIcon color="#ffffff" size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Reading Mode Active Banner */}
        {ttsState.isSpeaking && (
          <View style={styles.ttsBanner}>
            <View style={styles.ttsBannerContent}>
              <TouchableOpacity
                onPress={() => ttsService.stop()}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Stop voice reading"
              >
                <Text style={styles.ttsBannerIcon}>🔊</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.ttsBannerTitle}>Prof. Campus AI explaining...</Text>
                <Text style={styles.ttsBannerText} numberOfLines={1}>
                  Non-interactive lecture of {document.unitCode}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.ttsVoiceBtn}
                onPress={() => {
                  setShowVoicePicker(true);
                  void ttsService.loadVoices();
                }}
                activeOpacity={0.8}
                accessibilityLabel="Adjust voice, speech speed, and pitch"
              >
                <Text style={styles.ttsVoiceBtnText}>Voice & Speed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ttsPauseBtn}
                onPress={() => ttsService.togglePause()}
                activeOpacity={0.8}
                accessibilityLabel={ttsState.isPaused ? 'Resume voice reading' : 'Pause voice reading'}
              >
                <Text style={styles.ttsPauseBtnText}>{ttsState.isPaused ? '▶' : 'Ⅱ'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Voice Picker Overlay Dropdown */}
        {showVoicePicker && (
          <Modal transparent animationType="fade" visible={showVoicePicker} onRequestClose={() => setShowVoicePicker(false)}>
            <TouchableOpacity
              style={styles.voicePickerBackdrop}
              activeOpacity={1}
              onPress={() => setShowVoicePicker(false)}
            >
              <View style={styles.voicePickerCard}>
                <View style={styles.voicePickerHeader}>
                  <Text style={styles.voicePickerTitle}>🎙️ Voice & Speech</Text>
                  <TouchableOpacity onPress={() => setShowVoicePicker(false)} style={styles.voicePickerCloseBtn}>
                    <Text style={styles.voicePickerCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.speechControlRow}>
                  <View style={styles.speechControlCopy}>
                    <Text style={styles.speechControlLabel}>Speaking speed</Text>
                    <Text style={styles.speechControlHint}>Adjust how quickly it reads</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.speechStepButton}
                    onPress={() => ttsService.setSpeechRate(ttsState.speechRate - 0.1)}
                    accessibilityLabel="Decrease speaking speed"
                  ><Text style={styles.speechStepText}>−</Text></TouchableOpacity>
                  <Text style={styles.speechValue}>{ttsState.speechRate.toFixed(1)}×</Text>
                  <TouchableOpacity
                    style={styles.speechStepButton}
                    onPress={() => ttsService.setSpeechRate(ttsState.speechRate + 0.1)}
                    accessibilityLabel="Increase speaking speed"
                  ><Text style={styles.speechStepText}>+</Text></TouchableOpacity>
                </View>

                <View style={styles.speechControlRow}>
                  <View style={styles.speechControlCopy}>
                    <Text style={styles.speechControlLabel}>Voice pitch</Text>
                    <Text style={styles.speechControlHint}>A slightly higher tone is closer to Google UK Female</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.speechStepButton}
                    onPress={() => ttsService.setSpeechPitch(ttsState.speechPitch - 0.1)}
                    accessibilityLabel="Lower voice pitch"
                  ><Text style={styles.speechStepText}>−</Text></TouchableOpacity>
                  <Text style={styles.speechValue}>{ttsState.speechPitch.toFixed(1)}×</Text>
                  <TouchableOpacity
                    style={styles.speechStepButton}
                    onPress={() => ttsService.setSpeechPitch(ttsState.speechPitch + 0.1)}
                    accessibilityLabel="Raise voice pitch"
                  ><Text style={styles.speechStepText}>+</Text></TouchableOpacity>
                </View>

                <Text style={styles.voicePickerNote}>
                  A natural English voice with a balanced pitch is preferred when your Android speech engine has it installed. You can choose another voice or adjust the pitch below.
                </Text>

                <ScrollView style={styles.voicePickerList} nestedScrollEnabled>
                  {ttsState.voices && ttsState.voices.length > 0 ? (
                    ttsState.voices
                      .slice()
                      .sort((a, b) => {
                        const aEn = a.language?.toLowerCase().includes('en') || a.name.toLowerCase().includes('english');
                        const bEn = b.language?.toLowerCase().includes('en') || b.name.toLowerCase().includes('english');
                        if (aEn && !bEn) return -1;
                        if (!aEn && bEn) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((v) => {
                        const isSelected = ttsState.selectedVoiceId === v.id;
                        return (
                          <TouchableOpacity
                            key={v.id}
                            style={[styles.voiceItem, isSelected && styles.voiceItemSelected]}
                            onPress={() => {
                              ttsService.setVoice(v.id);
                              setShowVoicePicker(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.voiceItemName, isSelected && styles.voiceItemNameSelected]} numberOfLines={1}>
                                {v.name}
                              </Text>
                              <Text style={styles.voiceItemLang} numberOfLines={1}>
                                {v.language || 'English'} {v.quality ? `• ${v.quality}` : ''}
                              </Text>
                            </View>
                            {isSelected && <Text style={styles.voiceCheckmark}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })
                  ) : (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <Text style={{ color: '#94a3b8', fontSize: 13 }}>Default System Voice Active</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Instant PDF Preview Container */}
        <View style={styles.bodyContainer}>
          {hasPdfLoadError ? (
            <View style={styles.pdfErrorWrapper}>
              <OfflineState
                title="Failed to load PDF"
                message="Unable to load document preview. Please check your internet connection and try again."
                onRetry={handleRetryPdfLoad}
                retrying={isPdfRetrying}
              />
            </View>
          ) : Platform.OS === 'web' && hasRealDocument ? (
            <View style={styles.webViewerWrapper}>
              <iframe
                key={pdfRetryKey}
                src={embeddedFileUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={document.title}
                onError={() => setHasPdfLoadError(true)}
              />
            </View>
          ) : Platform.OS !== 'web' && hasRealDocument ? (
            <View style={styles.webViewerWrapper}>
              <WebView
                key={pdfRetryKey}
                source={{ uri: nativeReaderUrl }}
                style={styles.nativeViewer}
                originWhitelist={['*']}
                javaScriptEnabled
                injectedJavaScriptBeforeContentLoaded={HIDE_PDF_TOOLBAR_SCRIPT}
                injectedJavaScript={`${HIDE_PDF_TOOLBAR_SCRIPT}(function(){var sent=false;var started=Date.now();var timer=setInterval(function(){try{var app=window.PDFViewerApplication;var count=app&&(app.pdfDocument&&app.pdfDocument.numPages||app.pagesCount);if(!sent&&Number.isInteger(count)&&count>0&&window.ReactNativeWebView){sent=true;window.ReactNativeWebView.postMessage(JSON.stringify({type:'pdfPageCount',count:count}));clearInterval(timer);}else if(Date.now()-started>60000){clearInterval(timer);}}catch(e){}},250);true;})();`}
                onMessage={(event) => {
                  try {
                    const message = JSON.parse(event.nativeEvent.data);
                    if (message?.type === 'pdfPageCount' && Number.isInteger(message.count) && message.count > 0) {
                      setActualPageCount(message.count);
                    }
                  } catch {}
                }}
                domStorageEnabled
                allowFileAccess
                allowUniversalAccessFromFileURLs
                mixedContentMode="always"
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.viewerLoading}>
                    <ActivityIndicator color='#15803d' size='large' />
                    <Text style={styles.viewerLoadingText}>Loading PDF...</Text>
                  </View>
                )}
                onError={() => setHasPdfLoadError(true)}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  if (nativeEvent.statusCode >= 400) {
                    setHasPdfLoadError(true);
                  }
                }}
              />
            </View>
          ) : (
            <ScrollView
              style={styles.readerScroll}
              contentContainerStyle={styles.readerContent}
              maximumZoomScale={3.5}
              minimumZoomScale={0.75}
              showsHorizontalScrollIndicator={true}
              showsVerticalScrollIndicator={true}
            >
              <View
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={[
                  styles.zoomWrapper,
                  {
                    transform: [{ scale: zoomScale }],
                    marginVertical: zoomScale > 1.0 ? (zoomScale - 1.0) * 110 : 0
                  }
                ]}
              >
                {/* Document Cover & Header Card - Only shown on Page 1 */}
                {activePage === 1 && (
                  <View style={styles.docHeaderCard}>
                    <View style={styles.docTagRow}>
                      <View style={styles.docCodeBadge}>
                        <Text style={styles.docCodeText}>{document.unitCode}</Text>
                      </View>
                      {!!document.mtid && (
                        <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '800' }}>mtid: {document.mtid}</Text>
                        </View>
                      )}
                      <Text style={styles.docSchool}>{document.school || 'Moi University'}</Text>
                    </View>

                    <Text style={styles.docMainTitle}>{document.title}</Text>
                    {!!document.author && <Text style={styles.docAuthor}>Author: {document.author}</Text>}

                    {!!document.summary && (
                      <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>Document Summary:</Text>
                        <Text style={styles.summaryText}>{document.summary}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Fast Simulated PDF Page Preview */}
                <View style={styles.pagePreviewContainer}>
                  <View style={styles.pageHeader}>
                    <Text style={styles.pageHeaderTitle}>PAGE {activePage} OF 12</Text>
                    <View style={styles.pageControls}>
                      <TouchableOpacity
                        disabled={activePage <= 1}
                        onPress={() => setActivePage((p) => Math.max(1, p - 1))}
                        style={[styles.pageBtn, activePage <= 1 && styles.pageBtnDisabled]}
                      >
                        <Text style={styles.pageBtnText}>‹ Prev</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={activePage >= 12}
                        onPress={() => setActivePage((p) => Math.min(12, p + 1))}
                        style={[styles.pageBtn, activePage >= 12 && styles.pageBtnDisabled]}
                      >
                        <Text style={styles.pageBtnText}>Next ›</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Read-Only PDF Paper Sheet */}
                  <View style={styles.paperSheet}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.paperCodeHeader}>MOI UNIVERSITY • {document.unitCode}</Text>
                      <View style={styles.readOnlyBadge}>
                        <Text style={styles.readOnlyBadgeText}>🔒 READ-ONLY PREVIEW</Text>
                      </View>
                    </View>
                    <Text style={styles.paperTitleHeader}>{document.title}</Text>
                    <View style={styles.paperDivider} />

                    <Text style={styles.paperHeading}>1. READ-ONLY PDF PREVIEW CONTENT (Page {activePage})</Text>
                    <View style={styles.excerptBox}>
                      <Text style={styles.excerptLabel}>
                        📄 Document Excerpt:
                      </Text>
                      <Text style={styles.excerptText}>
                        {document.sampleText || `Academic revision content for ${document.title} (${document.unitCode}).`}
                      </Text>
                    </View>

                    <Text style={styles.paperBodyText}>
                      1.1 Key Concepts: Definition and fundamental principles of {document.unitName || document.unitCode}.{'\n'}
                      1.2 Solved Examples: Worked problem steps and formula applications for semester exams.{'\n'}
                      1.3 Quick Revision: High yield notes compiled for test evaluation and quick review.
                    </Text>

                    {/* Decorative Footer Stamp for Paper */}
                    <View style={styles.paperFooterStamp}>
                      <Text style={styles.paperFooterStampText}>MConnect Official Academic Archive • Page {activePage} of 12</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15803d',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 10,
    gap: 10
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 2
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 20
  },
  headerSub: {
    fontSize: 11,
    color: '#dcfce7',
    fontWeight: '500',
    marginTop: 1
  },
  downloadIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4ade80'
  },
  downloadIconBtnSuccess: {
    backgroundColor: '#16a34a',
    borderColor: '#22c55e'
  },
  downloadIconBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#86efac'
  },
  spinnerWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  spinRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderTopColor: '#ffffff'
  },
  progressPercentText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff'
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  zoomControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  zoomInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  zoomIconText: {
    fontSize: 13
  },
  zoomLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8'
  },
  zoomBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  zoomBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8'
  },
  zoomActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  zoomBtn: {
    backgroundColor: '#1e293b',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  zoomBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18
  },
  zoomActionPill: {
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#22c55e'
  },
  zoomActionPillActive: {
    backgroundColor: '#16a34a',
    borderColor: '#4ade80'
  },
  zoomActionPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  zoomResetBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  zoomResetBtnText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '700'
  },
  headerActionSpacer: {
    width: 42,
    height: 42
  },
  webViewerWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff'
  },
  nativeViewer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  viewerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff'
  },
  viewerLoadingText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700'
  },
  readerScroll: {
    flex: 1
  },
  readerContent: {
    padding: 14,
    gap: 16
  },
  zoomWrapper: {
    gap: 16,
    width: '100%'
  },
  docHeaderCard: {
    backgroundColor: '#fcfbf9',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderTopWidth: 5,
    borderTopColor: '#15803d',
    transform: [{ rotate: '-0.3deg' }],
    shadowColor: '#0f172a',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  docTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  docCodeBadge: {
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  docCodeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  docSchool: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  docMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 24,
    marginBottom: 6
  },
  docAuthor: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    marginBottom: 10
  },
  summaryBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2
  },
  summaryText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18
  },
  pagePreviewContainer: {
    backgroundColor: '#fbfbfe',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    transform: [{ rotate: '0.3deg' }],
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1'
  },
  pageHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
    letterSpacing: 0.8
  },
  pageControls: {
    flexDirection: 'row',
    gap: 8
  },
  pageBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  pageBtnDisabled: {
    opacity: 0.4,
    backgroundColor: '#f1f5f9'
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  paperSheet: {
    padding: 18,
    margin: 0,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  readOnlyBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  readOnlyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400e'
  },
  paperCodeHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1
  },
  paperTitleHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
    marginBottom: 12
  },
  paperDivider: {
    height: 3,
    backgroundColor: '#15803d',
    width: 60,
    borderRadius: 2,
    marginBottom: 16
  },
  paperHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 8
  },
  excerptBox: {
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderLeftWidth: 4,
    borderLeftColor: '#15803d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3
  },
  excerptLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4
  },
  excerptText: {
    fontSize: 13,
    color: '#1e293b',
    lineHeight: 21
  },
  paperBodyText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#334155',
    marginBottom: 16
  },
  paperFooterStamp: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center'
  },
  paperFooterStampText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5
  },
  audioIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  audioIconBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
    borderWidth: 2,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3
  },
  ttsBanner: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0369a1'
  },
  ttsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  ttsBannerIcon: {
    fontSize: 16
  },
  ttsBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff'
  },
  ttsBannerText: {
    fontSize: 11,
    color: '#e0f2fe',
    fontWeight: '500'
  },
  ttsStopBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  ttsStopBtnText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800'
  },
  ttsVoiceBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  ttsVoiceBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  ttsPauseBtn: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  ttsPauseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15
  },
  voicePickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  voicePickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  voicePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 8
  },
  voicePickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc'
  },
  voicePickerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  voicePickerCloseText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700'
  },
  voicePickerList: {
    maxHeight: 280
  },
  speechControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  speechControlCopy: {
    flex: 1,
    paddingRight: 8
  },
  speechControlLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700'
  },
  speechControlHint: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2
  },
  speechStepButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  speechStepText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22
  },
  speechValue: {
    width: 42,
    color: '#38bdf8',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800'
  },
  voicePickerNote: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 14,
    paddingVertical: 9
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'transparent'
  },
  voiceItemSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderWidth: 1,
    borderColor: '#0284c7'
  },
  voiceItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1'
  },
  voiceItemNameSelected: {
    color: '#38bdf8',
    fontWeight: '700'
  },
  voiceItemLang: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  voiceCheckmark: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8
  },
  pdfErrorWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 16
  }
});
