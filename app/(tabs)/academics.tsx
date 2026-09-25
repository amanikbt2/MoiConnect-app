import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { IPaper, MOI_SCHOOLS, PAPER_TYPES } from '@moi/shared';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { useAppNavigation } from '../../src/utils/navigation';
import { getDownloadedPapers, saveDownloadedPaper } from '../../src/services/offlineStorage';
import { PDFViewerModal, formatCount, PDFDocumentItem } from '../../src/components/PDFViewerModal';

import {
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  ChevronRightIcon,
  FileTextIcon,
  BookIcon,
  FlameIcon,
  ZapIcon,
  TrendingUpIcon,
  DocumentIcon,
  EditIcon,
  CalendarIcon
} from '../../src/components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export interface NoteItem {
  id: string;
  mtid?: string;
  title: string;
  unitCode: string;
  unitName: string;
  school: string;
  paperType: string;
  downloads: string;
  rating: string;
  examYear: string;
  tag: string;
  thumbnail: string;
  author: string;
  fileUrl?: string;
}

// Mock Data Sets
const FOR_YOU_CAROUSEL: NoteItem[] = [
  {
    id: 'fy1',
    mtid: 'N0001',
    title: 'Data Structures & Algorithms Complete Revision Notes',
    unitCode: 'COM 310',
    unitName: 'Data Structures',
    school: 'Info Sciences',
    paperType: 'Revision Notes',
    downloads: '1,420',
    rating: '4.9 ⭐',
    examYear: '2025',
    tag: '✨ 99% Match',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    author: 'Prof. Omondi'
  },
  {
    id: 'fy2',
    mtid: 'P0001',
    title: 'STA 210 Probability & Statistics Final Exam Prep Pack',
    unitCode: 'STA 210',
    unitName: 'Statistics II',
    school: 'School of Science',
    paperType: 'Exam Pack',
    downloads: '2,180',
    rating: '4.8 ⭐',
    examYear: '2024',
    tag: '✨ Top Recommendation',
    thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
    author: 'Dr. Kiprop'
  },
  {
    id: 'fy3',
    mtid: 'P0002',
    title: 'Calculus II Integration & Infinite Series Solutions',
    unitCode: 'MAT 210',
    unitName: 'Calculus II',
    school: 'School of Science',
    paperType: 'Worked Solutions',
    downloads: '980',
    rating: '5.0 ⭐',
    examYear: '2024',
    tag: '✨ High Rating',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
    author: 'Math Club Moi'
  },
  {
    id: 'fy4',
    mtid: 'N0002',
    title: 'Operating Systems Kernel & Concurrency Summary',
    unitCode: 'COM 220',
    unitName: 'Operating Systems',
    school: 'Info Sciences',
    paperType: 'PDF Summary',
    downloads: '1,750',
    rating: '4.7 ⭐',
    examYear: '2025',
    tag: '✨ Recommended',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    author: 'Alex K.'
  },
  {
    id: 'fy5',
    mtid: 'N0003',
    title: 'Software Engineering Architecture & Design Patterns',
    unitCode: 'COM 410',
    unitName: 'Software Eng',
    school: 'Info Sciences',
    paperType: 'Cheatsheet',
    downloads: '3,110',
    rating: '4.9 ⭐',
    examYear: '2024',
    tag: '✨ Popular Year 4',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    author: 'Dev Society'
  }
];

