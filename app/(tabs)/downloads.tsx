import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { IPaper } from '@moi/shared';
import { getDownloadedPapers, removeOfflinePaper } from '../../src/services/offlineStorage';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { useAppNavigation } from '../../src/utils/navigation';
import { TrashIcon, FileTextIcon, LocationIcon, BookIcon } from '../../src/components/Icons';

export default function DownloadsScreen() {
  const [downloadedPapers, setDownloadedPapers] = useState<IPaper[]>([]);
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
            await removeOfflinePaper(paper._id);
            await fetchDownloads();
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDownloads(); }} colors={['#15803d']} />
        }
        renderItem={({ item }) => (
          <View style={styles.paperCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={styles.badgeRow}>
                  <Badge label={item.type.replace('_', ' ')} variant="success" />
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
              subtitle="Saved past papers and revision notes will appear here for offline access."
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
  }
});
