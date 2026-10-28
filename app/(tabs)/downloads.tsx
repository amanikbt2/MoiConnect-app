import { showIceMessage } from '../../src/components/IceMessageCard';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Image,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  getDownloadedPapers,
  removeOfflinePaper,
  togglePinOfflinePaper,
  retryPaperDownload,
  subscribeToDownloadUpdates,
  clearUnreadDownloadBadge,
  OfflinePaper,
  getMaterialCoverUrl
} from '../../src/services/offlineStorage';
import { EmptyState } from '../../src/components/EmptyState';
import { useAppNavigation } from '../../src/utils/navigation';
import { useIsFocused } from '@react-navigation/native';
import { PDFViewerModal, PDFDocumentItem } from '../../src/components/PDFViewerModal';
import { formatCompactNumber } from '../../src/utils/formatters';
import {
  TrashIcon,
  BookIcon,
  MoreVerticalIcon,
  PinIcon,
  RefreshCwIcon,
  CloseIcon,
  StarIcon,
  DownloadIcon,
  ChevronRightIcon,
  CheckIcon,
  PlayIcon,
  VideoIcon,
  ImageIcon
} from '../../src/components/Icons';
import { SmartMediaThumbnail, getCloudinaryVideoPreviewUrl } from '../../src/components/SmartMediaThumbnail';

export const isVideoDownload = (item?: OfflinePaper | null): boolean => {
  if (!item) return false;
  if (item.type === 'video') return true;
  const ext = (item.fileType || '').toLowerCase();
  if (['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv', '3gp'].includes(ext)) return true;
  const name = (item.title || '').toLowerCase();
  const uri = (item.localUri || item.fileUrl || '').toLowerCase();
  return Boolean(name.match(/\.(mp4|mov|m4v|webm|mkv|avi|3gp)$/i)) ||
    Boolean(uri.match(/\.(mp4|mov|m4v|webm|mkv|avi|3gp)(\?.*)?$/i)) ||
    uri.includes('/video/upload/');
};

export const isImageDownload = (item?: OfflinePaper | null): boolean => {
  if (!item) return false;
  if (item.type === 'image') return true;
  const ext = (item.fileType || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'svg'].includes(ext)) return true;
  const name = (item.title || '').toLowerCase();
  const uri = (item.localUri || item.fileUrl || '').toLowerCase();
  return Boolean(name.match(/\.(jpg|jpeg|png|gif|webp|bmp|heic|svg)$/i)) ||
    Boolean(uri.match(/\.(jpg|jpeg|png|gif|webp|bmp|heic|svg)(\?.*)?$/i)) ||
    uri.includes('/image/upload/');
};

export const isMediaDownload = (item?: OfflinePaper | null): boolean => {
  return isVideoDownload(item) || isImageDownload(item);
};

