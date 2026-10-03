import { showIceMessage } from '../../src/components/IceMessageCard';
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
  Platform,
  AppState
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { IPaper, MOI_SCHOOLS, PAPER_TYPES } from '@moi/shared';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';
import { OfflineState } from '../../src/components/OfflineState';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { useAppNavigation } from '../../src/utils/navigation';
import { getDownloadedPapers, saveDownloadedPaper } from '../../src/services/offlineStorage';
import { getShowDemoMaterialsSetting } from '../../src/services/appSettingsService';
import { getMaterialSearchScore } from '../../src/utils/materialSearch';
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
  department?: string;
  courseCode?: string;
  semester?: string;
  academicYear?: string;
  description?: string;
  paperType: string;
  downloads: string;
  rating: string;
  examYear: string;
  tag: string;
  thumbnail: string;
  author: string;
  fileUrl?: string;
  ttsTextUrl?: string;
}

// Mock Data Sets
const FOR_YOU_CAROUSEL: NoteItem[] = [];

const GRID_SECTION_1: NoteItem[] = [];

const TRENDING_CAROUSEL: NoteItem[] = [];

const GRID_SECTION_2: NoteItem[] = [];

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

function ShimmerGridLoader({ title, count = 4 }: { title?: string; count?: number }) {
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
        <Text style={styles.shimmerLoadingLabel}>{title || 'loading more resources'}</Text>
      </View>
      <View style={styles.gridContainer}>
        {(Array.from({ length: count }, (_, i) => i + 1)).map((idx) => (
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
  const [showDemoMaterials, setShowDemoMaterials] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchRealAcademicPapers = async (searchQueryParam?: string) => {
    try {
      setInitialLoading(true);
      setFetchError(false);
      const url = searchQueryParam && searchQueryParam.trim()
        ? `/papers?limit=500&search=${encodeURIComponent(searchQueryParam.trim())}`
        : `/papers?limit=500`;
      const res = await apiRequest<{ data: IPaper[] }>(url);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const noteMaterials = res.data.filter((p) =>
          ['notes', 'revision', 'lecture_notes'].includes(p.type)
        );
        const mapped: NoteItem[] = noteMaterials.map((p) => ({
          id: p._id || (p as any).id,
          mtid: p.mtid || `N${(p._id || '').substring(0, 4)}`,
          title: p.title,
          unitCode: p.unitCode || p.courseCode || 'MOI',
          unitName: p.unitName || p.title,
          school: p.school || 'Moi University',
          department: p.department,
          courseCode: p.courseCode,
          semester: p.semester,
          academicYear: p.academicYear,
          description: p.description,
          paperType: p.type === 'notes' ? 'Revision Notes' : (p.type === 'cat' ? 'CAT Paper' : (p.type === 'past_paper' ? 'Past Paper' : 'Study Guide')),
          downloads: formatCount(p.downloads || 65),
          rating: `${p.ratingScore || '4.8'} ⭐`,
          examYear: String(p.examYear || 2025),
          tag: p.mtid ? `MTID: ${p.mtid}` : '✨ Real Uploaded',
          thumbnail: p.thumbnail 
            || (p.fileType === 'image' || p.fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)/i) ? p.fileUrl : undefined)
            || (Array.isArray(p.attachments) ? p.attachments.find((att: any) => att.fileType === 'image' || att.fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)/i))?.fileUrl : undefined)
            || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
          author: typeof p.submittedBy === 'object' && p.submittedBy ? (p.submittedBy as any).name || 'Moi Student' : 'Moi Student',
          fileUrl: p.fileUrl,
          ttsTextUrl: (p as any).ttsTextUrl
        }));
        setRealUploadedNotes(mapped); setInitialLoading(false);
      } else if (!res.success) {
        setFetchError(true); setInitialLoading(false);
      } else {
        setRealUploadedNotes([]); setInitialLoading(false);
      }
    } catch (err) {
      console.log('Error fetching real academic papers:', err); setFetchError(true); setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchRealAcademicPapers();
    getShowDemoMaterialsSetting().then((enabled) => setShowDemoMaterials(enabled));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchRealAcademicPapers();
        getShowDemoMaterialsSetting().then((enabled) => setShowDemoMaterials(enabled));
      }
    });
    return () => subscription.remove();
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
      fileUrl: item.fileUrl || '',
      ttsTextUrl: item.ttsTextUrl,
      summary: `Study notes for ${item.unitCode} ${item.unitName || item.title}.`,
      sampleText: `Course notes for ${item.unitCode}: ${item.title}. Includes key concepts, formulas, and revision topics for semester preparation.`
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
        ttsTextUrl: doc.ttsTextUrl,
        fileType: 'pdf',
        uploadedBy: { _id: 'moi_lecturer', name: doc.author || 'Moi Faculty' } as any,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      showIceMessage(
        'Downloaded Offline',
        `"${doc.title}" saved to your offline downloads tab!`,
        [
          { text: 'OK' },
          { text: 'View Downloads', onPress: () => router.push('/(tabs)/downloads') }
        ]
      );
    } catch (e) {
      showIceMessage('Download Error', 'Could not save note offline.');
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const { user } = useAuth();

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

  // Debounced API Search
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const timer = setTimeout(() => {
        fetchRealAcademicPapers(searchQuery.trim());
      }, 350);
      return () => clearTimeout(timer);
    } else if (searchQuery.trim().length === 0) {
      fetchRealAcademicPapers();
    }
  }, [searchQuery]);

  // Categorize items into Top Matches vs Related Materials (supporting hidden metadata like semester, academicYear, examYear, etc.)
  const smartSearchResults = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return { isSearching: false, topMatches: [], relatedMatches: [] };
    }

    const allPool: NoteItem[] = [
      ...realUploadedNotes,
      ...(showDemoMaterials ? FOR_YOU_CAROUSEL : []),
      ...(showDemoMaterials ? GRID_SECTION_1 : []),
      ...(showDemoMaterials ? TRENDING_CAROUSEL : []),
      ...(showDemoMaterials ? GRID_SECTION_2 : [])
    ];

    const filterByDisc = (item: NoteItem) => {
      if (activeFilterDisc === 'all') return true;
      if (activeFilterDisc === 'past_paper') return item.paperType.toLowerCase().includes('past') || item.paperType.toLowerCase().includes('exam');
      if (activeFilterDisc === 'cat') return item.paperType.toLowerCase().includes('cat');
      return true;
    };

    const seenIds = new Set<string>();
    const topMatches: NoteItem[] = [];
    const relatedMatches: NoteItem[] = [];

    allPool.forEach((item) => {
      if (seenIds.has(item.id) || !filterByDisc(item)) return;
      seenIds.add(item.id);

      const score = getMaterialSearchScore({
        mtid: item.mtid,
        title: item.title,
        unitCode: item.unitCode,
        unitName: item.unitName,
        school: item.school,
        department: item.department,
        courseCode: item.courseCode,
        semester: item.semester,
        academicYear: item.academicYear,
        examYear: item.examYear,
        type: item.paperType,
        description: item.description,
        author: item.author
      }, q);

      if (score !== null && score <= 5) {
        topMatches.push(item);
      } else if (score !== null) {
        relatedMatches.push(item);
      }
    });

    const scoreList = (items: NoteItem[]) => items.sort((a, b) =>
      (getMaterialSearchScore({ ...a, type: a.paperType }, q) ?? Number.MAX_SAFE_INTEGER) -
      (getMaterialSearchScore({ ...b, type: b.paperType }, q) ?? Number.MAX_SAFE_INTEGER)
    );

    return {
      isSearching: true,
      topMatches: scoreList(topMatches),
      relatedMatches: scoreList(relatedMatches)
    };
  }, [searchQuery, realUploadedNotes, activeFilterDisc, showDemoMaterials]);

  const combinedForYou = realUploadedNotes.length > 0
    ? realUploadedNotes
    : (showDemoMaterials ? FOR_YOU_CAROUSEL : []);

  const combinedGrid1 = realUploadedNotes.length > 0
    ? realUploadedNotes
    : (showDemoMaterials ? GRID_SECTION_1 : []);

  const combinedGrid2 = realUploadedNotes.length > 3
    ? realUploadedNotes.slice(3)
    : (showDemoMaterials ? GRID_SECTION_2 : []);

  const combinedTrending = React.useMemo(() => {
    if (realUploadedNotes.length > 0) {
      return [...realUploadedNotes]
        .sort((a, b) => (parseInt(String(b.downloads).replace(/,/g, '')) || 0) - (parseInt(String(a.downloads).replace(/,/g, '')) || 0))
        .slice(0, 6);
    }
    return TRENDING_CAROUSEL;
  }, [realUploadedNotes]);

  // Auto Scroll For You Carousel
  useEffect(() => {
    if (!combinedForYou || combinedForYou.length <= 1) return;
    const timer = setInterval(() => {
      if (!isForYouInteracting.current && forYouListRef.current) {
        const nextIndex = (forYouIndex + 1) % combinedForYou.length;
        setForYouIndex(nextIndex);
        try {
          forYouListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        } catch (e) {
          // ignore layout unmounted index error
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [forYouIndex, combinedForYou?.length]);

  // Auto Scroll Trending Carousel
  useEffect(() => {
    if (!combinedTrending || combinedTrending.length <= 1) return;
    const timer = setInterval(() => {
      if (!isTrendingInteracting.current && trendingListRef.current) {
        const nextIndex = (trendingIndex + 1) % combinedTrending.length;
        setTrendingIndex(nextIndex);
        try {
          trendingListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        } catch (e) {
          // ignore layout unmounted index error
        }
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [trendingIndex, combinedTrending?.length]);

  const fetchOfflinePapers = async () => {
    setLoading(true);
    const saved = await getDownloadedPapers();
    setDownloadedPapers(saved as any as IPaper[]);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchMySubmissions = async () => {
    if (!user) return;
    setLoading(true);
    const res: any = await apiRequest<any>('/papers/my-submissions');
    setLoading(false);
    setRefreshing(false);
    if (res.success && res.data) {
      setMySubmissions(res.data as IPaper[]);
    }
  };

  const handleUploadPaper = async () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Document title is required.';
    if (!department.trim()) errors.department = 'Department is required.';
    if (courseCode.trim().length < 2) errors.courseCode = 'Course code must be at least 2 characters.';
    if (unitCode.trim().length < 2) errors.unitCode = 'Unit code must be at least 2 characters.';
    if (!unitName.trim()) errors.unitName = 'Unit name is required.';
    if (!fileUrl.trim()) errors.fileUrl = 'A document file URL is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please correct the highlighted fields before submitting.');
      return;
    }

    setFieldErrors({});
    setFormError('');
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
      showIceMessage(
        'Submission Received',
        'Your academic paper has been submitted for review. You will receive +10 reward points after administrator approval.',
        [{ text: 'OK', onPress: () => {
          setShowUploadModal(false);
          setActiveTab('submissions');
          fetchMySubmissions();
        }}]
      );
    } else {
      showIceMessage('Error', res.error || 'Paper submission failed.');
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
                  onPress={() => {
                    if (disc.id === 'past_paper') {
                      router.push('/past-papers');
                    } else if (disc.id === 'cat') {
                      router.push('/cat-papers');
                    } else {
                      setActiveFilterDisc(disc.id);
                    }
                  }}
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

          {/* SMART CATEGORIZED SEARCH RESULTS OR NORMAL BROWSE SECTIONS */}
          {initialLoading ? (
            <View style={{ marginTop: 16 }}>
              <ShimmerGridLoader title="loading more resources" count={6} />
            </View>
          ) : fetchError && realUploadedNotes.length === 0 && !showDemoMaterials ? (
            <OfflineState onRetry={() => fetchRealAcademicPapers(searchQuery)} />
          ) : smartSearchResults.isSearching ? (
            <View style={{ marginTop: 16 }}>
              {/* Search Summary Banner */}
              <View style={{ backgroundColor: '#f0fdf4', padding: 14, borderRadius: 14, borderColor: '#bbf7d0', borderWidth: 1, marginBottom: 20 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#166534' }}>
                  Smart Search results for "{searchQuery}"
                </Text>
                <Text style={{ fontSize: 12, color: '#15803d', marginTop: 3 }}>
                  {smartSearchResults.topMatches.length} Top Match(es) • {smartSearchResults.relatedMatches.length} Related Material(s)
                </Text>
              </View>

              {/* SECTION 1: TOP MATCH / TOP RESULTS */}
              <View style={[styles.sectionHeaderRow, smartSearchResults.topMatches.length === 0 && { display: 'none' }]}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#dcfce7' }]}>
                  <SparklesIcon color="#15803d" size={18} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Top Match Results</Text>
                  <Text style={styles.sectionSub}>Direct title, unit code & MTID matches</Text>
                </View>
              </View>

              {smartSearchResults.topMatches.length > 0 ? (
                <View style={styles.gridContainer}>
                  {smartSearchResults.topMatches.map((item) => renderGridCard(item))}
                </View>
              ) : (
                <View style={[{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }, { display: 'none' }]}>
                  <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                    No direct unit code or title match for "{searchQuery}". See related materials below.
                  </Text>
                </View>
              )}

              {/* SECTION 2: RELATED MATERIALS (SCROLL DOWN) */}
              <View style={[styles.sectionHeaderRow, { marginTop: 28 }, smartSearchResults.relatedMatches.length === 0 && { display: 'none' }]}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#eff6ff' }]}>
                  <BookIcon color="#2563eb" size={18} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Related Materials & Hidden Metadata</Text>
                  <Text style={styles.sectionSub}>Matched by semester, year level, department or category</Text>
                </View>
              </View>

              {smartSearchResults.relatedMatches.length > 0 ? (
                <View style={styles.gridContainer}>
                  {smartSearchResults.relatedMatches.map((item) => renderGridCard(item))}
                </View>
              ) : (
                <View style={[{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }, { display: 'none' }]}>
                  <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                    No secondary metadata matches for "{searchQuery}".
                  </Text>
                </View>
              )}

              {/* EMPTY STATE IF BOTH 0 */}
              {smartSearchResults.topMatches.length === 0 && smartSearchResults.relatedMatches.length === 0 && (
                <View style={{ padding: 36, alignItems: 'center' }}>
                  <DocumentIcon color="#94a3b8" size={42} />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 12 }}>
                    No results found for "{searchQuery}"
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center', maxWidth: 300 }}>
                    Try searching by unit code (e.g. COM 310), course (e.g. BSC-CS), semester (e.g. Semester 1), or year (e.g. Year 1 or 2024).
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <>
              {/* SECTION 1: FOR YOU / BASED ON PROFILE CAROUSEL */}
              <View style={[styles.sectionHeaderRow, combinedForYou.length === 0 && { display: 'none' }]}>
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
              <View style={[styles.sectionHeaderRow, { marginTop: 24 }, combinedGrid1.length === 0 && { display: 'none' }]}>
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
                <ShimmerGridLoader title="loading more resources" count={4} />
              )}



              {/* SECTION 3: TRENDING NOW CAROUSEL */}
              <View style={[styles.sectionHeaderRow, { marginTop: 28 }, combinedTrending.length === 0 && { display: 'none' }]}>
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
                data={combinedTrending}
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
                {combinedTrending.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === trendingIndex ? styles.activeDot : styles.inactiveDot]}
                  />
                ))}
              </View>




              {/* SECTION 4: GRID SECTION 2 (LAZY LOADED 2 LINES AT A TIME) */}
              <View style={[styles.sectionHeaderRow, { marginTop: 28 }, combinedGrid2.length === 0 && { display: 'none' }]}>
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
                <ShimmerGridLoader title="loading more resources" count={4} />
              )}
            </>
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
            <Text style={styles.footerVersion}>MConnect v1.0.0</Text>
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

          <Input label="Document Title *" placeholder="COM 310 Final Exam 2025" value={title} onChangeText={setTitle} error={fieldErrors.title} />
          <Input label="Department *" placeholder="Computer Science" value={department} onChangeText={setDepartment} error={fieldErrors.department} />
          <Input label="Course Code *" placeholder="COM 310" value={courseCode} onChangeText={setCourseCode} error={fieldErrors.courseCode} />
          <Input label="Unit Code *" placeholder="COM 310" value={unitCode} onChangeText={setUnitCode} error={fieldErrors.unitCode} />
          <Input label="Unit Name *" placeholder="Data Structures & Algorithms" value={unitName} onChangeText={setUnitName} error={fieldErrors.unitName} />
          <Input label="Exam / Academic Year" placeholder="2025" value={examYear} onChangeText={setExamYear} keyboardType="numeric" />
          <Input
            label="PDF File Document Link / Cloudinary URL *"
            placeholder="https://res.cloudinary.com/.../document.pdf"
            value={fileUrl}
            onChangeText={setFileUrl}
            error={fieldErrors.fileUrl}
          />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

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
  formError: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600'
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

