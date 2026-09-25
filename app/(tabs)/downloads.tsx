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
  Platform
} from 'react-native';
import {
  getDownloadedPapers,
  removeOfflinePaper,
  togglePinOfflinePaper,
  retryPaperDownload,
  subscribeToDownloadUpdates,
  OfflinePaper
} from '../../src/services/offlineStorage';
import { EmptyState } from '../../src/components/EmptyState';
import { useAppNavigation } from '../../src/utils/navigation';
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
  CheckIcon
} from '../../src/components/Icons';

const FALLBACK_THUMBNAILS = [
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'
];

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

  const router = useAppNavigation();

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
    setPreviewDoc({
      id: paper._id,
      mtid: paper.mtid || 'P0001',
      title: paper.title,
      unitCode: paper.unitCode,
      unitName: paper.unitName,
      school: paper.school,
      fileUrl: paper.fileUrl,
      pages: 'PDF Document',
      author: paper.uploadedBy?.name || 'Moi Lecturer',
      summary: paper.title,
      sampleText: `Offline Saved Examination Document for ${paper.unitCode} (${paper.unitName || paper.title}). All sections available for offline reading.`
    });
    setShowPreviewModal(true);
  };

  const handleTogglePin = async (paper: OfflinePaper) => {
    await togglePinOfflinePaper(paper._id);
    setMenuPaper(null);
  };

  const handleRetry = async (paper: OfflinePaper) => {
    await retryPaperDownload(paper._id);
    setMenuPaper(null);
  };

  const handleRemoveCompletely = (paper: OfflinePaper) => {
    setMenuPaper(null);
    Alert.alert(
      'Wipe from Device Storage',
      `Are you sure you want to permanently delete "${paper.title}" from your phone? This frees up device storage immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Completely',
          style: 'destructive',
          onPress: async () => {
            await removeOfflinePaper(paper._id);
          }
        }
      ]
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
          const isDownloading = item.status === 'downloading';
          const isFailed = item.status === 'failed';
          const isCompleted = !isDownloading && !isFailed;
          const progress = item.progress || (isCompleted ? 100 : 5);

          const thumbUri = item.thumbnail || FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length];
          const mtidText = item.mtid || `P000${(index % 9) + 1}`;
          const paperTag = item.pinned ? 'PINNED' : (item.paperType || 'Exam Pack');
          const downloadsCount = item.downloadsCount || (2100 + (index * 130));
          const rating = item.ratingScore || '4.8';
          const shortSchool = (item.school || 'School of Science')
            .replace('School of ', '')
            .replace('Information Sciences', 'INFO SCI')
            .toUpperCase();

          return (
            <TouchableOpacity
              style={[styles.squareCard, item.pinned && styles.squareCardPinned]}
              activeOpacity={0.88}
              onPress={() => handleOpenPreview(item)}
            >
              {/* Image Banner Header */}
              <View style={styles.thumbnailHeader}>
                <Image source={{ uri: thumbUri }} style={styles.thumbnailImage} resizeMode="cover" />
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
                      <Text style={styles.statusPillText}>{progress}%</Text>
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

                {/* Download Progress Bar if in progress */}
                {isDownloading && (
                  <View style={styles.miniProgressTrack}>
                    <View style={[styles.miniProgressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
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

                {/* Action 3: Read Offline */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    const doc = menuPaper;
                    setMenuPaper(null);
                    handleOpenPreview(doc);
                  }}
                >
                  <BookIcon color="#15803d" size={20} />
                  <Text style={styles.optionText}>Read Offline Preview</Text>
                </TouchableOpacity>

                {/* Action 4: Wipe Completely */}
                <TouchableOpacity
                  style={[styles.optionRow, styles.optionRowDanger]}
                  onPress={() => handleRemoveCompletely(menuPaper)}
                >
                  <TrashIcon color="#dc2626" size={20} />
                  <View>
                    <Text style={styles.optionTextDanger}>Wipe from Device Storage</Text>
                    <Text style={styles.optionSubDanger}>
                      Completely deletes file to free up phone space
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
    paddingBottom: 40
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12
  },
  squareCard: {
    flex: 1,
    maxWidth: '48.5%',
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
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  miniProgressTrack: {
    height: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 4
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2
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
  }
});
