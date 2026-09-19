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
  Dimensions
} from 'react-native';
import { useAppNavigation } from '../src/utils/navigation';
import { saveDownloadedPaper } from '../src/services/offlineStorage';
import {
  SearchIcon,
  DownloadIcon,
  StarIcon,
  ChevronRightIcon,
  NotesIcon,
  FileTextIcon
} from '../src/components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface StudyNote {
  id: string;
  title: string;
  unitCode: string;
  unitName: string;
  school: string;
  author: string;
  downloads: string;
  rating: string;
  pages: string;
  thumbnail: string;
  fileUrl: string;
  summary: string;
}

const NOTES_DATA: StudyNote[] = [
  {
    id: 'note1',
    title: 'Data Structures & Algorithms Complete Revision Notes',
    unitCode: 'COM 310',
    unitName: 'Data Structures & Algorithms',
    school: 'School of Information Sciences',
    author: 'Prof. Omondi & Dev Club',
    downloads: '1,840',
    rating: '4.9 ⭐',
    pages: '48 pages',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com310_notes.pdf',
    summary: 'Comprehensive lecture summaries covering Trees, Graphs, Sorting, Dynamic Programming & Complexity Analysis.'
  },
  {
    id: 'note2',
    title: 'STA 210 Probability & Statistics Lecture Modules 1-6',
    unitCode: 'STA 210',
    unitName: 'Statistics II',
    school: 'School of Science',
    author: 'Dr. Kiprop',
    downloads: '2,410',
    rating: '4.8 ⭐',
    pages: '64 pages',
    thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/sta210_notes.pdf',
    summary: 'Probability distributions, Hypothesis testing, Chi-Square tests, and ANOVA worked examples.'
  },
  {
    id: 'note3',
    title: 'Operating Systems Kernel & Concurrency Summary',
    unitCode: 'COM 220',
    unitName: 'Operating Systems',
    school: 'School of Information Sciences',
    author: 'Alex Kipkurui (Tech Guild)',
    downloads: '1,950',
    rating: '4.9 ⭐',
    pages: '36 pages',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com220_notes.pdf',
    summary: 'Process scheduling algorithms, Memory management, Deadlocks, Semaphores & Virtual memory.'
  },
  {
    id: 'note4',
    title: 'Software Engineering Architecture & Design Patterns',
    unitCode: 'COM 410',
    unitName: 'Software Engineering',
    school: 'School of Information Sciences',
    author: 'Dev Society Moi',
    downloads: '3,120',
    rating: '5.0 ⭐',
    pages: '52 pages',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com410_notes.pdf',
    summary: 'UML diagrams, Microservices, Agile Scrum lifecycle, Design patterns (Singleton, Factory, Observer).'
  },
  {
    id: 'note5',
    title: 'Constitutional Law I Landmark Case Studies & Summaries',
    unitCode: 'LAW 210',
    unitName: 'Constitutional Law',
    school: 'School of Law',
    author: 'Moi Law Association',
    downloads: '1,560',
    rating: '4.9 ⭐',
    pages: '72 pages',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/law210_notes.pdf',
    summary: 'Kenya Constitution 2010 analysis, Judicial precedent, Bill of Rights & Landmark Supreme Court rulings.'
  },
  {
    id: 'note6',
    title: 'Principles of Microeconomics Detailed Slide Transcripts',
    unitCode: 'ECO 101',
    unitName: 'Microeconomics',
    school: 'School of Business & Economics',
    author: 'Economics Dept',
    downloads: '2,890',
    rating: '4.7 ⭐',
    pages: '40 pages',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/eco101_notes.pdf',
    summary: 'Supply & demand elasticity, Consumer behavior, Market structures (Monopoly, Oligopoly) & Equilibrium.'
  }
];

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useAppNavigation();

  const filteredNotes = NOTES_DATA.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.unitCode.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.school.toLowerCase().includes(q)
    );
  });

  const handleDownload = async (item: StudyNote) => {
    try {
      await saveDownloadedPaper({
        _id: `note_${item.id}`,
        title: item.title,
        school: item.school,
        department: item.unitName,
        courseCode: item.unitCode,
        unitCode: item.unitCode,
        unitName: item.unitName,
        type: 'lecture_notes',
        examYear: 2025,
        fileUrl: item.fileUrl,
        fileType: 'pdf',
        uploadedBy: { _id: 'author', name: item.author } as any,
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
      Alert.alert('Download Error', 'Could not save note offline.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerIconCircle}>
          <NotesIcon color="#2563eb" size={26} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notes PDF & Study Guides</Text>
          <Text style={styles.headerSub}>Curated lecture summaries, class notes & revision materials</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon color="#94a3b8" size={18} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search notes by unit code or course name..."
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

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
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
              <View style={styles.pagesTag}>
                <Text style={styles.pagesTagText}>{item.pages}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardSchool}>{item.school}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardAuthor}>By {item.author}</Text>

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
    backgroundColor: '#eff6ff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
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
    borderColor: '#bfdbfe'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e40af'
  },
  headerSub: {
    fontSize: 12,
    color: '#3b82f6',
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
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  codeTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  pagesTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  pagesTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  cardBody: {
    padding: 14
  },
  cardSchool: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 6
  },
  cardSummary: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 12
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  cardAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
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
