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
  Image
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
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80'
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

  const handleToggleStar = (id: string) => {
    setStarredPapers((prev) => ({ ...prev, [id]: !prev[id] }));
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
          const isStarred = !!starredPapers[item._id];

          const thumbUri = item.thumbnail || FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length];
          const mtidText = item.mtid || `P000${(index % 9) + 1}`;
          const semesterText = item.semester || 'SEMESTER 1';
          const yearText = item.examYear || '2024';
          const downloadsCount = item.downloadsCount || 2900;
          const rating = item.ratingScore || '4.9';

          return (
            <View style={[styles.cardContainer, item.pinned && styles.cardContainerPinned]}>
              {/* Card Image Banner Header */}
              <View style={styles.thumbnailHeader}>
                <Image source={{ uri: thumbUri }} style={styles.thumbnailImage} resizeMode="cover" />
                <View style={styles.thumbnailOverlay} />

                {/* Top Left: Smart Pin Badge & Unit Code Pill */}
                <View style={styles.topBarLeft}>
                  {item.pinned && (
                    <View style={styles.smartPinBadge}>
                      <PinIcon color="#f59e0b" size={13} />
                      <Text style={styles.smartPinText}>PINNED</Text>
                    </View>
                  )}
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitBadgeText}>{item.unitCode}</Text>
                  </View>
                </View>

                {/* Top Right: ⭐ Rating Badge & 3-Dots Menu Trigger */}
                <View style={styles.topBarRight}>
                  <View style={styles.ratingBadge}>
                    <StarIcon color="#eab308" size={11} />
                    <Text style={styles.ratingBadgeText}>{rating}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.moreOptionsBtn}
                    onPress={() => setMenuPaper(item)}
                    activeOpacity={0.75}
                  >
                    <MoreVerticalIcon color="#0f172a" size={18} />
                  </TouchableOpacity>
                </View>

                {/* Bottom Left of Image Header: Solved Badge */}
                <View style={styles.bottomBarLeft}>
                  {isDownloading ? (
                    <View style={[styles.downloadingPill, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                      <RefreshCwIcon color="#ca8a04" size={12} />
                      <Text style={styles.downloadingPillText}>Saving {progress}%</Text>
                    </View>
                  ) : isFailed ? (
                    <View style={[styles.failedPill, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                      <CloseIcon color="#b91c1c" size={12} />
                      <Text style={styles.failedPillText}>Download Failed</Text>
                    </View>
                  ) : (
                    <View style={styles.solvedBadge}>
                      <CheckIcon color="#ffffff" size={12} />
                      <Text style={styles.solvedBadgeText}>Solved</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                {/* Metadata Header Line: MTID • SEMESTER • YEAR */}
                <Text style={styles.metadataText}>
                  MTID: {mtidText} • {semesterText.toUpperCase()} • {yearText}
                </Text>

                {/* Card Main Title */}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {/* Card Subtitle / School */}
                <Text style={styles.cardSubTitle} numberOfLines={1}>
                  {item.school || 'School of Information Sciences'}
                </Text>

                {/* Download Progress Bar if in progress */}
                {isDownloading && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
                    </View>
                    <Text style={styles.progressLabelText}>Saving offline... {progress}%</Text>
                  </View>
                )}

                <View style={styles.cardDivider} />

                {/* Card Footer Row */}
                <View style={styles.cardFooter}>
                  {/* Left: Download icon + count */}
                  <View style={styles.footerDownloads}>
                    <DownloadIcon color="#15803d" size={13} />
                    <Text style={styles.footerDownloadsText}>{formatCompactNumber(downloadsCount)}</Text>
                  </View>

                  <View style={styles.footerRightGroup}>
                    {/* Middle: Star Icon Button inside square box */}
                    <TouchableOpacity
                      style={[styles.squareStarBtn, isStarred && styles.squareStarBtnActive]}
                      onPress={() => handleToggleStar(item._id)}
                      activeOpacity={0.8}
                    >
                      <StarIcon color={isStarred ? '#ca8a04' : '#64748b'} size={15} />
                    </TouchableOpacity>

                    {/* Right: Green Circular Read Button with Chevron Right Icon */}
                    <TouchableOpacity
                      style={[styles.circleReadBtn, isDownloading && styles.circleReadBtnDisabled]}
                      onPress={() => handleOpenPreview(item)}
                      disabled={isDownloading}
                      activeOpacity={0.8}
                    >
                      <ChevronRightIcon color="#15803d" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
    padding: 16,
    paddingBottom: 40
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3
  },
  cardContainerPinned: {
    borderColor: '#fde047',
    borderWidth: 1.5,
    shadowColor: '#eab308',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  thumbnailHeader: {
    height: 125,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)'
  },
  topBarLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  smartPinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  smartPinText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  unitBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  unitBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  topBarRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a'
  },
  moreOptionsBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  bottomBarLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  solvedBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  downloadingPill: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  downloadingPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  failedPill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  failedPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  cardBody: {
    padding: 14
  },
  metadataText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4,
    letterSpacing: 0.3
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
    lineHeight: 20
  },
  cardSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8
  },
  progressContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#dbeafe',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3
  },
  progressLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1e40af'
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerDownloads: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  footerDownloadsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d'
  },
  footerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  squareStarBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  squareStarBtnActive: {
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde047'
  },
  circleReadBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  circleReadBtnDisabled: {
    backgroundColor: '#e2e8f0'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40
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
  /* Modal Options Sheet */
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