const GRID_SECTION_1: NoteItem[] = [
  {
    id: 'g1_1',
    mtid: 'P0003',
    title: 'Discrete Mathematics Logic & Graph Theory',
    unitCode: 'COM 112',
    unitName: 'Discrete Math',
    school: 'Math Dept',
    paperType: 'Past Paper',
    downloads: '890',
    rating: '4.8',
    examYear: '2024',
    tag: 'CAT 1 + 2',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
    author: 'Dept Notes'
  },
  {
    id: 'g1_2',
    mtid: 'N0004',
    title: 'Information Storage & Retrieval Systems Guide',
    unitCode: 'INS 320',
    unitName: 'Info Retrieval',
    school: 'Info Sciences',
    paperType: 'Notes PDF',
    downloads: '640',
    rating: '4.7',
    examYear: '2025',
    tag: 'Full Syllabus',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    author: 'Jane W.'
  },
  {
    id: 'g1_3',
    mtid: 'N0005',
    title: 'Constitutional Law I Landmark Case Studies',
    unitCode: 'LAW 210',
    unitName: 'Constitutional Law',
    school: 'School of Law',
    paperType: 'Case Book',
    downloads: '1,210',
    rating: '5.0',
    examYear: '2024',
    tag: 'Verified',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    author: 'Law Reps'
  },
  {
    id: 'g1_4',
    mtid: 'N0006',
    title: 'Principles of Microeconomics Lecture Slides',
    unitCode: 'ECO 101',
    unitName: 'Microeconomics',
    school: 'Business School',
    paperType: 'Lecture Slides',
    downloads: '1,890',
    rating: '4.6',
    examYear: '2025',
    tag: 'Year 1 Core',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    author: 'Econ Dept'
  },
  {
    id: 'g1_5',
    mtid: 'N0007',
    title: 'Educational Psychology Learning Theories',
    unitCode: 'EDU 211',
    unitName: 'Edu Psychology',
    school: 'School of Education',
    paperType: 'Revision Pack',
    downloads: '730',
    rating: '4.8',
    examYear: '2024',
    tag: 'Exam Ready',
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    author: 'Grace M.'
  },
  {
    id: 'g1_6',
    mtid: 'N0008',
    title: 'General University Physics Mechanics & Optics',
    unitCode: 'PHY 110',
    unitName: 'Physics I',
    school: 'School of Science',
    paperType: 'Formula Sheet',
    downloads: '1,450',
    rating: '4.9',
    examYear: '2025',
    tag: 'Solved Problems',
    thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80',
    author: 'Physics Lab'
  },
  {
    id: 'g1_7',
    mtid: 'N0009',
    title: 'Organic Chemistry II Mechanisms & Reaction Paths',
    unitCode: 'CHM 112',
    unitName: 'Organic Chem',
    school: 'School of Science',
    paperType: 'Diagram Notes',
    downloads: '920',
    rating: '4.7',
    examYear: '2024',
    tag: 'High Yield',
    thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
    author: 'Brian N.'
  },
  {
    id: 'g1_8',
    mtid: 'N0010',
    title: 'Human Anatomy & Physiology Clinical Summaries',
    unitCode: 'NUR 202',
    unitName: 'Anatomy',
    school: 'School of Nursing',
    paperType: 'Study Guide',
    downloads: '1,680',
    rating: '5.0',
    examYear: '2025',
    tag: 'Medical Core',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    author: 'Nurse Guild'
  },
  {
    id: 'g1_9',
    mtid: 'N0011',
    title: 'Advanced Academic Writing & Essay Structuring',
    unitCode: 'ENG 105',
    unitName: 'Communication',
    school: 'Humanities',
    paperType: 'PDF Guide',
    downloads: '2,040',
    rating: '4.9',
    examYear: '2024',
    tag: 'All Schools',
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
    author: 'Dept of Lit'
  }
];

const TRENDING_CAROUSEL: NoteItem[] = [
  {
    id: 'tr1',
    title: 'Object-Oriented Programming (Java) Exam 2024 with Solutions',
    unitCode: 'COM 211',
    unitName: 'OOP Java',
    school: 'Info Sciences',
    paperType: 'Exam + Answer',
    downloads: '4,200',
    rating: '5.0 ⭐',
    examYear: '2024',
    tag: '🔥 #1 Trending',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    author: 'Moi Code Hub'
  },
  {
    id: 'tr2',
    title: 'Database Management Systems CAT 1 Worked Answers',
    unitCode: 'COM 315',
    unitName: 'DBMS SQL',
    school: 'Info Sciences',
    paperType: 'CAT Answers',
    downloads: '3,850',
    rating: '4.9 ⭐',
    examYear: '2025',
    tag: '🔥 #2 Trending',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80',
    author: 'Sammy T.'
  },
  {
    id: 'tr3',
    title: 'Microprocessor Systems Assembly Language Notes',
    unitCode: 'COM 322',
    unitName: 'Microprocessors',
    school: 'Info Sciences',
    paperType: 'Lab Manual',
    downloads: '2,910',
    rating: '4.8 ⭐',
    examYear: '2024',
    tag: '🔥 #3 Trending',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    author: 'Hardware Rep'
  },
  {
    id: 'tr4',
    title: 'Research Methods & Project Proposal Writing Guide',
    unitCode: 'INS 410',
    unitName: 'Research Methods',
    school: 'Info Sciences',
    paperType: 'Proposal Template',
    downloads: '5,100',
    rating: '5.0 ⭐',
    examYear: '2025',
    tag: '🔥 #4 Trending',
    author: 'Dr. Wanjala',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tr5',
    title: 'Linear Algebra Systems of Equations & Vector Spaces',
    unitCode: 'MAT 110',
    unitName: 'Linear Algebra',
    school: 'School of Science',
    paperType: 'Formula & Proofs',
    downloads: '2,640',
    rating: '4.9 ⭐',
    examYear: '2024',
    tag: '🔥 #5 Trending',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
    author: 'Math Club'
  }
];

