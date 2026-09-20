import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Platform
} from 'react-native';
import { useAppNavigation } from '../src/utils/navigation';
import { saveDownloadedPaper } from '../src/services/offlineStorage';
import { PDFViewerModal, formatCount, PDFDocumentItem } from '../src/components/PDFViewerModal';
import {
  SearchIcon,
  DownloadIcon,
  StarIcon,
  BookIcon
} from '../src/components/Icons';

export interface CATPaperItem {
  id: string;
  title: string;
  unitCode: string;
  unitName: string;
  school: string;
  catType: 'CAT 1' | 'CAT 2' | 'Mid-Sem Quiz';
  downloadsCount: number;
  starsCount: number;
  ratingScore: string;
  thumbnail: string;
  fileUrl: string;
  examYear: string;
}

const INITIAL_CAT_PAPERS_DATA: CATPaperItem[] = [
  {
    id: 'cat1',
    title: 'COM 310 Data Structures CAT 1 2025 Revision Pack',
    unitCode: 'COM 310',
    unitName: 'Data Structures & Algorithms',
    school: 'School of Information Sciences',
    catType: 'CAT 1',
    downloadsCount: 1920,
    starsCount: 1540,
    ratingScore: '4.9',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com310_cat1.pdf',
    examYear: '2025'
  },
  {
    id: 'cat2',
    title: 'COM 211 Java Programming CAT 2 Test & Model Answers',
    unitCode: 'COM 211',
    unitName: 'OOP in Java',
    school: 'School of Information Sciences',
    catType: 'CAT 2',
    downloadsCount: 2480,
    starsCount: 2110,
    ratingScore: '4.8',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com211_cat2.pdf',
    examYear: '2024'
  },
  {
    id: 'cat3',
    title: 'STA 210 Probability & Statistics CAT 1 Mid-Sem Paper',
    unitCode: 'STA 210',
    unitName: 'Statistics II',
    school: 'School of Science',
    catType: 'CAT 1',
    downloadsCount: 1640,
    starsCount: 1290,
    ratingScore: '4.8',
    thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/sta210_cat1.pdf',
    examYear: '2025'
  },
  {
    id: 'cat4',
    title: 'COM 220 Operating Systems CAT 1 Process Management',
    unitCode: 'COM 220',
    unitName: 'Operating Systems',
    school: 'School of Information Sciences',
    catType: 'CAT 1',
    downloadsCount: 1890,
    starsCount: 1450,
    ratingScore: '4.9',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com220_cat1.pdf',
    examYear: '2024'
  },
  {
    id: 'cat5',
    title: 'ECO 101 Microeconomics Mid-Sem Continuous Quiz',
    unitCode: 'ECO 101',
    unitName: 'Microeconomics',
    school: 'School of Business & Economics',
    catType: 'Mid-Sem Quiz',
    downloadsCount: 2150,
    starsCount: 1820,
    ratingScore: '4.7',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/eco101_cat.pdf',
    examYear: '2025'
  }
];

