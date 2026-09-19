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
  Dimensions,
  Platform
} from 'react-native';
import { useAppNavigation } from '../src/utils/navigation';
import { saveDownloadedPaper } from '../src/services/offlineStorage';
import {
  SearchIcon,
  DownloadIcon,
  StarIcon,
  FileTextIcon,
  ChevronRightIcon
} from '../src/components/Icons';

export interface PastPaperItem {
  id: string;
  title: string;
  unitCode: string;
  unitName: string;
  school: string;
  examYear: string;
  semester: string;
  downloads: string;
  thumbnail: string;
  fileUrl: string;
  hasSolutions: boolean;
}

const PAST_PAPERS_DATA: PastPaperItem[] = [
  {
    id: 'pp1',
    title: 'COM 310 Data Structures Main Exam Paper 2024',
    unitCode: 'COM 310',
    unitName: 'Data Structures & Algorithms',
    school: 'School of Information Sciences',
    examYear: '2024',
    semester: 'Semester 1',
    downloads: '2,940',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com310_exam2024.pdf',
    hasSolutions: true
  },
  {
    id: 'pp2',
    title: 'MAT 210 Calculus II End of Semester Exam 2024',
    unitCode: 'MAT 210',
    unitName: 'Calculus II',
    school: 'School of Science',
    examYear: '2024',
    semester: 'Semester 2',
    downloads: '3,180',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/mat210_exam2024.pdf',
    hasSolutions: true
  },
  {
    id: 'pp3',
    title: 'COM 211 Object Oriented Programming Java Final 2023',
    unitCode: 'COM 211',
    unitName: 'OOP in Java',
    school: 'School of Information Sciences',
    examYear: '2023',
    semester: 'Semester 2',
    downloads: '4,100',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com211_exam2023.pdf',
    hasSolutions: true
  },
  {
    id: 'pp4',
    title: 'STA 210 Probability & Statistics Final Exam 2024',
    unitCode: 'STA 210',
    unitName: 'Statistics II',
    school: 'School of Science',
    examYear: '2024',
    semester: 'Semester 1',
    downloads: '2,680',
    thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/sta210_exam2024.pdf',
    hasSolutions: false
  },
  {
    id: 'pp5',
    title: 'LAW 210 Constitutional Law I Past Exam 2023',
    unitCode: 'LAW 210',
    unitName: 'Constitutional Law',
    school: 'School of Law',
    examYear: '2023',
    semester: 'Semester 1',
    downloads: '1,890',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/law210_exam2023.pdf',
    hasSolutions: true
  },
  {
    id: 'pp6',
    title: 'ECO 101 Principles of Microeconomics Exam 2024',
    unitCode: 'ECO 101',
    unitName: 'Microeconomics',
    school: 'School of Business & Economics',
    examYear: '2024',
    semester: 'Semester 2',
    downloads: '3,450',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/eco101_exam2024.pdf',
    hasSolutions: false
  }
];

export default function PastPapersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useAppNavigation();

  const filteredPapers = PAST_PAPERS_DATA.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.unitCode.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.school.toLowerCase().includes(q)
    );
  });

  const handleDownload = async (item: PastPaperItem) => {
    try {
      await saveDownloadedPaper({
        _id: `pp_${item.id}`,
        title: item.title,
        school: item.school,
        department: item.unitName,
        courseCode: item.unitCode,
        unitCode: item.unitCode,
        unitName: item.unitName,
        type: 'past_paper',
        examYear: parseInt(item.examYear, 10),
        fileUrl: item.fileUrl,
        fileType: 'pdf',
        uploadedBy: { _id: 'moi_exams', name: 'Moi University Examination Board' } as any,
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
      Alert.alert('Download Error', 'Could not save past paper offline.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerIconCircle}>
          <FileTextIcon color="#15803d" size={26} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Past Exam Papers</Text>
          <Text style={styles.headerSub}>Official end-of-semester examination papers with solved solutions</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon color="#94a3b8" size={18} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search past papers by unit code or course..."
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
        data={filteredPapers}
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
              {item.hasSolutions && (
                <View style={styles.solutionTag}>
                  <Text style={styles.solutionTagText}>✓ Solved Answers</Text>
                </View>
              )}
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardSchool}>{item.school} • {item.examYear}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardSem}>{item.semester}</Text>

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
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
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
    borderColor: '#86efac'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#166534'
  },
  headerSub: {
    fontSize: 12,
    color: '#15803d',
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
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  codeTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  solutionTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac'
  },
  solutionTagText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800'
  },
  cardBody: {
    padding: 14
  },
  cardSchool: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
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
  cardSem: {
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