const GRID_SECTION_2: NoteItem[] = [
  {
    id: 'g2_1',
    title: 'Artificial Intelligence & Machine Learning Fundamentals',
    unitCode: 'COM 420',
    unitName: 'AI & ML',
    school: 'Info Sciences',
    paperType: 'Python Code + PDF',
    downloads: '2,310',
    rating: '5.0',
    examYear: '2025',
    tag: 'New Release',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80',
    author: 'AI Lab'
  },
  {
    id: 'g2_2',
    title: 'Business Administration & Organizational Behavior',
    unitCode: 'BAM 310',
    unitName: 'Business Mgmt',
    school: 'Business School',
    paperType: 'Lecture Summary',
    downloads: '1,120',
    rating: '4.7',
    examYear: '2024',
    tag: 'Popular',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    author: 'MBA Class'
  },
  {
    id: 'g2_3',
    title: 'Time Series Analysis & Forecasting Methods',
    unitCode: 'STA 310',
    unitName: 'Time Series',
    school: 'School of Science',
    paperType: 'R Script + Notes',
    downloads: '940',
    rating: '4.8',
    examYear: '2025',
    tag: 'Stats Core',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    author: 'Stat Lab'
  },
  {
    id: 'g2_4',
    title: 'History of East Africa Pre-Colonial to Modern Era',
    unitCode: 'HIS 110',
    unitName: 'History I',
    school: 'Humanities',
    paperType: 'Essay Compilation',
    downloads: '680',
    rating: '4.6',
    examYear: '2024',
    tag: 'Year 1',
    thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
    author: 'Hist Society'
  },
  {
    id: 'g2_5',
    title: 'Cloud Computing & AWS Architecture Guide',
    unitCode: 'COM 430',
    unitName: 'Cloud Systems',
    school: 'Info Sciences',
    paperType: 'Lab Practical',
    downloads: '1,950',
    rating: '4.9',
    examYear: '2025',
    tag: 'Industry Ready',
    thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    author: 'Cloud Club'
  },
  {
    id: 'g2_6',
    title: 'Introduction to Computer Programming C++',
    unitCode: 'COM 110',
    unitName: 'C++ Prog',
    school: 'Info Sciences',
    paperType: 'Past Paper + Sol',
    downloads: '3,400',
    rating: '4.8',
    examYear: '2024',
    tag: 'Freshman Essential',
    thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
    author: 'Peer Tutors'
  },
  {
    id: 'g2_7',
    title: 'Digital Electronics Logic Gates & Flip Flops',
    unitCode: 'COM 210',
    unitName: 'Digital Logic',
    school: 'Info Sciences',
    paperType: 'Diagram Book',
    downloads: '1,560',
    rating: '4.7',
    examYear: '2025',
    tag: 'Circuit Schematics',
    thumbnail: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
    author: 'Hardware Team'
  },
  {
    id: 'g2_8',
    title: 'Mobile Application Development React Native Expo',
    unitCode: 'COM 340',
    unitName: 'Mobile Dev',
    school: 'Info Sciences',
    paperType: 'Project Code Notes',
    downloads: '2,890',
    rating: '5.0',
    examYear: '2025',
    tag: 'Hot Course',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
    author: 'Moi App Devs'
  },
  {
    id: 'g2_9',
    title: 'E-Commerce Systems Payment Gateway Integration',
    unitCode: 'BIT 301',
    unitName: 'E-Commerce',
    school: 'Info Sciences',
    paperType: 'Case Study Notes',
    downloads: '1,280',
    rating: '4.8',
    examYear: '2024',
    tag: 'Fintech Focus',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0a670fc80799?auto=format&fit=crop&w=600&q=80',
    author: 'Kevin O.'
  }
];

const FILTER_DISCS = [
  { id: 'all', label: 'All Resources', iconType: 'all' },
  { id: 'hot', label: 'Hot Now', iconType: 'flame' },
  { id: 'profile', label: 'For You', iconType: 'sparkles' },
  { id: 'new', label: 'New Releases', iconType: 'zap' },
  { id: 'trending', label: 'Trending', iconType: 'trending' },
  { id: 'past_paper', label: 'Past Papers', iconType: 'document' },
  { id: 'cat', label: 'CAT Papers', iconType: 'edit' },
  { id: 'date', label: 'Filter by Date', iconType: 'calendar' },
];

