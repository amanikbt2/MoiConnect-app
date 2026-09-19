import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { IPaper } from '@moi/shared';
import { getDownloadedPapers, removeDownloadedPaper } from '../../src/services/offlineStorage';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { useAppNavigation } from '../../src/utils/navigation';
import { DownloadIcon, SearchIcon, TrashIcon, FileTextIcon, LockIcon, LocationIcon, BookIcon } from '../../src/components/Icons';

export default function DownloadsScreen() {
  const [downloadedPapers, setDownloadedPapers] = useState<IPaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useAppNavigation();

  const fetchDownloads = useCallback(async () => {
    setLoading(true);
    const papers = await getDownloadedPapers();
    setDownloadedPapers(papers);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const handleDelete = (paper: IPaper) => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${paper.title}" from your offline downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeDownloadedPaper(paper._id);
            await fetchDownloads();
          }
        }
      ]
    );
  };

  const filteredPapers = downloadedPapers.filter((paper) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      paper.title.toLowerCase().includes(q) ||
      paper.unitCode.toLowerCase().includes(q) ||
      paper.unitName.toLowerCase().includes(q) ||
      paper.courseCode.toLowerCase().includes(q) ||
      paper.department.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Banner Information */}
      <View style={styles.banner}>
        <View style={styles.bannerIconContainer}>
          <DownloadIcon color="#15803d" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Offline Storage Vault</Text>
          <Text style={styles.bannerSub}>
            Materials saved here are stored in app sandbox storage and can be accessed without internet connectivity.
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <FlatList
        data={filteredPapers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDownloads(); }} colors={['#15803d']} />
        }
        ListHeaderComponent={
          <View>
            {/* Search Input */}
            <View style={styles.searchRow}>
              <SearchIcon color="#94a3b8" size={18} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search downloaded materials (e.g. COM 310)..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearBtn}>Close</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Storage Summary */}
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {downloadedPapers.length} {downloadedPapers.length === 1 ? 'file' : 'files'} saved offline
              </Text>
              <View style={styles.secTag}>
                <LockIcon color="#15803d" size={12} />
                <Text style={styles.secTagText}>App Protected Storage</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.paperCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={styles.badgeRow}>
                  <Badge label={item.type.replace('_', ' ')} variant="blue" />
                  <Text style={styles.examYearText}>{item.examYear} Exam</Text>
                </View>
                <Text style={styles.paperTitle}>{item.title}</Text>
                <Text style={styles.paperUnit}>
                  {item.unitCode} - {item.unitName}
                </Text>
              </View>
              <FileTextIcon color="#15803d" size={28} />
            </View>

            <View style={styles.schoolInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <LocationIcon color="#64748b" size={14} />
                <Text style={styles.schoolText}>{item.school} ({item.department})</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.readBtn}
                onPress={() => router.push(`/paper/${item._id}`)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <BookIcon color="#ffffff" size={14} />
                  <Text style={styles.readBtnText}>Read Offline</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <TrashIcon color="#ef4444" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No Downloaded Materials"
              message="Save past papers, CATs, or notes for offline access while browsing in the Academics tab."
            />
            <TouchableOpacity
              style={styles.browseTabBtn}
              onPress={() => router.push('/(tabs)/academics')}
            >
              <Text style={styles.browseTabBtnText}>Browse Academics Tab</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  bannerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534'
  },
  bannerSub: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2
  },
  listContent: {
    padding: 16
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a'
  },
  clearBtn: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 4
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2
  },
  statsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  secTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  secTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1'
  },
  paperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
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
    marginBottom: 6
  },
  examYearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2
  },
  paperUnit: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500'
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
    color: '#475569'
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  readBtn: {
    flex: 1,
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  readBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  deleteBtn: {
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
    marginTop: 20
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
  }
});
