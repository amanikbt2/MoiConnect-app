import React, { useState, useEffect } from 'react';
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
import {
  SearchIcon,
  DownloadIcon,
  BookIcon
} from '../src/components/Icons';

export interface CATPaperItem {
  id: string;
  title: string;
  unitCode: string;
  unitName: string;
  school: string;
  catType: 'CAT 1' | 'CAT 2' | 'Mid-Sem Quiz';
  downloads: string;
  thumbnail: string;
  fileUrl: string;
  examYear: string;
}

const CAT_PAPERS_DATA: CATPaperItem[] = [
  {
    id: 'cat1',
    title: 'COM 310 Data Structures CAT 1 2025 Revision Pack',
    unitCode: 'COM 310',
    unitName: 'Data Structures & Algorithms',
    school: 'School of Information Sciences',
    catType: 'CAT 1',
    downloads: '1,920',
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
    downloads: '2,480',
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
    downloads: '1,640',
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
    downloads: '1,890',
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
    downloads: '2,150',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/eco101_cat.pdf',
    examYear: '2025'
  }
];

export default function CatPapersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useAppNavigation();

  const filteredCats = CAT_PAPERS_DATA.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.unitCode.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.school.toLowerCase().includes(q)
    );
  });

  const handleDownload = async (item: CATPaperItem) => {
    try {
      await saveDownloadedPaper({
        _id: `cat_${item.id}`,
        title: item.title,
        school: item.school,
        department: item.unitName,
        courseCode: item.unitCode,
        unitCode: item.unitCode,
        unitName: item.unitName,
        type: 'cat_paper',
        examYear: parseInt(item.examYear, 10),
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
          <Text style={styles.headerSub}>CAT 1, CAT 2 & continuous assessment test papers with answers</Text>
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => handleDownload(item)}
          >
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: item.thumbnail }} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.codeTag}>
                <Text style={styles.codeTagText}>{item.unitCode}</Text>
              </View>
              <View style={styles.catTypeTag}>
                <Text style={styles.catTypeTagText}>{item.catType}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardSchool}>{item.school} • {item.examYear}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardDownloads}>{item.downloads} downloads</Text>

                <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)}>
                  <DownloadIcon color="#ffffff" size={13} style={{ marginRight: 4 }} />
                  <Text style={styles.downloadBtnText}>Save PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
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
    marginBottom: 10
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
