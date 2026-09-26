import { showIceMessage } from '../../src/components/IceMessageCard';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { apiRequest } from '../../src/services/api';
import {
  saveDownloadedPaper,
  removeDownloadedPaper,
  isPaperDownloaded
} from '../../src/services/offlineStorage';
import { IPaper } from '@moi/shared';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { Skeleton } from '../../src/components/Skeleton';
import { formatCompactNumber } from '../../src/utils/formatters';


import { DownloadIcon, CheckIcon, StarIcon } from '../../src/components/Icons';

export default function PaperDetailScreen({ route }: any) {
  const id = route?.params?.id;
  const [paper, setPaper] = useState<IPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  const router = useAppNavigation();

  useEffect(() => {
    if (id) {
      fetchPaper();
      checkOfflineStatus();
    }
  }, [id]);

  const checkOfflineStatus = async () => {
    if (id) {
      const isSaved = await isPaperDownloaded(id);
      setSavedOffline(isSaved);
    }
  };

  const fetchPaper = async () => {
    setLoading(true);
    const res = await apiRequest<{ data: IPaper }>(`/papers/${id}`);
    setLoading(false);
    if (res.success && res.data) {
      setPaper(res.data);
    } else {
      // If offline/network failure, check if paper is stored locally
      const savedPapers = await isPaperDownloaded(id);
      if (savedPapers) {
        const allSaved = await import('../../src/services/offlineStorage').then(m => m.getDownloadedPapers());
        const found = allSaved.find(p => p._id === id);
        if (found) {
          setPaper(found);
        }
      }
    }
  };

  const handleToggleOfflineSave = async () => {
    if (!paper) return;
    if (savedOffline) {
      await removeDownloadedPaper(paper._id);
      setSavedOffline(false);
      showIceMessage('Removed Offline Paper', 'This paper has been removed from your offline storage.');
    } else {
      await saveDownloadedPaper(paper);
      setSavedOffline(true);
      showIceMessage(
        'Paper Saved Offline',
        'This past paper is now stored locally! You can read it anytime even without internet connection.'
      );
    }
  };

  const handleDownload = async () => {
    if (!paper) return;
    setDownloading(true);

    // Call API to increment download count
    await apiRequest(`/papers/${paper._id}/download`, { method: 'POST' });
    await saveDownloadedPaper(paper);
    setSavedOffline(true);

    setDownloading(false);

    // Open file URL
    Linking.openURL(paper.fileUrl).catch(() => {
      showIceMessage('Download Link', `Copy and paste this link in your browser:\n${paper.fileUrl}`);
    });
  };

  const handleSaveFavorite = async () => {
    if (!paper) return;
    const res = await apiRequest('/favorites', {
      method: 'POST',
      body: JSON.stringify({ targetType: 'paper', targetId: paper._id })
    });

    if (res.success) {
      showIceMessage('Saved', 'Paper added to your saved bookmarks.');
    } else {
      showIceMessage('Error', res.error || 'Failed to save paper.');
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 24 }}>
        <Skeleton height={30} width="80%" />
        <Skeleton height={20} width="50%" />
        <Skeleton height={150} />
      </View>
    );
  }

  if (!paper) {
    return (
      <View style={{ padding: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#64748b' }}>Paper resource not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.badgeRow}>
        <Badge label={paper.type.replace('_', ' ')} variant="green" />
        <Badge label={paper.unitCode} variant="blue" />
        <Badge label={paper.status} variant="gold" />
      </View>

      <Text style={styles.title}>{paper.title}</Text>
      <Text style={styles.unitName}>{paper.unitName}</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>School:</Text>
          <Text style={styles.infoVal}>{paper.school}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department:</Text>
          <Text style={styles.infoVal}>{paper.department}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Course Code:</Text>
          <Text style={styles.infoVal}>{paper.courseCode}</Text>
        </View>
        {paper.academicYear && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Academic Year:</Text>
            <Text style={styles.infoVal}>{paper.academicYear}</Text>
          </View>
        )}
        {paper.semester && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Semester:</Text>
            <Text style={styles.infoVal}>{paper.semester}</Text>
          </View>
        )}
        {paper.examYear && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Exam Year:</Text>
            <Text style={styles.infoVal}>{paper.examYear}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Downloads:</Text>
          <Text style={styles.infoVal}>{formatCompactNumber(paper.downloads || (paper as any).downloadCount)}</Text>
        </View>
      </View>

      {paper.description && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionHeader}>Description</Text>
          <Text style={styles.description}>{paper.description}</Text>
        </View>
      )}

      <Button
        title={savedOffline ? "Saved for Offline Reading" : "Save for Offline Reading"}
        variant={savedOffline ? "secondary" : "primary"}
        onPress={handleToggleOfflineSave}
        style={{ marginBottom: 12 }}
      />

      <Button
        title="Download PDF Document"
        onPress={handleDownload}
        loading={downloading}
        style={{ marginBottom: 12 }}
      />

      <Button
        title="Save to Bookmarks"
        variant="outline"
        onPress={handleSaveFavorite}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    flexGrow: 1
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  unitName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 16
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  infoVal: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700'
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20
  }
});
