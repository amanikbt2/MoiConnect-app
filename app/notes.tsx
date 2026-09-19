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
  Dimensions,
  Platform
} from 'react-native';
import { useAppNavigation } from '../src/utils/navigation';
import { saveDownloadedPaper } from '../src/services/offlineStorage';
import { PDFViewerModal, formatCount, PDFDocumentItem } from '../src/components/PDFViewerModal';
import {
  SearchIcon,
  DownloadIcon,
  StarIcon,
  ChevronRightIcon,
  NotesIcon,
  FileTextIcon
} from '../src/components/Icons';

export interface StudyNote {
  id: string;
  title: string;
  unitCode: string;
  unitName: string;
  school: string;
  author: string;
  downloadsCount: number;
  starsCount: number;
  ratingScore: string;
  pages: string;
  thumbnail: string;
  fileUrl: string;
  summary: string;
}

const INITIAL_NOTES_DATA: StudyNote[] = [
  {
    id: 'note1',
    title: 'Data Structures & Algorithms Complete Revision Notes',
    unitCode: 'COM 310',
    unitName: 'Data Structures & Algorithms',
    school: 'School of Information Sciences',
    author: 'Prof. Omondi & Dev Club',
    downloadsCount: 1840,
    starsCount: 1420,
    ratingScore: '4.9',
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
    downloadsCount: 2410,
    starsCount: 1890,
    ratingScore: '4.8',
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
    downloadsCount: 1950,
    starsCount: 1520,
    ratingScore: '4.9',
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
    downloadsCount: 3120,
    starsCount: 2840,
    ratingScore: '5.0',
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
    downloadsCount: 1560,
    starsCount: 1210,
    ratingScore: '4.9',
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
    downloadsCount: 2890,
    starsCount: 2150,
    ratingScore: '4.7',
    pages: '40 pages',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/eco101_notes.pdf',
    summary: 'Supply & demand elasticity, Consumer behavior, Market structures (Monopoly, Oligopoly) & Equilibrium.'
  }
];

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [notesData, setNotesData] = useState<StudyNote[]>(INITIAL_NOTES_DATA);
  const [userStars, setUserStars] = useState<Record<string, boolean>>({});

  // Fast PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const router = useAppNavigation();

  const filteredNotes = notesData.filter((item) => {
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
      setNotesData((list) =>
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

  const handleOpenPreview = (item: StudyNote) => {
    setPreviewDoc({
      id: item.id,
      title: item.title,
      unitCode: item.unitCode,
      unitName: item.unitName,
      school: item.school,
      fileUrl: item.fileUrl,
      pages: item.pages,
      author: item.author,
      summary: item.summary
    });
    setShowPreviewModal(true);
  };

  const handleDownload = async (item: PDFDocumentItem | StudyNote) => {
    try {
      await saveDownloadedPaper({
        _id: `note_${item.id}`,
        title: item.title,
        school: item.school || 'Moi University',
        department: item.unitName || item.unitCode,
        courseCode: item.unitCode,
        unitCode: item.unitCode,
        unitName: item.unitName || item.unitCode,
        type: 'lecture_notes',
        examYear: 2025,
        fileUrl: item.fileUrl,
        fileType: 'pdf',
        uploadedBy: { _id: 'author', name: item.author || 'Moi Lecturer' } as any,
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
                <View style={styles.pagesTag}>
                  <Text style={styles.pagesTagText}>{item.pages}</Text>
                </View>

                {/* Rating Badge Overlay */}
                <View style={styles.ratingScoreBadge}>
                  <Text style={styles.ratingScoreText}>⭐ {item.ratingScore}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardSchool}>{item.school}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>

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
                  <Text style={styles.cardAuthor}>By {item.author}</Text>

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
    marginBottom: 10
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
