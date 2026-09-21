import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import {
  getDownloadedPapers,
  removeOfflinePaper,
  togglePinOfflinePaper,
  retryPaperDownload,
  subscribeToDownloadUpdates,
  OfflinePaper
} from '../../src/services/offlineStorage';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { useAppNavigation } from '../../src/utils/navigation';
import { PDFViewerModal, PDFDocumentItem } from '../../src/components/PDFViewerModal';
import {
  TrashIcon,
  FileTextIcon,
  LocationIcon,
  BookIcon,
  MoreVerticalIcon,
  PinIcon,
  RefreshCwIcon,
  CloseIcon
} from '../../src/components/Icons';

export default function DownloadsScreen() {
  const [downloadedPapers, setDownloadedPapers] = useState<OfflinePaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      title: paper.title,
      unitCode: paper.unitCode,
      unitName: paper.unitName,
      school: paper.school,
      fileUrl: paper.fileUrl,
      pages: 'PDF Document',
      author: paper.uploadedBy?.name || 'Moi Lecturer',
      summary: paper.title
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
        renderItem={({ item }) => {
          const isDownloading = item.status === 'downloading';
          const isFailed = item.status === 'failed';
          const isCompleted = !isDownloading && !isFailed;
          const progress = item.progress || (isCompleted ? 100 : 5);

          return (
            <View style={[styles.paperCard, item.pinned && styles.paperCardPinned]}>
              {/* Card Header Top Row */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.badgeRow}>
                    {item.pinned && (
                      <View style={styles.pinnedBadge}>
                        <PinIcon color="#854d0e" size={12} />
                        <Text style={styles.pinnedBadgeText}>Pinned</Text>
                      </View>
                    )}

                    {isDownloading ? (
                      <Badge label={`Downloading ${progress}%`} variant="info" />
                    ) : isFailed ? (
                      <Badge label="Failed" variant="danger" />
                    ) : (
                      <Badge label={item.type ? item.type.replace('_', ' ') : 'offline ready'} variant="success" />
                    )}

                    {!!item.examYear && <Text style={styles.examYearText}>{item.examYear} Exam</Text>}
                  </View>

                  <Text style={styles.paperTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.paperUnit}>
                    {item.unitCode} {item.unitName ? `• ${item.unitName}` : ''}
                  </Text>
                </View>

                {/* 3-Dots Options Menu Trigger */}
                <TouchableOpacity
                  style={styles.moreOptionsBtn}
                  onPress={() => setMenuPaper(item)}
                  activeOpacity={0.7}
                >
                  <MoreVerticalIcon color="#64748b" size={20} />
                </TouchableOpacity>
              </View>

              {/* Progress Bar during Download */}
              {isDownloading && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
                  </View>
                  <Text style={styles.progressLabelText}>Saving offline... {progress}%</Text>
                </View>
              )}

              {/* School Tag */}
              <View style={styles.schoolInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <LocationIcon color="#64748b" size={14} />
                  <Text style={styles.schoolText}>
                    {item.school} {item.department ? `(${item.department})` : ''}
                  </Text>
                </View>
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                {isFailed ? (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => handleRetry(item)}
                    activeOpacity={0.8}
                  >
                    <RefreshCwIcon color="#ffffff" size={15} />
                    <Text style={styles.retryBtnText}>Retry Download</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.readBtn, isDownloading && styles.readBtnDisabled]}
                    onPress={() => handleOpenPreview(item)}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    <BookIcon color="#ffffff" size={14} />
                    <Text style={styles.readBtnText}>
                      {isDownloading ? 'Downloading...' : 'Read Offline'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.quickRemoveBtn}
                  onPress={() => handleRemoveCompletely(item)}
                  activeOpacity={0.7}
                >
                  <TrashIcon color="#ef4444" size={18} />
                </TouchableOpacity>
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
        onDownload={(doc) => {
          // Trigger download if required
        }}
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
    padding: 16
  },
  paperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  paperCardPinned: {
    borderColor: '#fde047',
    borderLeftWidth: 4,
    borderLeftColor: '#eab308',
    backgroundColor: '#fffdf5'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap'
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef9c3',
    borderColor: '#fde047',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  pinnedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#854d0e'
  },
  examYearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 21
  },
  paperUnit: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  moreOptionsBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  progressContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3
  },
  progressLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af'
  },
  schoolInfo: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12
  },
  schoolText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500'
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  readBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 10
  },
  readBtnDisabled: {
    backgroundColor: '#94a3b8'
  },
  readBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  quickRemoveBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center'
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