export default function CatPapersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [catsData, setCatsData] = useState<CATPaperItem[]>(INITIAL_CAT_PAPERS_DATA);
  const [userStars, setUserStars] = useState<Record<string, boolean>>({});

  // Fast PDF Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const router = useAppNavigation();

  const filteredCats = catsData.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.unitCode.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.school.toLowerCase().includes(q)
    );
  });

  const handleToggleStar = (id: string, e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setUserStars((prev) => {
      const isStarred = !prev[id];
      setCatsData((list) =>
        list.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            starsCount: isStarred ? item.starsCount + 1 : item.starsCount - 1
          };
        })
      );
      return { ...prev, [id]: isStarred };
    });
  };

  const handleOpenPreview = (item: CATPaperItem) => {
    setPreviewDoc({
      id: item.id,
      title: item.title,
      unitCode: item.unitCode,
      unitName: item.unitName,
      school: item.school,
      fileUrl: item.fileUrl,
      pages: 'CAT Paper PDF',
      summary: `Continuous Assessment Test (${item.catType}) Paper for ${item.unitCode} (${item.examYear}).`
    });
    setShowPreviewModal(true);
  };

  const handleDownload = async (item: PDFDocumentItem | CATPaperItem) => {
    try {
      await saveDownloadedPaper({
        _id: `cat_${item.id}`,
        title: item.title,
        school: item.school || 'Moi University',
        department: item.unitName || item.unitCode,
        courseCode: item.unitCode,
        unitCode: item.unitCode,
        unitName: item.unitName || item.unitCode,
        type: 'cat_paper',
        examYear: 2025,
        fileUrl: item.fileUrl,
        fileType: 'pdf',
        uploadedBy: { _id: 'moi_faculty', name: 'Moi Faculty Department' } as any,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      Alert.alert(
        'Downloaded Offline',
        `"${item.title}" saved to your offline downloads tab!`,
        [
          { text: 'OK' },
          { text: 'View Downloads', onPress: () => router.push('/(tabs)/downloads') }
        ]
      );
    } catch (e) {
      Alert.alert('Download Error', 'Could not save CAT paper offline.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerIconCircle}>
          <BookIcon color="#d97706" size={26} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CAT Papers & Continuous Tests</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon color="#94a3b8" size={18} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search CAT papers by unit code or course..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredCats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 800);
            }}
            colors={['#15803d']}
          />
        }
        renderItem={({ item }) => {
          const isStarred = !!userStars[item.id];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => handleOpenPreview(item)}
            >
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.codeTag}>
                  <Text style={styles.codeTagText}>{item.unitCode}</Text>
                </View>
                <View style={styles.catTypeTag}>
                  <Text style={styles.catTypeTagText}>{item.catType}</Text>
                </View>

                {/* Rating Badge Overlay */}
                <View style={styles.ratingScoreBadge}>
                  <Text style={styles.ratingScoreText}>⭐ {item.ratingScore}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardSchool}>{item.school} • {item.examYear}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                {/* Downloads & Interactive Star Button Row */}
                <View style={styles.metricsRow}>
                  <View style={styles.downloadsMeta}>
                    <DownloadIcon color="#15803d" size={13} style={{ marginRight: 4 }} />
                    <Text style={styles.downloadsText}>{formatCount(item.downloadsCount)} downloads</Text>
                  </View>

                  {/* Interactive Star Rating Button */}
                  <TouchableOpacity
                    style={[styles.starBtn, isStarred && styles.starBtnActive]}
                    onPress={(e) => handleToggleStar(item.id, e)}
                    activeOpacity={0.7}
                  >
                    <StarIcon color={isStarred ? '#ca8a04' : '#64748b'} size={14} style={{ marginRight: 4 }} />
                    <Text style={[styles.starBtnText, isStarred && styles.starBtnTextActive]}>
                      {formatCount(item.starsCount)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardDownloads}>{item.catType}</Text>

                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDownload(item);
                    }}
                  >
                    <DownloadIcon color="#ffffff" size={13} style={{ marginRight: 4 }} />
                    <Text style={styles.downloadBtnText}>Save PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Fast In-App PDF Preview Window */}
      <PDFViewerModal
        visible={showPreviewModal}
        document={previewDoc}
        onClose={() => setShowPreviewModal(false)}
        onDownload={handleDownload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    gap: 12
  },
  headerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fcd34d'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400e'
  },
  headerSub: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
    marginTop: 2
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 14,
    color: '#0f172a',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : {})
  } as any,
  listContent: {
    padding: 16,
    gap: 14
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  cardImageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a'
  },
  cardImage: {
    width: '100%',
    height: '100%'
  },
  codeTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  codeTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  catTypeTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcd34d'
  },
  catTypeTagText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '800'
  },
  ratingScoreBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  ratingScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854d0e'
  },
  cardBody: {
    padding: 14
  },
  cardSchool: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 8
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10
  },
  downloadsMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  downloadsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d'
  },
  starBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  starBtnActive: {
    backgroundColor: '#fef9c3',
    borderColor: '#fde047'
  },
  starBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  starBtnTextActive: {
    color: '#854d0e'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  cardDownloads: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  }
});
