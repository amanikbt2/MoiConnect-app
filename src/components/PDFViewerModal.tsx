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
  Easing
} from 'react-native';
import { DownloadIcon, CheckIcon, ArrowLeftIcon } from './Icons';
import { subscribeToDownloadUpdates, OfflinePaper } from '../services/offlineStorage';

export interface PDFDocumentItem {
  id: string;
  mtid?: string;
  title: string;
  unitCode: string;
  unitName?: string;
  school?: string;
  fileUrl: string;
  pages?: string;
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

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  visible,
  document,
  onClose,
  onDownload
}) => {
  const [activePage, setActivePage] = useState(1);
  const [downloadInfo, setDownloadInfo] = useState<{
    status?: 'downloading' | 'completed' | 'failed';
    progress?: number;
  }>({});

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!document) return;
    setActivePage(1);
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

  const isDownloading = downloadInfo.status === 'downloading';
  const isCompleted = downloadInfo.status === 'completed';

  if (!document) return null;

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
              Lightning PDF Reader • {document.pages || 'PDF Document'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.downloadIconBtn,
              isCompleted && styles.downloadIconBtnSuccess,
              isDownloading && styles.downloadIconBtnActive
            ]}
            onPress={handleSave}
            disabled={isDownloading}
            activeOpacity={0.85}
          >
            {isDownloading ? (
              <View style={styles.spinnerWrapper}>
                <Animated.View style={[styles.spinRing, { transform: [{ rotate: spin }] }]} />
                <Text style={styles.progressPercentText}>{downloadInfo.progress || 5}%</Text>
              </View>
            ) : isCompleted ? (
              <CheckIcon color="#ffffff" size={18} />
            ) : (
              <DownloadIcon color="#ffffff" size={18} />
            )}
          </TouchableOpacity>
        </View>

        {/* Instant PDF Preview Container */}
        <View style={styles.bodyContainer}>
          {Platform.OS === 'web' && document.fileUrl && !document.fileUrl.includes('cloudinary.com/mconnect') ? (
            <View style={styles.webViewerWrapper}>
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.fileUrl)}&embedded=true`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={document.title}
              />
            </View>
          ) : (
            <ScrollView style={styles.readerScroll} contentContainerStyle={styles.readerContent}>
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
                      📄 Read-Only Document Excerpt (Testing Mode):
                    </Text>
                    <Text style={styles.excerptText}>
                      {document.sampleText || `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quick test preview words line for ${document.title} (${document.unitCode}).`}
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
  webViewerWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff'
  },
  readerScroll: {
    flex: 1
  },
  readerContent: {
    padding: 14,
    gap: 16
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
  }
});