function ShimmerGridLoader({ title }: { title?: string }) {
  const fadeAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.95,
          duration: 650,
          useNativeDriver: Platform.OS !== 'web'
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: Platform.OS !== 'web'
        })
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim]);

  return (
    <View style={styles.shimmerContainer}>
      <View style={styles.shimmerHeaderRow}>
        <Animated.View style={[styles.shimmerDot, { opacity: fadeAnim }]} />
        <Text style={styles.shimmerLoadingLabel}>{title || 'Fetching 2 more lines of notes...'}</Text>
      </View>
      <View style={styles.gridContainer}>
        {[1, 2].map((idx) => (
          <Animated.View key={idx} style={[styles.shimmerCard, { opacity: fadeAnim }]}>
            <View style={styles.shimmerThumbnail} />
            <View style={styles.shimmerBody}>
              <View style={styles.shimmerBadge} />
              <View style={styles.shimmerTitleLine} />
              <View style={styles.shimmerSubLine} />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

export default function AcademicsScreen({ route }: any) {
  const router = useAppNavigation();
  const [activeTab, setActiveTab] = useState<'browse' | 'submissions' | 'offline'>('browse');
  const [activeFilterDisc, setActiveFilterDisc] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<IPaper[]>([]);
  const [mySubmissions, setMySubmissions] = useState<IPaper[]>([]);
  const [downloadedPapers, setDownloadedPapers] = useState<IPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Facebook-style Lazy Loading State (start with 4 items = 2 lines)
  const [visibleCountSection1, setVisibleCountSection1] = useState(4);
  const [visibleCountSection2, setVisibleCountSection2] = useState(4);
  const [loadingMoreSection1, setLoadingMoreSection1] = useState(false);
  const [loadingMoreSection2, setLoadingMoreSection2] = useState(false);

  // Carousel Active Indexes
  const [forYouIndex, setForYouIndex] = useState(0);
  const [trendingIndex, setTrendingIndex] = useState(0);

  // Fast PDF Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [realUploadedNotes, setRealUploadedNotes] = useState<NoteItem[]>([]);

  const fetchRealAcademicPapers = async () => {
    try {
      const res = await apiRequest<{ data: IPaper[] }>('/papers');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: NoteItem[] = res.data.map((p) => ({
          id: p._id || (p as any).id,
          mtid: p.mtid || `N${(p._id || '').substring(0, 4)}`,
          title: p.title,
          unitCode: p.unitCode || p.courseCode || 'MOI',
          unitName: p.unitName || p.title,
          school: p.school || 'Moi University',
          paperType: p.type === 'notes' ? 'Revision Notes' : (p.type === 'cat' ? 'CAT Paper' : 'Past Paper'),
          downloads: formatCount(p.downloads || 65),
          rating: '4.9 ⭐',
          examYear: String(p.examYear || 2025),
          tag: '✨ Real Uploaded',
          thumbnail: p.fileUrl?.match(/\.(jpg|jpeg|png|webp)/i)
            ? p.fileUrl
            : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
          author: typeof p.submittedBy === 'object' && p.submittedBy ? (p.submittedBy as any).name || 'Moi Student' : 'Moi Student',
          fileUrl: p.fileUrl
        }));
        setRealUploadedNotes(mapped);
      }
    } catch (err) {
      console.log('Error fetching real academic papers:', err);
    }
  };

  useEffect(() => {
    fetchRealAcademicPapers();
  }, []);

  const handleOpenPreview = (item: NoteItem) => {
    setPreviewDoc({
      id: item.id,
      mtid: item.mtid,
      title: item.title,
      unitCode: item.unitCode,
      unitName: item.unitName,
      school: item.school,
      author: item.author,
      fileUrl: item.fileUrl || 'https://res.cloudinary.com/mconnect/docs/notes.pdf',
      pages: '48 pages',
      summary: `Comprehensive study material for ${item.unitCode} (${item.unitName || item.title}).`,
      sampleText: `Sample test preview line for ${item.unitCode} (${item.title}): Section 1.1 Fundamentals and Core Notes. Quick test words line for testing preview functionality.`
    });
    setShowPreviewModal(true);
  };

  const handleDownload = async (doc: PDFDocumentItem) => {
    try {
      await saveDownloadedPaper({
        _id: `note_${doc.id}`,
        title: doc.title,
        school: doc.school || 'Moi University',
        department: doc.unitName || doc.unitCode,
        courseCode: doc.unitCode,
        unitCode: doc.unitCode,
        unitName: doc.unitName || doc.unitCode,
        type: 'notes',
        examYear: 2025,
        fileUrl: doc.fileUrl,
        fileType: 'pdf',
        uploadedBy: { _id: 'moi_lecturer', name: doc.author || 'Moi Faculty' } as any,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      Alert.alert(
        'Downloaded Offline',
        `"${doc.title}" saved to your offline downloads tab!`,
        [
          { text: 'OK' },
          { text: 'View Downloads', onPress: () => router.push('/(tabs)/downloads') }
        ]
      );
    } catch (e) {
      Alert.alert('Download Error', 'Could not save note offline.');
    }
  };

  const forYouListRef = useRef<FlatList>(null);
  const trendingListRef = useRef<FlatList>(null);
  const isForYouInteracting = useRef(false);
  const isTrendingInteracting = useRef(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceToBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);

    if (distanceToBottom < 350) {
      if (visibleCountSection1 < GRID_SECTION_1.length && !loadingMoreSection1) {
        setLoadingMoreSection1(true);
        setTimeout(() => {
          setVisibleCountSection1((prev) => Math.min(prev + 4, GRID_SECTION_1.length));
          setLoadingMoreSection1(false);
        }, 900);
      } else if (
        visibleCountSection1 >= GRID_SECTION_1.length &&
        visibleCountSection2 < GRID_SECTION_2.length &&
        !loadingMoreSection2
      ) {
        setLoadingMoreSection2(true);
        setTimeout(() => {
          setVisibleCountSection2((prev) => Math.min(prev + 4, GRID_SECTION_2.length));
          setLoadingMoreSection2(false);
        }, 900);
      }
    }
  };

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [school, setSchool] = useState(MOI_SCHOOLS[0]);
  const [department, setDepartment] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [type, setType] = useState<any>('past_paper');
  const [examYear, setExamYear] = useState('2025');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, addPoints } = useAuth();

  useEffect(() => {
    if (route?.params?.upload === 'true' || route?.params?.upload === true) {
      router.push('/contribute');
    }
    if (route?.params?.type) {
      setActiveFilterDisc(route.params.type);
    }
    if (route?.params?.search) {
      setSearchQuery(route.params.search);
    }
  }, [route?.params]);

  // Auto Scroll For You Carousel
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isForYouInteracting.current && forYouListRef.current) {
        const nextIndex = (forYouIndex + 1) % FOR_YOU_CAROUSEL.length;
        setForYouIndex(nextIndex);
        forYouListRef.current.scrollToIndex({ index: nextIndex, animated: true });
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [forYouIndex]);

  // Auto Scroll Trending Carousel
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isTrendingInteracting.current && trendingListRef.current) {
        const nextIndex = (trendingIndex + 1) % TRENDING_CAROUSEL.length;
        setTrendingIndex(nextIndex);
        trendingListRef.current.scrollToIndex({ index: nextIndex, animated: true });
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [trendingIndex]);

  const fetchOfflinePapers = async () => {
    setLoading(true);
    const saved = await getDownloadedPapers();
    setDownloadedPapers(saved);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchMySubmissions = async () => {
    if (!user) return;
    setLoading(true);
    const res = await apiRequest<{ data: IPaper[] }>('/papers/my-submissions');
    setLoading(false);
    setRefreshing(false);
    if (res.success && res.data) {
      setMySubmissions(res.data);
    }
  };

  const handleUploadPaper = async () => {
    if (!title || !department || !courseCode || !unitCode || !unitName || !fileUrl) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields including document file URL.');
      return;
    }

    setSubmitting(true);
    const res = await apiRequest('/papers', {
      method: 'POST',
      body: JSON.stringify({
        title,
        school,
        department,
        courseCode,
        unitCode,
        unitName,
        type,
        examYear: parseInt(examYear || '2025', 10),
        fileUrl,
        fileType: 'pdf'
      })
    });
    setSubmitting(false);

    if (res.success) {
      addPoints(10, 'Uploaded revision material');
      Alert.alert(
        'Submission Received! (+10 pts Awarded)',
        'Your academic paper has been submitted successfully and +10 reward points have been credited to your profile!',
        [{ text: 'OK', onPress: () => {
          setShowUploadModal(false);
          setActiveTab('submissions');
          fetchMySubmissions();
        }}]
      );
    } else {
      Alert.alert('Error', res.error || 'Paper submission failed.');
    }
  };

  const renderDiscIcon = (iconType?: string, isActive?: boolean) => {
    switch (iconType) {
      case 'flame':
        return <FlameIcon color={isActive ? '#ffffff' : '#ea580c'} size={14} />;
      case 'sparkles':
        return <SparklesIcon color={isActive ? '#ffffff' : '#d97706'} size={14} />;
      case 'zap':
        return <ZapIcon color={isActive ? '#ffffff' : '#2563eb'} size={14} />;
      case 'trending':
        return <TrendingUpIcon color={isActive ? '#ffffff' : '#16a34a'} size={14} />;
      case 'document':
        return <DocumentIcon color={isActive ? '#ffffff' : '#15803d'} size={14} />;
      case 'edit':
        return <EditIcon color={isActive ? '#ffffff' : '#0284c7'} size={14} />;
      case 'calendar':
        return <CalendarIcon color={isActive ? '#ffffff' : '#64748b'} size={14} />;
      default:
        return null;
    }
  };

  const renderCarouselCard = (item: NoteItem) => {
    const cleanTag = item.tag.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u, '').replace(/^#\d+\s*/, '').trim();
    const cleanRating = item.rating.replace(/[^0-9.]/g, '').trim();

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.carouselCard}
        activeOpacity={0.88}
        onPress={() => handleOpenPreview(item)}
      >
        <View style={styles.carouselThumbnailContainer}>
          <Image source={{ uri: item.thumbnail }} style={styles.carouselImage} resizeMode="cover" />
          <View style={styles.carouselOverlay} />
          <View style={styles.carouselBadgeRow}>
            <View style={styles.carouselTypeBadge}>
              <Text style={styles.carouselTypeText}>{item.paperType}</Text>
            </View>
            <View style={[styles.carouselTagBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <SparklesIcon color="#d97706" size={11} />
              <Text style={styles.carouselTagText}>{cleanTag}</Text>
            </View>
          </View>
        </View>

        <View style={styles.carouselBody}>
          <Text style={styles.carouselMeta}>{item.mtid ? `mtid: ${item.mtid} • ` : ''}{item.unitCode} • {item.school}</Text>
          <Text style={styles.carouselTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.carouselFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <DownloadIcon color="#15803d" size={13} />
              <Text style={styles.carouselStats}>{formatCount(item.downloads)} downloads</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <StarIcon color="#f59e0b" size={12} />
              <Text style={styles.ratingText}>{cleanRating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridCard = (item: NoteItem) => {
    const cleanRating = item.rating.replace(/[^0-9.]/g, '').trim();
    const mtidText = item.mtid || 'P0001';
    const paperTag = item.paperType || 'Exam Pack';
    const shortSchool = (item.school || 'School of Science')
      .replace('School of ', '')
      .replace('Information Sciences', 'INFO SCI')
      .toUpperCase();

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.gridCard}
        activeOpacity={0.88}
        onPress={() => handleOpenPreview(item)}
      >
        <View style={styles.gridImageContainer}>
          <Image source={{ uri: item.thumbnail }} style={styles.gridImage} resizeMode="cover" />
          <View style={styles.gridBadge}>
            <Text style={styles.gridBadgeText}>{paperTag}</Text>
          </View>
          <View style={[styles.gridRatingBadge, { flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
            <StarIcon color="#eab308" size={11} />
            <Text style={styles.gridRatingText}>{cleanRating}</Text>
          </View>
        </View>

        <View style={styles.gridBody}>
          <Text style={styles.gridMetaLine} numberOfLines={1}>
            MTID: {mtidText} • {item.unitCode} • {shortSchool}
          </Text>
          <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.gridDivider} />

          <View style={styles.gridFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <DownloadIcon color="#15803d" size={11} />
              <Text style={styles.gridDownloads}>{formatCount(item.downloads)} downloads</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <StarIcon color="#eab308" size={11} />
              <Text style={styles.gridRatingText}>{cleanRating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filterNoteItem = (item: NoteItem) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.unitCode.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.school.toLowerCase().includes(q)
    );
  };

  const combinedForYou = [...realUploadedNotes.slice(0, 3), ...FOR_YOU_CAROUSEL].filter(filterNoteItem);
  const combinedGrid1 = [...realUploadedNotes, ...GRID_SECTION_1].filter(filterNoteItem);
  const combinedGrid2 = [...realUploadedNotes.slice(3), ...GRID_SECTION_2].filter(filterNoteItem);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              setVisibleCountSection1(4);
              setVisibleCountSection2(4);
              await fetchRealAcademicPapers();
              setRefreshing(false);
            }}
            colors={['#15803d']}
          />
        }
      >
          {/* Top Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <SearchIcon color="#94a3b8" size={18} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search notes, unit codes (e.g. COM 310, STA 210)..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '700', paddingHorizontal: 6 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Discs Header */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.discScroll}
            contentContainerStyle={styles.discContent}
          >
            {FILTER_DISCS.map((disc) => {
              const isActive = activeFilterDisc === disc.id;
              return (
                <TouchableOpacity
                  key={disc.id}
                  style={[styles.discPill, isActive && styles.discPillActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                  onPress={() => setActiveFilterDisc(disc.id)}
                  activeOpacity={0.75}
                >
                  {renderDiscIcon(disc.iconType, isActive)}
                  <Text style={[styles.discText, isActive && styles.discTextActive]}>
                    {disc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* SECTION 1: FOR YOU / BASED ON PROFILE CAROUSEL */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <SparklesIcon color="#15803d" size={18} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Based on your profile</Text>
              <Text style={styles.sectionSub}>Recommended for your course & year</Text>
            </View>
          </View>

          <FlatList
            ref={forYouListRef}
            data={combinedForYou}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselListContent}
            snapToInterval={CAROUSEL_CARD_WIDTH + 14}
            decelerationRate="fast"
            onScrollBeginDrag={() => { isForYouInteracting.current = true; }}
            onScrollEndDrag={() => { setTimeout(() => { isForYouInteracting.current = false; }, 3000); }}
            renderItem={({ item }) => renderCarouselCard(item)}
            getItemLayout={(_, index) => ({
              length: CAROUSEL_CARD_WIDTH + 14,
              offset: (CAROUSEL_CARD_WIDTH + 14) * index,
              index
            })}
            onScrollToIndexFailed={(info) => {
              forYouListRef.current?.scrollToOffset({
                offset: info.index * (CAROUSEL_CARD_WIDTH + 14),
                animated: true
              });
            }}
          />

          {/* Carousel Pagination Dots */}
          <View style={styles.dotsRow}>
            {combinedForYou.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === forYouIndex ? styles.activeDot : styles.inactiveDot]}
              />
            ))}
          </View>

          {/* SECTION 2: GRID SECTION 1 (LAZY LOADED 2 LINES AT A TIME) */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <View style={[styles.sectionIconCircle, { backgroundColor: '#dcfce7' }]}>
              <BookIcon color="#15803d" size={18} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Essential Course Notes & Papers</Text>
              <Text style={styles.sectionSub}>Top rated revision materials</Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            {combinedGrid1.slice(0, visibleCountSection1).map((item) => renderGridCard(item))}
          </View>

          {/* Facebook-style Bottom Shimmer Loading for Section 1 */}
          {loadingMoreSection1 && (
            <ShimmerGridLoader title="Fetching 2 more lines of notes & papers..." />
          )}

          {/* SECTION 3: TRENDING NOW CAROUSEL */}
          <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
            <View style={[styles.sectionIconCircle, { backgroundColor: '#ffedd5' }]}>
              <FlameIcon color="#ea580c" size={18} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Trending on Campus</Text>
              <Text style={styles.sectionSub}>Most downloaded notes this week</Text>
            </View>
          </View>

          <FlatList
            ref={trendingListRef}
            data={TRENDING_CAROUSEL}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselListContent}
            snapToInterval={CAROUSEL_CARD_WIDTH + 14}
            decelerationRate="fast"
            onScrollBeginDrag={() => { isTrendingInteracting.current = true; }}
            onScrollEndDrag={() => { setTimeout(() => { isTrendingInteracting.current = false; }, 3000); }}
            renderItem={({ item }) => renderCarouselCard(item)}
            getItemLayout={(_, index) => ({
              length: CAROUSEL_CARD_WIDTH + 14,
              offset: (CAROUSEL_CARD_WIDTH + 14) * index,
              index
            })}
            onScrollToIndexFailed={(info) => {
              trendingListRef.current?.scrollToOffset({
                offset: info.index * (CAROUSEL_CARD_WIDTH + 14),
                animated: true
              });
            }}
          />

          {/* Trending Carousel Dots */}
          <View style={styles.dotsRow}>
            {TRENDING_CAROUSEL.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === trendingIndex ? styles.activeDot : styles.inactiveDot]}
              />
            ))}
          </View>

          {/* SECTION 4: GRID SECTION 2 (LAZY LOADED 2 LINES AT A TIME) */}
          <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
            <View style={[styles.sectionIconCircle, { backgroundColor: '#dbeafe' }]}>
              <FileTextIcon color="#2563eb" size={18} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Recently Uploaded & Recommended</Text>
              <Text style={styles.sectionSub}>Fresh notes uploaded by students & lecturers</Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            {combinedGrid2.slice(0, visibleCountSection2).map((item) => renderGridCard(item))}
          </View>

          {/* Facebook-style Bottom Shimmer Loading for Section 2 */}
          {loadingMoreSection2 && (
            <ShimmerGridLoader title="Fetching 2 more lines of recently uploaded notes..." />
          )}

          {/* App Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/privacy')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>·</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>·</Text>
            <TouchableOpacity onPress={() => router.push('/faq')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>·</Text>
            <Text style={styles.footerVersion}>MoiConnect v1.0.0</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

      {/* Upload Paper Modal */}
      <Modal visible={showUploadModal} animationType="slide" onRequestClose={() => setShowUploadModal(false)}>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Academic Resource</Text>
            <TouchableOpacity onPress={() => setShowUploadModal(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          <Input label="Document Title *" placeholder="COM 310 Final Exam 2025" value={title} onChangeText={setTitle} />
          <Input label="Department *" placeholder="Computer Science" value={department} onChangeText={setDepartment} />
          <Input label="Course Code *" placeholder="COM 310" value={courseCode} onChangeText={setCourseCode} />
          <Input label="Unit Code *" placeholder="COM 310" value={unitCode} onChangeText={setUnitCode} />
          <Input label="Unit Name *" placeholder="Data Structures & Algorithms" value={unitName} onChangeText={setUnitName} />
          <Input label="Exam / Academic Year" placeholder="2025" value={examYear} onChangeText={setExamYear} keyboardType="numeric" />
          <Input
            label="PDF File Document Link / Cloudinary URL *"
            placeholder="https://res.cloudinary.com/.../document.pdf"
            value={fileUrl}
            onChangeText={setFileUrl}
          />

          <Button title="Submit for Admin Review" onPress={handleUploadPaper} loading={submitting} style={{ marginTop: 16 }} />
        </ScrollView>
      </Modal>

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
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabBtnActive: {
    borderBottomColor: '#15803d'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#15803d'
  },
  feedScroll: {
    flex: 1
  },
  feedContent: {
    padding: 16,
    paddingBottom: 40
  },
  /* Search Bar */
  searchSection: {
    marginBottom: 14
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none'
  } as any,

  /* Filter Discs */
  discScroll: {
    flexDirection: 'row',
    marginBottom: 16
  },
  discContent: {
    gap: 8,
    paddingRight: 16
  },
  discPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3
  },
  discPillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  discText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  discTextActive: {
    color: '#ffffff'
  },

  /* Upload Banner */
  uploadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  uploadIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  uploadBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534'
  },
  uploadBannerSub: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2
  },
  uploadBtnBadge: {
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d'
  },

  /* Carousel Card */
  carouselListContent: {
    gap: 14,
    paddingRight: 16
  },
  carouselCard: {
    width: CAROUSEL_CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3
  },
  carouselThumbnailContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a'
  },
  carouselImage: {
    width: '100%',
    height: '100%'
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.3)'
  },
  carouselBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  carouselTypeBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  carouselTypeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  carouselTagBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  carouselTagText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800'
  },
  carouselBody: {
    padding: 14
  },
  carouselMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  carouselTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    height: 38,
    lineHeight: 19,
    marginBottom: 10
  },
  carouselFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  carouselStats: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d'
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a'
  },

  /* Pagination Dots */
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12
  },
  dot: {
    height: 6,
    borderRadius: 3
  },
  activeDot: {
    width: 18,
    backgroundColor: '#15803d'
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#cbd5e1'
  },

  /* Grid Cards */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  gridImageContainer: {
    height: 95,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a'
  },
  gridImage: {
    width: '100%',
    height: '100%'
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#15803d',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  gridBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  gridRatingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3
  },
  gridRatingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  gridBody: {
    padding: 10
  },
  gridMetaLine: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: 4
  },
  gridPaperType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    height: 34,
    lineHeight: 16,
    marginBottom: 4
  },
  gridDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4
  },
  gridSub: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 8
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  gridDownloads: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  miniArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center'
  },

  /* Submission Cards */
  submissionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  subDate: {
    fontSize: 12,
    color: '#94a3b8'
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  subDetail: {
    fontSize: 12,
    color: '#64748b'
  },
  modalContent: {
    padding: 24,
    backgroundColor: '#ffffff',
    flexGrow: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  closeBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626'
  },

  /* Facebook-style Shimmer Loading Styles */
  shimmerContainer: {
    marginTop: 14,
    marginBottom: 16
  },
  shimmerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  shimmerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#15803d'
  },
  shimmerLoadingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 0.2
  },
  shimmerCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  shimmerThumbnail: {
    height: 105,
    backgroundColor: '#cbd5e1'
  },
  shimmerBody: {
    padding: 10,
    gap: 8
  },
  shimmerBadge: {
    width: 55,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e2e8f0'
  },
  shimmerTitleLine: {
    width: '88%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#cbd5e1'
  },
  shimmerSubLine: {
    width: '60%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#e2e8f0'
  },

  /* App Footer Styles */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 24,
    paddingBottom: 4,
    marginTop: 8
  },
  footerLink: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8'
  },
  footerDivider: {
    fontSize: 10,
    color: '#cbd5e1'
  },
  footerVersion: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500'
  }
});