export const getVideoPlayerHtml = (url: string): string => {
  const safeUrl = (url || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" /><style>html,body{margin:0;padding:0;width:100%;height:100%;background:#020617;overflow:hidden;display:flex;align-items:center;justify-content:center}video{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;background:#020617;outline:none}</style></head><body><video controls autoplay playsinline webkit-playsinline src="${safeUrl}"></video></body></html>`;
};

const isLocalFileUri = (uri?: string): boolean => {
  if (!uri || typeof uri !== 'string') return false;
  return /^(file:|content:|data:|blob:|offline-web:)/i.test(uri) || uri.startsWith('/');
};

function OfflineCardThumbnail({ uri, unitCode }: { uri?: string; unitCode?: string }) {
  const [loadFailed, setLoadFailed] = useState(false);
  if (!uri || loadFailed) {
    return (
      <View style={styles.thumbnailImageFallback}>
        <BookIcon color="#38bdf8" size={26} />
        <Text style={styles.thumbnailFallbackCode} numberOfLines={1}>
          {unitCode || 'ACADEMIC'}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={styles.thumbnailImage}
      resizeMode="cover"
      onError={() => setLoadFailed(true)}
    />
  );
}

export default function DownloadsScreen() {
  const [downloadedPapers, setDownloadedPapers] = useState<OfflinePaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starredPapers, setStarredPapers] = useState<Record<string, boolean>>({});

  // 3-Dots Menu State
  const [menuPaper, setMenuPaper] = useState<OfflinePaper | null>(null);

  // PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Full-Screen Media Preview State (Images & Videos)
  const [mediaPreviewDoc, setMediaPreviewDoc] = useState<OfflinePaper | null>(null);

  const router = useAppNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) void clearUnreadDownloadBadge();
  }, [isFocused]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToDownloadUpdates((papers) => {
      setDownloadedPapers(papers);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenPreview = (paper: OfflinePaper) => {
    if (!paper.localUri) {
      showIceMessage(
        'PDF unavailable offline',
        'This file is not saved on this device. Download it again while online, then open it here.'
      );
      return;
    }
    setPreviewDoc({
      id: paper._id,
      mtid: paper.mtid || 'P0001',
      title: paper.title,
      unitCode: paper.unitCode,
      unitName: paper.unitName,
      school: paper.school,
      // The Downloads reader is intentionally local-only. It never streams a
      // remote fallback when the saved device copy is missing.
      fileUrl: paper.localUri,
      ttsTextUrl: paper.ttsLocalUri,
      author: paper.uploadedBy?.name || 'Moi Lecturer',
      summary: paper.title,
      sampleText: undefined
    });
    setShowPreviewModal(true);
  };

  const handleTogglePin = async (paper: OfflinePaper) => {
    await togglePinOfflinePaper(paper._id);
    setMenuPaper(null);
  };

  const handleRetry = async (paper: OfflinePaper) => {
    try {
      await retryPaperDownload(paper._id);
      setMenuPaper(null);
    } catch (error) {
      showIceMessage('Retry failed', 'Could not download this material. Check your connection and try again.');
    }
  };

  const handleRemoveCompletely = (paper: OfflinePaper) => {
    setMenuPaper(null);
    const deletePaper = async () => {
      try {
        await removeOfflinePaper(paper._id);
        setDownloadedPapers((current) => current.filter((item) => item._id !== paper._id));
        showIceMessage('Deleted', 'The material and its saved device files were removed.');
      } catch (error) {
        showIceMessage('Delete failed', 'The saved material could not be removed completely. Please try again.');
      }
    };

    // React Native's nested Modal confirmation is unreliable on web because
    // the downloads action sheet can remain above the confirmation layer.
    // Use the browser's native confirmation, then perform the same storage
    // cleanup and state refresh.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Delete "${paper.title}" from downloads?`)) {
        void deletePaper();
      }
      return;
    }

    showIceMessage(
      'Delete',
      `Are you sure you want to permanently delete "${paper.title}" from your phone? This frees up device storage immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deletePaper }
      ]
    );
  };

  const renderMediaCard = (item: OfflinePaper, index: number) => {
    const isDownloading = item.status === 'downloading';
    const isFailed = item.status === 'failed';
    const isCompleted = !isDownloading && !isFailed;
    const progress = item.progress || (isCompleted ? 100 : 5);
    const isVideo = isVideoDownload(item);

    const previewUri = isVideo
      ? (item.thumbnailLocalUri || item.thumbnail || (isLocalFileUri(item.localUri) ? item.localUri : getCloudinaryVideoPreviewUrl(item.fileUrl || item.localUri || '')))
      : (item.localUri || item.thumbnailLocalUri || item.thumbnail || '');

    const formatText = (item.fileType || (isVideo ? 'mp4' : 'jpg')).toUpperCase();
    const mediaCategory = isVideo ? 'CAMPUS VIDEO • MEDIA' : 'CAMPUS PHOTO • MEDIA';

    return (
      <View key={item._id} style={styles.downloadCardItem}>
      <TouchableOpacity
        style={[
          styles.mediaSquareCard,
          item.pinned && styles.squareCardPinned,
          isDownloading && styles.squareCardDownloading,
          isFailed && styles.squareCardUnavailable
        ]}
        activeOpacity={0.88}
        onPress={() => {
          if (isDownloading || isFailed) return;
          setMediaPreviewDoc(item);
        }}
      >
        {/* Media Filled Image / Video Preview */}
        <View style={styles.mediaThumbnailContainer}>
          <SmartMediaThumbnail
            uri={previewUri}
            videoUrl={item.fileUrl}
            type={isVideo ? 'video' : 'image'}
            title={item.title}
            fileType={item.fileType}
            showPlayBadge={true}
            style={styles.mediaCoverImage}
          />

          {/* Top-Left Dark Pill Badge (IMAGE / VIDEO / PINNED) */}
          <View style={styles.topLeftBadge}>
            {item.pinned ? (
              <View style={styles.pinBadge}>
                <PinIcon color="#fbbf24" size={10} />
                <Text style={styles.pinBadgeText}>PINNED</Text>
              </View>
            ) : isVideo ? (
              <View style={styles.videoTypeBadge}>
                <VideoIcon color="#ffffff" size={10} />
                <Text style={styles.mediaBadgeText}>VIDEO</Text>
              </View>
            ) : (
              <View style={styles.imageTypeBadge}>
                <ImageIcon color="#ffffff" size={10} />
                <Text style={styles.mediaBadgeText}>PHOTO</Text>
              </View>
            )}
          </View>

          {/* Top-Right 3-Dots Menu */}
          <View style={styles.topRightBadge}>
            <TouchableOpacity
              style={styles.moreOptionsBtn}
              onPress={(e) => {
                e.stopPropagation();
                setMenuPaper(item);
              }}
              activeOpacity={0.75}
            >
              <MoreVerticalIcon color="#0f172a" size={14} />
            </TouchableOpacity>
          </View>

          {/* Bottom-Left Status Pill */}
          <View style={styles.bottomLeftStatus}>
            {isDownloading ? (
              <View style={styles.downloadingPill}>
                <RefreshCwIcon color="#ffffff" size={10} />
                <Text style={styles.statusPillText}>Downloading...</Text>
              </View>
            ) : isFailed ? (
              <View style={styles.failedPill}>
                <CloseIcon color="#ffffff" size={10} />
                <Text style={styles.statusPillText}>Failed</Text>
              </View>
            ) : (
              <View style={styles.solvedPill}>
                <CheckIcon color="#ffffff" size={10} />
                <Text style={styles.statusPillText}>Saved</Text>
              </View>
            )}
          </View>

          {/* Bottom-Right Media Format Pill */}
          <View style={styles.bottomRightFormatPill}>
            <Text style={styles.bottomRightFormatText}>{formatText}</Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.mediaCardBody}>
          <Text style={styles.mediaCategoryLabel} numberOfLines={1}>
            {mediaCategory}
          </Text>

          <Text style={styles.mediaCardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Download Progress Bar & Cancel Row if in progress */}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrackAndPercent}>
                <View style={styles.miniProgressTrack}>
                  <View style={[styles.miniProgressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
                </View>
                <Text style={styles.progressPercentText}>{progress}%</Text>
              </View>

              <TouchableOpacity
                style={styles.cancelDownloadBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  removeOfflinePaper(item._id);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelDownloadText}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.cardDivider} />

          {/* Card Footer: Offline Ready & Action */}
          <View style={styles.mediaCardFooter}>
            <View style={styles.mediaFooterStatus}>
              {isFailed ? <CloseIcon color="#dc2626" size={12} /> : <CheckIcon color="#15803d" size={12} />}
              <Text style={[styles.mediaFooterStatusText, isFailed && styles.failedStatusText]}>{isFailed ? 'Not downloaded' : 'Offline Ready'}</Text>
            </View>

            <View style={styles.mediaFooterAction}>
              <Text style={[styles.mediaFooterActionText, isFailed && styles.failedStatusText]}>{isFailed ? 'Unavailable' : isVideo ? 'Play' : 'View'}</Text>
              {!isFailed && <ChevronRightIcon color="#15803d" size={12} />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {isFailed && (
        <TouchableOpacity
          style={styles.retryDownloadButton}
          onPress={(event) => { event.stopPropagation(); void handleRetry(item); }}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Retry download for ${item.title}`}
        >
          <RefreshCwIcon color="#ffffff" size={12} />
          <Text style={styles.retryDownloadButtonText}>Retry download</Text>
        </TouchableOpacity>
      )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={downloadedPapers}
        keyExtractor={(item) => item._id}
        numColumns={2}
        key={2}
        columnWrapperStyle={downloadedPapers.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              getDownloadedPapers().then((papers) => {
                setDownloadedPapers(papers);
                setRefreshing(false);
              });
            }}
            colors={['#15803d']}
          />
        }
        renderItem={({ item, index }) => {
          if (isMediaDownload(item)) {
            return renderMediaCard(item, index);
          }

          const isDownloading = item.status === 'downloading';
          const isFailed = item.status === 'failed';
          const isCompleted = !isDownloading && !isFailed;
          const progress = item.progress || (isCompleted ? 100 : 5);

          const thumbUri = item.thumbnailLocalUri || item.thumbnail || getMaterialCoverUrl(item);
          const mtidText = item.mtid || `P000${(index % 9) + 1}`;
          const paperTag = item.pinned ? 'PINNED' : ((item as any).paperType || 'Exam Pack');
          const downloadsCount = item.downloadsCount || (2100 + (index * 130));
          const rating = item.ratingScore || '4.8';
          const shortSchool = (item.school || 'School of Science')
            .replace('School of ', '')
            .replace('Information Sciences', 'INFO SCI')
            .toUpperCase();

          return (
            <View key={item._id} style={styles.downloadCardItem}>
            <TouchableOpacity
              style={[
                styles.squareCard,
                item.pinned && styles.squareCardPinned,
                isDownloading && styles.squareCardDownloading,
                isFailed && styles.squareCardUnavailable
              ]}
              activeOpacity={isFailed || isDownloading ? 1 : 0.88}
              onPress={() => { if (!isFailed && !isDownloading) handleOpenPreview(item); }}
            >
              {/* Image Banner Header */}
              <View style={styles.thumbnailHeader}>
                <OfflineCardThumbnail uri={thumbUri} unitCode={item.unitCode} />
                <View style={styles.thumbnailOverlay} />

                {/* Top-Left Dark Pill Badge */}
                <View style={styles.topLeftBadge}>
                  {item.pinned ? (
                    <View style={styles.pinBadge}>
                      <PinIcon color="#fbbf24" size={10} />
                      <Text style={styles.pinBadgeText}>PINNED</Text>
                    </View>
                  ) : (
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{paperTag}</Text>
                    </View>
                  )}
                </View>

                {/* Top-Right Pill / 3-Dots Menu */}
                <View style={styles.topRightBadge}>
                  <TouchableOpacity
                    style={styles.moreOptionsBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setMenuPaper(item);
                    }}
                    activeOpacity={0.75}
                  >
                    <MoreVerticalIcon color="#0f172a" size={14} />
                  </TouchableOpacity>
                </View>

                {/* Bottom-Left Status Pill */}
                <View style={styles.bottomLeftStatus}>
                  {isDownloading ? (
                    <View style={styles.downloadingPill}>
                      <RefreshCwIcon color="#ffffff" size={10} />
                      <Text style={styles.statusPillText}>Downloading...</Text>
                    </View>
                  ) : isFailed ? (
                    <View style={styles.failedPill}>
                      <CloseIcon color="#ffffff" size={10} />
                      <Text style={styles.statusPillText}>Failed</Text>
                    </View>
                  ) : (
                    <View style={styles.solvedPill}>
                      <CheckIcon color="#ffffff" size={10} />
                      <Text style={styles.statusPillText}>Saved</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                {/* Meta Line: MTID: P0001 • STA 210 • SCIENCE */}
                <Text style={styles.metaLine} numberOfLines={1}>
                  MTID: {mtidText} • {item.unitCode} • {shortSchool}
                </Text>

                {/* Card Title */}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {/* Download Progress Bar & Cancel Row if in progress */}
                {isDownloading && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrackAndPercent}>
                      <View style={styles.miniProgressTrack}>
                        <View style={[styles.miniProgressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
                      </View>
                      <Text style={styles.progressPercentText}>{progress}%</Text>
                    </View>

                    {/* Small Cancel Button Below Progress Bar */}
                    <TouchableOpacity
                      style={styles.cancelDownloadBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        removeOfflinePaper(item._id);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.cancelDownloadText}>✕ Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Divider Line */}
                <View style={styles.cardDivider} />

                {/* Card Footer: Downloads Count & Rating */}
                <View style={styles.cardFooter}>
                  <View style={styles.footerDownloads}>
                    <DownloadIcon color="#15803d" size={11} />
                    <Text style={styles.footerDownloadsText}>
                      {formatCompactNumber(downloadsCount)}
                    </Text>
                  </View>

                  <View style={styles.footerRating}>
                    <StarIcon color="#eab308" size={11} />
                    <Text style={styles.footerRatingText}>{rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            {isFailed && (
              <TouchableOpacity
                style={styles.retryDownloadButton}
                onPress={(event) => { event.stopPropagation(); void handleRetry(item); }}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Retry download for ${item.title}`}
              >
                <RefreshCwIcon color="#ffffff" size={12} />
                <Text style={styles.retryDownloadButtonText}>Retry download</Text>
              </TouchableOpacity>
            )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No Downloaded Materials"
              subtitle="Saved past papers and revision notes will appear here immediately with real-time download progress."
            />
            <TouchableOpacity
              style={styles.browseTabBtn}
              onPress={() => router.push('/(tabs)/academics')}
            >
              <Text style={styles.browseTabBtnText}>Browse Past Papers</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 3-Dots Action Sheet Options Modal */}
      <Modal
        visible={!!menuPaper}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuPaper(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuPaper(null)}
        >
          <View style={styles.optionsSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {menuPaper?.title}
              </Text>
              <TouchableOpacity onPress={() => setMenuPaper(null)}>
                <CloseIcon color="#64748b" size={20} />
              </TouchableOpacity>
            </View>

            {menuPaper && (
              <View style={styles.sheetContent}>
                {/* Action 1: Pin / Unpin */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => handleTogglePin(menuPaper)}
                >
                  <PinIcon color={menuPaper.pinned ? '#ca8a04' : '#64748b'} size={20} />
                  <Text style={styles.optionText}>
                    {menuPaper.pinned ? 'Unpin from Top' : 'Pin to Top of Downloads'}
                  </Text>
                </TouchableOpacity>

                {/* Action 2: Retry if failed */}
                {menuPaper.status === 'failed' && (
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleRetry(menuPaper)}
                  >
                    <RefreshCwIcon color="#2563eb" size={20} />
                    <Text style={[styles.optionText, { color: '#2563eb' }]}>
                      Retry Download
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Action 3: Read Offline / Play / View */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    const doc = menuPaper;
                    setMenuPaper(null);
                    if (isMediaDownload(doc)) {
                      setMediaPreviewDoc(doc);
                    } else {
                      handleOpenPreview(doc);
                    }
                  }}
                >
                  {isVideoDownload(menuPaper) ? (
                    <PlayIcon color="#15803d" size={20} />
                  ) : isImageDownload(menuPaper) ? (
                    <ImageIcon color="#15803d" size={20} />
                  ) : (
                    <BookIcon color="#15803d" size={20} />
                  )}
                  <Text style={styles.optionText}>
                    {isVideoDownload(menuPaper)
                      ? 'Play Video Full Screen'
                      : isImageDownload(menuPaper)
                      ? 'View Image Full Screen'
                      : 'Read Offline Preview'}
                  </Text>
                </TouchableOpacity>

                {/* Action 4: Delete */}
                <TouchableOpacity
                  style={[styles.optionRow, styles.optionRowDanger]}
                  onPress={() => handleRemoveCompletely(menuPaper)}
                >
                  <TrashIcon color="#dc2626" size={20} />
                  <View>
                    <Text style={styles.optionTextDanger}>Delete</Text>
                    <Text style={styles.optionSubDanger}>
                      Remove saved file from this device
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PDF Reader Modal */}
      <PDFViewerModal
        visible={showPreviewModal}
        document={previewDoc}
        onClose={() => setShowPreviewModal(false)}
        onDownload={() => {}}
      />

      {/* Full-Screen Media (Image & Video) Modal */}
      <Modal
        visible={!!mediaPreviewDoc}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setMediaPreviewDoc(null)}
      >
        <View style={styles.fullScreenMediaContainer}>
          {/* Header Bar */}
          <View style={styles.fullScreenMediaHeader}>
            <TouchableOpacity
              style={styles.fullScreenCloseBtn}
              onPress={() => setMediaPreviewDoc(null)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Close media preview"
            >
              <CloseIcon color="#ffffff" size={18} />
            </TouchableOpacity>

            <View style={styles.fullScreenHeaderInfo}>
              <Text style={styles.fullScreenHeaderTitle} numberOfLines={1}>
                {mediaPreviewDoc?.title || (isVideoDownload(mediaPreviewDoc) ? 'Video Preview' : 'Image Preview')}
              </Text>
              <Text style={styles.fullScreenHeaderSub}>
                {isVideoDownload(mediaPreviewDoc) ? 'Video Preview • Saved Offline' : 'Image Preview • Saved Offline'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.fullScreenDeleteBtn}
              onPress={() => {
                if (!mediaPreviewDoc) return;
                const target = mediaPreviewDoc;
                setMediaPreviewDoc(null);
                handleRemoveCompletely(target);
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Delete media file"
            >
              <TrashIcon color="#ef4444" size={18} />
            </TouchableOpacity>
          </View>

          {/* Media Body */}
          <View style={styles.fullScreenMediaBody}>
            {mediaPreviewDoc && isVideoDownload(mediaPreviewDoc) ? (
              Platform.OS === 'web' ? (
                <video
                  src={mediaPreviewDoc.localUri || mediaPreviewDoc.fileUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#020617',
                    outline: 'none'
                  } as any}
                />
              ) : (
                <WebView
                  source={{ html: getVideoPlayerHtml(mediaPreviewDoc.localUri || mediaPreviewDoc.fileUrl) }}
                  style={styles.fullScreenWebView}
                  originWhitelist={['*']}
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsFullscreenVideo
                />
              )
            ) : mediaPreviewDoc ? (
              <Image
                source={{ uri: mediaPreviewDoc.localUri || mediaPreviewDoc.fileUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  listContent: {
    padding: 12,
    paddingBottom: 85
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12
  },
  downloadCardItem: {
    flex: 1,
    maxWidth: '48.5%',
    gap: 6
  },
  squareCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3
  },
  squareCardPinned: {
    borderColor: '#f59e0b',
    borderWidth: 1.5,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  squareCardDownloading: {
    opacity: 0.72
  },
  squareCardUnavailable: {
    opacity: 0.62
  },
  retryDownloadButton: {
    minHeight: 32,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  retryDownloadButtonText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800'
  },
  failedStatusText: {
    color: '#dc2626'
  },
  thumbnailHeader: {
    height: 96,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f1f5f9'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  thumbnailImageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8
  },
  thumbnailFallbackCode: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)'
  },
  topLeftBadge: {
    position: 'absolute',
    top: 6,
    left: 6
  },
  typeBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800'
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  pinBadgeText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '800'
  },
  topRightBadge: {
    position: 'absolute',
    top: 6,
    right: 6
  },
  moreOptionsBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  bottomLeftStatus: {
    position: 'absolute',
    bottom: 6,
    left: 6
  },
  solvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#15803d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  downloadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  failedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800'
  },
  cardBody: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between'
  },
  metaLine: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 16.5,
    marginBottom: 6
  },
  progressContainer: {
    marginVertical: 4
  },
  progressTrackAndPercent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  miniProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 2,
    overflow: 'hidden'
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2
  },
  progressPercentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb'
  },
  cancelDownloadBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4
  },
  cancelDownloadText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#dc2626'
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerDownloads: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  footerDownloadsText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803d'
  },
  footerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  footerRatingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    width: '100%'
  },
  browseTabBtn: {
    marginTop: 16,
    backgroundColor: '#15803d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12
  },
  browseTabBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end'
  },
  optionsSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 10
  },
  sheetContent: {
    paddingVertical: 10,
    gap: 12
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc'
  },
  optionRowDanger: {
    backgroundColor: '#fef2f2'
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b'
  },
  optionTextDanger: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626'
  },
  optionSubDanger: {
    fontSize: 11,
    color: '#991b1b',
    marginTop: 1
  },
  /* Media Card Styles (Images & Videos) */
  mediaSquareCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3
  },
  mediaThumbnailContainer: {
    height: 130,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  mediaCoverImage: {
    width: '100%',
    height: '100%'
  },
  mediaPlaceholderBg: {
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  videoPlayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  videoTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#2563eb',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  imageTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  mediaBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  bottomRightFormatPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  bottomRightFormatText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  },
  mediaCardBody: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between'
  },
  mediaCategoryLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2
  },
  mediaCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 16,
    marginBottom: 6
  },
  mediaCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2
  },
  mediaFooterStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  mediaFooterStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },
  mediaFooterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  mediaFooterActionText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803d'
  },
  /* Full-Screen Media Modal Styles */
  fullScreenMediaContainer: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  },
  fullScreenMediaHeader: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10
  },
  fullScreenCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullScreenHeaderInfo: {
    flex: 1,
    marginHorizontal: 12
  },
  fullScreenHeaderTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  fullScreenHeaderSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1
  },
  fullScreenDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullScreenMediaBody: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullScreenImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#020617'
  },
  fullScreenWebView: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#020617'
  }
});
