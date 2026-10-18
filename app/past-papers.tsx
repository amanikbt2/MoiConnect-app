import { showIceMessage } from '../src/components/IceMessageCard';
import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  ScrollView,
  Platform,
  AppState
} from 'react-native';
import { useAppNavigation } from '../src/utils/navigation';
import { useAuth } from '../src/context/AuthContext';
import { getDownloadedPapers, saveDownloadedPaper, getMaterialSearchHistoryEntries, saveMaterialSearchQuery, clearMaterialSearchHistory } from '../src/services/offlineStorage';
import { PDFViewerModal, formatCount, PDFDocumentItem } from '../src/components/PDFViewerModal';
import { apiRequest } from '../src/services/api';
import { getShowDemoMaterialsSetting } from '../src/services/appSettingsService';
import { rankMaterials, rankMaterialsForProfile, smartSearchMaterials, getSearchRecommendationSections } from '../src/utils/materialSearch';
import { reportMaterialSearch } from '../src/services/searchReportService';
import { OfflineState } from '../src/components/OfflineState';
import { SmartSearchHeader } from '../src/components/SmartSearchHeader';
import { SmartMirrorSkeleton } from '../src/components/SmartMirrorSkeleton';
import { parseSmartSearchQuery } from '../src/utils/smartSearchParser';
import { SmartSearchAutocomplete } from '../src/components/SmartSearchAutocomplete';
import { useSearchFocus } from '../src/hooks/useSearchFocus';
import { HighlightText } from '../src/components/HighlightText';
import { IPaper } from '@moi/shared';
import {
  SearchIcon,
  DownloadIcon,
  StarIcon,
  FileTextIcon,
  ChevronRightIcon,
  SparklesIcon,
  BookIcon,
  FlameIcon,
  ZapIcon,
  DocumentIcon,
  CheckIcon,
  LaptopIcon,
  TrendingUpIcon
} from '../src/components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

export interface PastPaperItem {
  id: string;
  mtid?: string;
  title: string;
  unitCode: string;
  unitName: string;
  school: string;
  examYear: string;
  semester: string;
  academicYear?: string;
  department?: string;
  description?: string;
  type?: string;
  downloadsCount: number;
  starsCount: number;
  ratingScore: string;
  thumbnail: string;
  fileUrl: string;
  ttsTextUrl?: string;
  hasSolutions: boolean;
  tag?: string;
}

// Recommended Carousel Items for Auto-Scroll
const RECOMMENDED_PAST_PAPERS: PastPaperItem[] = [];

const INITIAL_PAST_PAPERS_DATA: PastPaperItem[] = [];
const PAPER_PAGE_SIZE = 60;
const DISCOVERY_BLOCK_SIZE = 6;

const FILTER_DISCS = [
  { id: 'all', label: 'All Past Papers', iconType: 'all' },
  { id: 'solutions', label: 'Worked Solutions', iconType: 'check' },
  { id: 'hot', label: 'Top Downloaded', iconType: 'flame' },
  { id: '2025', label: '2025 Papers', iconType: 'zap' },
  { id: '2024', label: '2024 Papers', iconType: 'document' },
  { id: 'info', label: 'Info Sciences', iconType: 'laptop' },
  { id: 'science', label: 'Science', iconType: 'book' }
];

function ShimmerGridLoader({ title, count = 6, showCarousel = true }: { title?: string; count?: number; showCarousel?: boolean }) {
  return (
    <SmartMirrorSkeleton
      carouselTitle="Recommended Past Exams"
      carouselSubtitle="Matched to your course and academic profile"
      gridTitle={title || 'loading more resources'}
      showCarousel={showCarousel}
      gridCount={count}
    />
  );
}

function PastPaperCarouselSection({
  title,
  subtitle,
  items,
  onOpenPreview
}: {
  title: string;
  subtitle: string;
  items: PastPaperItem[];
  onOpenPreview: (item: PastPaperItem) => void;
}) {
  const carouselRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isInteracting = useRef(false);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      if (isInteracting.current || !carouselRef.current) return;
      const nextIndex = (activeIndex + 1) % items.length;
      setActiveIndex(nextIndex);
      carouselRef.current.scrollToIndex({ index: nextIndex, animated: true });
    }, 3800);
    return () => clearInterval(timer);
  }, [activeIndex, items.length]);

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.discoverySection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconCircle}>
          <SparklesIcon color="#15803d" size={17} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{subtitle}</Text>
        </View>
      </View>
      <FlatList
        ref={carouselRef}
        horizontal
        data={items}
        keyExtractor={(item) => `${title}-${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselListContent}
        snapToInterval={CAROUSEL_CARD_WIDTH + 14}
        decelerationRate="fast"
        onScrollBeginDrag={() => { isInteracting.current = true; }}
        onScrollEndDrag={() => { setTimeout(() => { isInteracting.current = false; }, 3000); }}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (CAROUSEL_CARD_WIDTH + 14));
          setActiveIndex(Math.max(0, Math.min(nextIndex, items.length - 1)));
          setTimeout(() => { isInteracting.current = false; }, 3000);
        }}
        getItemLayout={(_, index) => ({
          length: CAROUSEL_CARD_WIDTH + 14,
          offset: (CAROUSEL_CARD_WIDTH + 14) * index,
          index
        })}
        onScrollToIndexFailed={(info) => {
          carouselRef.current?.scrollToOffset({ offset: info.index * (CAROUSEL_CARD_WIDTH + 14), animated: true });
        }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.carouselCard} activeOpacity={0.88} onPress={() => onOpenPreview(item)}>
            <View style={styles.carouselThumbnailContainer}>
              <Image source={{ uri: item.thumbnail }} style={styles.carouselImage} resizeMode="cover" />
              <View style={styles.carouselOverlay} />
              <View style={styles.carouselBadgeRow}>
                <View style={styles.carouselTypeBadge}>
                  <Text style={styles.carouselTypeText}>{item.hasSolutions ? '✓ Solved' : 'Exam Paper'}</Text>
                </View>
                {!!item.tag && <View style={styles.carouselTagBadge}><Text style={styles.carouselTagText}>{item.tag}</Text></View>}
              </View>
            </View>
            <View style={styles.carouselBody}>
              <Text style={styles.carouselMeta}>{item.mtid ? `mtid: ${item.mtid} • ` : ''}{item.unitCode} • {item.school}</Text>
              <Text style={styles.carouselTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.carouselFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <DownloadIcon color="#15803d" size={13} />
                  <Text style={styles.carouselStats}>{formatCount(item.downloadsCount)} downloads</Text>
                </View>
                <Text style={styles.ratingText}>⭐ {item.ratingScore}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.dotsRow}>
        {items.map((_, index) => (
          <View
            key={`${title}-dot-${index}`}
            style={[styles.dot, index === activeIndex ? styles.activeDot : styles.inactiveDot]}
          />
        ))}
      </View>
    </View>
  );
}

export default function PastPapersScreen({ route }: any) {
  const [searchQuery, setSearchQuery] = useState(route?.params?.search || '');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState(route?.params?.search || '');
  const [downloadedPapers, setDownloadedPapers] = useState<any[]>([]);
  const latestSearchRequest = useRef(0);
  const [requestedQuery, setRequestedQuery] = useState<string | null>(null);
  const [activeFilterDisc, setActiveFilterDisc] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [papersData, setPapersData] = useState<PastPaperItem[]>([]);
  const [campusLibrary, setCampusLibrary] = useState<PastPaperItem[]>([]);
  const [userStars, setUserStars] = useState<Record<string, boolean>>({});

  // Paginated feed state: only one small page is fetched at a time.
  const [papersPage, setPapersPage] = useState(1);
  const [hasMorePapers, setHasMorePapers] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Auto-scroll Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselListRef = useRef<FlatList>(null);
  const isCarouselInteracting = useRef(false);

  // Fast PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const router = useAppNavigation();
  const { user } = useAuth();

  const [showDemoMaterials, setShowDemoMaterials] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const {
    isSearchFocused,
    searchContainerRef,
    handleSearchFocus,
    handleSearchBlur,
    closeSearch,
  } = useSearchFocus();

  useEffect(() => {
    if (typeof route?.params?.search === 'string') {
      setSearchQuery(route.params.search);
      setSubmittedSearchQuery(route.params.search);
    }
  }, [route?.params?.search]);

  useEffect(() => {
    getMaterialSearchHistoryEntries().then(setSearchHistory);
    getDownloadedPapers().then((saved) => {
      const localMaterials = saved.filter((paper) => paper.status === 'completed' && ['past_paper', 'solution', 'exam'].includes(String(paper.type || '').toLowerCase()));
      setDownloadedPapers(localMaterials as any[]);
      setPapersData((previous) => {
        const merged = [...previous, ...localMaterials.map((paper: any): PastPaperItem => ({
        id: paper._id, mtid: paper.mtid || `P${String(paper._id || '').substring(0, 4)}`, title: paper.title,
        unitCode: paper.unitCode || paper.courseCode || 'MOI', unitName: paper.unitName || paper.title,
        school: paper.school || 'Moi University', examYear: String(paper.examYear || ''),
        semester: paper.semester || '', academicYear: paper.academicYear || '', department: paper.department || '',
        description: paper.description || '', type: paper.type, downloadsCount: paper.downloadsCount || 0,
        starsCount: 0, ratingScore: paper.ratingScore || '', thumbnail: paper.thumbnail || '',
        fileUrl: paper.localUri || paper.fileUrl, ttsTextUrl: paper.ttsLocalUri || paper.ttsTextUrl,
        hasSolutions: paper.type === 'solution', tag: 'Downloaded offline'
      }))];
        return Array.from(new Map(merged.map((item) => [item.id, item])).values());
      });
    }).catch(() => {});
  }, []);

  // Fetch real uploaded past papers from Cloudinary / backend API
  const fetchRealPastPapers = async (searchTerm = '', page = 1, append = false) => {
    const requestId = ++latestSearchRequest.current;
    try {
      const isSearch = searchTerm.trim().length > 0;
      if (append) setLoadingMore(true);
      else if (isSearch) setIsSearchLoading(true);
      else setInitialLoading(true);
      setFetchError(false);
      const demoSetting = await getShowDemoMaterialsSetting();
      if (requestId !== latestSearchRequest.current) return;
      setShowDemoMaterials(demoSetting);

      const searchParam = isSearch ? `&search=${encodeURIComponent(searchTerm.trim())}` : '';
      const limit = isSearch ? 100 : PAPER_PAGE_SIZE;
      const res = await apiRequest<{ data: IPaper[]; pagination?: { pages?: number } }>(`/papers?limit=${limit}&page=${page}&type=past_paper${searchParam}`);
      if (requestId !== latestSearchRequest.current) return;
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const realPastPapers: PastPaperItem[] = res.data
          .filter((p) => p.type === 'past_paper' || p.type === 'solution' || p.type === 'exam')
          .map((p) => {
            const materialId = p.mtid || `P${(p._id || '').substring(0, 4)}`;
            return ({
            id: p._id || (p as any).id,
            mtid: materialId,
            title: p.title,
            unitCode: p.unitCode || p.courseCode || 'MOI',
            unitName: p.unitName || p.title,
            school: p.school || 'Moi University',
            examYear: String(p.examYear || 2025),
            semester: p.semester || 'Semester 1',
            academicYear: p.academicYear || '',
            department: p.department || '',
            description: p.description || '',
            type: p.type,
            downloadsCount: p.downloads || 4500,
            starsCount: 28,
            ratingScore: p.ratingScore || '4.8',
            thumbnail: p.thumbnail 
              || (p.fileType === 'image' || p.fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)/i) ? p.fileUrl : undefined)
              || (Array.isArray(p.attachments) ? p.attachments.find((att: any) => att.fileType === 'image' || att.fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)/i))?.fileUrl : undefined)
              || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
            fileUrl: p.fileUrl,
            ttsTextUrl: (p as any).ttsTextUrl,
            hasSolutions: p.type === 'solution',
            tag: `MTID: ${materialId}`
            });
          });

        if (realPastPapers.length > 0) {
          setCampusLibrary((prev) => {
            const merged = [...prev, ...realPastPapers];
            return Array.from(new Map(merged.map((p) => [p.id, p])).values());
          });
        }

        const nextPapers = realPastPapers.length > 0
          ? (demoSetting && !isSearch ? [...realPastPapers, ...INITIAL_PAST_PAPERS_DATA] : realPastPapers)
          : [];
        setPapersData((previous) => {
          if (isSearch && !append) {
            return rankMaterials(nextPapers, searchTerm.trim());
          }
          const merged = append ? [...previous, ...nextPapers] : nextPapers;
          const unique = Array.from(new Map(merged.map((paper) => [paper.id, paper])).values());
          if (searchTerm.trim()) {
            return rankMaterials(unique, searchTerm.trim());
          }
          return rankMaterialsForProfile(unique, user, searchHistory);
        });
        setPapersPage(page);
        setHasMorePapers(res.pagination?.pages ? page < res.pagination.pages : res.data.length === limit);
        setInitialLoading(false);
        setIsSearchLoading(false);
        setLoadingMore(false);
      } else if (!res.success) {
        setFetchError(true); setInitialLoading(false); setIsSearchLoading(false); setLoadingMore(false);
      } else {
        if (!append) setPapersData(demoSetting && !isSearch ? INITIAL_PAST_PAPERS_DATA : []);
        setHasMorePapers(false); setInitialLoading(false); setIsSearchLoading(false); setLoadingMore(false);
      }
    } catch (err) {
      if (requestId !== latestSearchRequest.current) return;
      console.log('Error fetching real past papers:', err); setFetchError(true); setInitialLoading(false); setIsSearchLoading(false); setLoadingMore(false);
    }
  };


  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchRealPastPapers(submittedSearchQuery.trim());
    });
    return () => subscription.remove();
  }, [submittedSearchQuery]);

  useEffect(() => {
    setPapersPage(1);
    setHasMorePapers(true);
    void fetchRealPastPapers(submittedSearchQuery.trim());
  }, [submittedSearchQuery]);

  const isSearching = submittedSearchQuery.trim().length > 0;

  const carouselPapers = !isSearching && papersData.length > 0
    ? (papersData.length <= 3 ? papersData.slice(0, Math.min(2, papersData.length)) : papersData.slice(0, 4))
    : (!isSearching && showDemoMaterials ? RECOMMENDED_PAST_PAPERS : []);

  // Auto-Scroll Suggestions Carousel (Slides every 3.8s)
  useEffect(() => {
    if (carouselPapers.length <= 1) {
      setCarouselIndex(0);
      return;
    }
    if (carouselIndex >= carouselPapers.length) setCarouselIndex(0);
    const timer = setInterval(() => {
      if (!isCarouselInteracting.current && carouselListRef.current) {
        const nextIdx = (carouselIndex + 1) % carouselPapers.length;
        setCarouselIndex(nextIdx);
        try {
          carouselListRef.current.scrollToIndex({ index: nextIdx, animated: true });
        } catch (e) {
          // ignore index out of range
        }
      }
    }, 3800);
    return () => clearInterval(timer);
  }, [carouselIndex, carouselPapers.length]);

  const [forcedOriginalQuery, setForcedOriginalQuery] = useState<string | null>(null);
  const downloadedPastPaperItems = React.useMemo<PastPaperItem[]>(() => downloadedPapers.map((paper: any) => ({
    id: paper._id, mtid: paper.mtid, title: paper.title, unitCode: paper.unitCode || paper.courseCode || 'MOI',
    unitName: paper.unitName || paper.title, school: paper.school || 'Moi University', examYear: String(paper.examYear || ''),
    semester: paper.semester || '', academicYear: paper.academicYear || '', department: paper.department || '',
    description: paper.description || '', type: paper.type, downloadsCount: paper.downloadsCount || 0, starsCount: 0,
    ratingScore: paper.ratingScore || '', thumbnail: paper.thumbnail || '', fileUrl: paper.localUri || paper.fileUrl,
    ttsTextUrl: paper.ttsLocalUri || paper.ttsTextUrl, hasSolutions: paper.type === 'solution', tag: 'Downloaded offline'
  })), [downloadedPapers]);
  const searchablePastPapers = React.useMemo(() => Array.from(new Map([...papersData, ...downloadedPastPaperItems].map((item) => [item.id, item])).values()), [papersData, downloadedPastPaperItems]);

  const smartSearch = React.useMemo(() => {
    const q = submittedSearchQuery.trim();
    if (!q) {
      return {
        results: searchablePastPapers,
        intent: parseSmartSearchQuery(''),
        isAutoPivoted: false,
        effectiveQuery: ''
      };
    }
    const smart = smartSearchMaterials(searchablePastPapers, q);
    if (forcedOriginalQuery === q) {
      return {
        ...smart,
        isAutoPivoted: false,
        effectiveQuery: q
      };
    }
    return smart;
  }, [searchablePastPapers, submittedSearchQuery, forcedOriginalQuery]);

  const filteredPapers = smartSearch.results.filter((item) => {
    if (activeFilterDisc === 'solutions') return item.hasSolutions;
    if (activeFilterDisc === 'hot') return item.downloadsCount > 2500;
    if (activeFilterDisc === '2025') return item.examYear === '2025';
    if (activeFilterDisc === '2024') return item.examYear === '2024';
    if (activeFilterDisc === 'info') return item.school.toLowerCase().includes('information');
    if (activeFilterDisc === 'science') return item.school.toLowerCase().includes('science');

    return true;
  });

  const feedItems = isSearching
    ? filteredPapers
    : (filteredPapers.length <= 3 ? filteredPapers : filteredPapers.slice(carouselPapers.length));

  const allPool = React.useMemo(() => {
    const combined = [
      ...papersData,
      ...downloadedPastPaperItems,
      ...campusLibrary,
      ...INITIAL_PAST_PAPERS_DATA,
      ...RECOMMENDED_PAST_PAPERS
    ];
    const seen = new Set<string>();
    return combined.filter((p) => {
      const key = p.id || p.mtid;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [papersData, downloadedPastPaperItems, campusLibrary]);

  const searchRecommendations = React.useMemo(() => {
    if (!isSearching) return { youMayAlsoLike: [] as PastPaperItem[], continuationFeed: [] as PastPaperItem[], feedBlocks: [], contextLabel: '' };
    return getSearchRecommendationSections(
      allPool,
      filteredPapers,
      submittedSearchQuery,
      smartSearch.intent,
      user,
      searchHistory
    );
  }, [allPool, filteredPapers, submittedSearchQuery, smartSearch.intent, user, searchHistory, isSearching]);

  const searchCarouselListRef = useRef<FlatList>(null);
  const isSearchCarouselInteracting = useRef(false);
  const [searchCarouselIndex, setSearchCarouselIndex] = useState(0);

  // Auto-Scroll "You May Also Like" Carousel (Slides every 3.8s)
  useEffect(() => {
    if (!isSearching || searchRecommendations.youMayAlsoLike.length <= 1) {
      setSearchCarouselIndex(0);
      return;
    }
    const timer = setInterval(() => {
      if (!isSearchCarouselInteracting.current && searchCarouselListRef.current) {
        setSearchCarouselIndex((prev) => {
          const nextIdx = (prev + 1) % searchRecommendations.youMayAlsoLike.length;
          try {
            searchCarouselListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
          } catch (_) {}
          return nextIdx;
        });
      }
    }, 3800);
    return () => clearInterval(timer);
  }, [isSearching, searchRecommendations.youMayAlsoLike.length]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceToBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);

    if (distanceToBottom < 600 && hasMorePapers && !loadingMore && !initialLoading) {
      void fetchRealPastPapers(submittedSearchQuery.trim().length > 1 ? submittedSearchQuery : '', papersPage + 1, true);
    }
  };

  const handleToggleStar = (id: string, e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setUserStars((prev) => {
      const isStarred = !prev[id];
      setPapersData((list) =>
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

  const handleOpenPreview = (item: PastPaperItem) => {
    setPreviewDoc({
      id: item.id,
      mtid: item.mtid,
      title: item.title,
      unitCode: item.unitCode,
      unitName: item.unitName,
      school: item.school,
      fileUrl: item.fileUrl,
      ttsTextUrl: item.ttsTextUrl,
      summary: `Official End of Semester Examination Paper for ${item.unitCode} (${item.examYear}, ${item.semester}).`,
      sampleText: `Examination paper for ${item.unitCode}: ${item.title}. Question 1 (20 Marks). Solve all section parts.`
    });
    setShowPreviewModal(true);
  };

  const handleDownload = async (item: PDFDocumentItem | PastPaperItem) => {
    try {
      await saveDownloadedPaper({
        _id: `pp_${item.id}`,
        title: item.title,
        school: item.school || 'Moi University',
        department: item.unitName || item.unitCode,
        courseCode: item.unitCode,
        unitCode: item.unitCode,
        unitName: item.unitName || item.unitCode,
        type: 'past_paper',
        examYear: 2024,
        fileUrl: item.fileUrl,
        ttsTextUrl: item.ttsTextUrl,
        fileType: 'pdf',
        uploadedBy: { _id: 'moi_exams', name: 'Moi University Examination Board' } as any,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      showIceMessage(
        'Downloaded Offline',
        `"${item.title}" saved to your offline downloads tab!`,
        [
          { text: 'OK' },
          { text: 'View Downloads', onPress: () => router.push('/(tabs)/downloads') }
        ]
      );
    } catch (e) {
      showIceMessage('Download Error', 'Could not save past paper offline.');
    }
  };

  const carouselTitles = [
    ['Recently Uploaded', 'Fresh examination materials from students and departments'],
    ['Most Downloaded', 'Popular papers students are revising now'],
    ['Top Rated', 'Highly rated papers worth revising'],
    ['Based on Your Profile', 'Matched to your course and academic profile']
  ];
  const feedBlocks: Array<{ kind: 'carousel' | 'grid'; items: PastPaperItem[]; title?: string; subtitle?: string }> = [];
  let feedCursor = 0;
  let carouselTitleIndex = 0;
  while (feedCursor < feedItems.length) {
    const carouselItems = feedItems.slice(feedCursor, feedCursor + DISCOVERY_BLOCK_SIZE);
    if (carouselItems.length >= 2) {
      const [title, subtitle] = carouselTitles[carouselTitleIndex % carouselTitles.length];
      feedBlocks.push({ kind: 'carousel', items: carouselItems, title, subtitle });
      carouselTitleIndex += 1;
      feedCursor += carouselItems.length;
    }

    if (feedCursor < feedItems.length) {
      const gridItems = feedItems.slice(feedCursor, feedCursor + DISCOVERY_BLOCK_SIZE);
      feedBlocks.push({ kind: 'grid', items: gridItems });
      feedCursor += gridItems.length;
    }
  }

  const renderGridItems = (items: PastPaperItem[]) => (
    <View style={styles.gridContainer}>
      {items.map((item) => {
        const isStarred = !!userStars[item.id];
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
                <Text style={styles.gridBadgeText}>{item.unitCode}</Text>
              </View>
              {item.hasSolutions && (
                <View style={styles.gridSolutionBadge}>
                  <Text style={styles.gridSolutionText}>✓ Solved</Text>
                </View>
              )}
              <View style={styles.gridRatingBadge}>
                <StarIcon color="#eab308" size={11} />
                <Text style={styles.gridRatingText}>{item.ratingScore}</Text>
              </View>
            </View>

            <View style={styles.gridBody}>
              <Text style={styles.gridPaperType}>{item.mtid ? `mtid: ${item.mtid} • ` : ''}{item.semester} • {item.examYear}</Text>
              {searchQuery.trim().length > 0 && smartSearch.intent.keywords.length > 0 ? (
                <HighlightText
                  text={item.title}
                  highlightWords={smartSearch.intent.keywords}
                  style={styles.gridTitle}
                  numberOfLines={2}
                />
              ) : (
                <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
              )}
              <Text style={styles.gridSub}>{item.school}</Text>

              <View style={styles.gridFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <DownloadIcon color="#15803d" size={12} />
                  <Text style={styles.gridDownloads}>{formatCount(item.downloadsCount)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.miniStarBtn, isStarred && styles.miniStarBtnActive]}
                  onPress={(event) => handleToggleStar(item.id, event)}
                >
                  <StarIcon color={isStarred ? '#ca8a04' : '#64748b'} size={12} />
                </TouchableOpacity>
                <View style={styles.miniArrow}>
                  <ChevronRightIcon color="#15803d" size={14} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const handleRequestMissingMaterial = () => {
    const courseCode = searchQuery.trim();
    if (!courseCode) return;

    setRequestedQuery(courseCode);

    void apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'missing_material',
        targetId: `missing_${courseCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`,
        reason: `Missing Past Paper: ${courseCode}`,
        details: `User searched for "${courseCode}" under Past Exam Papers (no exact matches). Requested this material to be uploaded.`
      })
    }).catch((err) => {
      console.warn('[PastPapers] Failed to submit missing material report:', err);
    });

    showIceMessage(
      'Past Paper Requested',
      `Your request for ${courseCode} has been received successfully and we'll be working on it shortly, you'll receive a notification once its available`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={closeSearch}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              setPapersPage(1);
              setHasMorePapers(true);
              await fetchRealPastPapers(submittedSearchQuery);
              setRefreshing(false);
            }}
            colors={['#15803d']}
          />
        }
      >
        {/* Top Search Section */}
        <View ref={searchContainerRef} style={styles.searchSection}>
          <View style={styles.searchBar}>
            <SearchIcon color="#94a3b8" size={18} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Describe what you want..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (requestedQuery && text.trim() !== requestedQuery) {
                  setRequestedQuery(null);
                }
              }}
              onSubmitEditing={() => {
                closeSearch();
                setSubmittedSearchQuery(searchQuery.trim());
                void saveMaterialSearchQuery(searchQuery, user).then(() => getMaterialSearchHistoryEntries().then(setSearchHistory));
                void reportMaterialSearch(searchQuery, 'past_papers');
              }}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSubmittedSearchQuery(''); setRequestedQuery(null); }}>
                <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '700', paddingHorizontal: 6 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Instant As-You-Type Autocomplete Dropdown */}
          <SmartSearchAutocomplete
            query={searchQuery}
            visible={isSearchFocused}
            historyEntries={searchHistory.map((h) => (typeof h === 'string' ? h : h.query))}
            onSelectSuggestion={(suggestion) => {
              closeSearch();
              setSearchQuery(suggestion);
              setSubmittedSearchQuery(suggestion.trim());
              setForcedOriginalQuery(null);
              void saveMaterialSearchQuery(suggestion, user).then(() => getMaterialSearchHistoryEntries().then(setSearchHistory));
              void reportMaterialSearch(suggestion, 'past_papers');
            }}
            onClearHistory={() => {
              void clearMaterialSearchHistory().then(() => setSearchHistory([]));
            }}
            containerStyle={{ marginHorizontal: 0, marginTop: 8 }}
          />
        </View>

        {/* Google-Style Smart Search Header */}
        <SmartSearchHeader
          intent={smartSearch.intent}
          isAutoPivoted={smartSearch.isAutoPivoted}
          totalResultsCount={filteredPapers.length}
          onAcceptSuggestion={(suggestion) => {
            setSearchQuery(suggestion);
            setSubmittedSearchQuery(suggestion.trim());
            setForcedOriginalQuery(null);
          }}
          onSearchInsteadOriginal={() => {
            setForcedOriginalQuery(searchQuery);
            setSubmittedSearchQuery(searchQuery.trim());
          }}
          onChipPress={(chip) => {
            setSearchQuery(chip);
            setSubmittedSearchQuery(chip.trim());
            setForcedOriginalQuery(null);
          }}
          onRemoveChip={(chip) => {
            const remainingQuery = searchQuery.replace(new RegExp(`\\b${chip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), '').replace(/\s+/g, ' ').trim();
            setSearchQuery(remainingQuery);
            setSubmittedSearchQuery(remainingQuery);
            setForcedOriginalQuery(null);
          }}
        />

        {/* Filter Discs Pills Header */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.discScroll}
          contentContainerStyle={styles.discContent}
        >
          {FILTER_DISCS.map((disc) => {
            const isActive = activeFilterDisc === disc.id;
            const renderDiscIcon = (iconType?: string) => {
              switch (iconType) {
                case 'check':
                  return <CheckIcon color={isActive ? '#ffffff' : '#15803d'} size={14} />;
                case 'flame':
                  return <FlameIcon color={isActive ? '#ffffff' : '#ea580c'} size={14} />;
                case 'zap':
                  return <ZapIcon color={isActive ? '#ffffff' : '#2563eb'} size={14} />;
                case 'document':
                  return <DocumentIcon color={isActive ? '#ffffff' : '#15803d'} size={14} />;
                case 'laptop':
                  return <LaptopIcon color={isActive ? '#ffffff' : '#0284c7'} size={14} />;
                case 'book':
                  return <BookIcon color={isActive ? '#ffffff' : '#15803d'} size={14} />;
                default:
                  return null;
              }
            };

            return (
              <TouchableOpacity
                key={disc.id}
                style={[styles.discPill, isActive && styles.discPillActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                onPress={() => setActiveFilterDisc(disc.id)}
                activeOpacity={0.75}
              >
                {renderDiscIcon(disc.iconType)}
                <Text style={[styles.discText, isActive && styles.discTextActive]}>
                  {disc.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* AUTO-SCROLLING SUGGESTIONS CAROUSEL */}
        {carouselPapers.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <SparklesIcon color="#15803d" size={18} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>
                  {isSearching ? 'Top Matches' : 'Recommended Past Exams'}
                </Text>
                <Text style={styles.sectionSub}>
                  {isSearching
                    ? (smartSearch.intent.school
                        ? `Auto-matched for ${smartSearch.intent.school}`
                        : smartSearch.intent.unitCode
                          ? `Auto-matched for ${smartSearch.intent.unitCode}`
                          : `Top results for "${smartSearch.effectiveQuery || searchQuery}"`)
                    : 'Auto-suggested for your upcoming examinations'}
                </Text>
              </View>
            </View>

            <FlatList
              ref={carouselListRef}
              data={carouselPapers}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselListContent}
          snapToInterval={CAROUSEL_CARD_WIDTH + 14}
          decelerationRate="fast"
          onScrollBeginDrag={() => { isCarouselInteracting.current = true; }}
          onScrollEndDrag={() => { setTimeout(() => { isCarouselInteracting.current = false; }, 3000); }}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (CAROUSEL_CARD_WIDTH + 14));
            setCarouselIndex(Math.max(0, Math.min(nextIndex, carouselPapers.length - 1)));
            setTimeout(() => { isCarouselInteracting.current = false; }, 3000);
          }}
          getItemLayout={(_, index) => ({
            length: CAROUSEL_CARD_WIDTH + 14,
            offset: (CAROUSEL_CARD_WIDTH + 14) * index,
            index
          })}
          onScrollToIndexFailed={(info) => {
            carouselListRef.current?.scrollToOffset({
              offset: info.index * (CAROUSEL_CARD_WIDTH + 14),
              animated: true
            });
          }}
          renderItem={({ item }) => (
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
                    <Text style={styles.carouselTypeText}>{item.hasSolutions ? '✓ Solved' : 'Exam Paper'}</Text>
                  </View>
                  {item.tag && (
                    <View style={styles.carouselTagBadge}>
                      <Text style={styles.carouselTagText}>{item.tag}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.carouselBody}>
                <Text style={styles.carouselMeta}>{item.mtid ? `mtid: ${item.mtid} • ` : ''}{item.unitCode} • {item.school}</Text>
                <Text style={styles.carouselTitle} numberOfLines={2}>{item.title}</Text>

                <View style={styles.carouselFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <DownloadIcon color="#15803d" size={13} />
                    <Text style={styles.carouselStats}>{formatCount(item.downloadsCount)} downloads</Text>
                  </View>
                  <Text style={styles.ratingText}>⭐ {item.ratingScore}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Carousel Pagination Indicator Dots */}
        <View style={styles.dotsRow}>
          {carouselPapers.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === carouselIndex ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>
      </>
    )}

        {/* MAIN FEED: FACEBOOK STYLE LAZY LOADED CONTINUOUS SCROLL */}










        {initialLoading ? (
          <ShimmerGridLoader title="loading more resources" count={6} />
        ) : fetchError && papersData.length === 0 && downloadedPastPaperItems.length === 0 && !showDemoMaterials ? (
          <OfflineState onRetry={() => fetchRealPastPapers(submittedSearchQuery.trim())} />
        ) : isSearching ? (
          isSearchLoading && filteredPapers.length === 0 ? (
            <ShimmerGridLoader title={`Searching past papers for "${searchQuery}"...`} count={4} />
          ) : (
            <View style={{ marginTop: 20 }}>
              {/* SECTION 1: SEARCH MATCHES */}
              {filteredPapers.length > 0 && (
                <>
                  <View style={[styles.sectionHeaderRow, { marginTop: 8 }]}>
                    <View style={[styles.sectionIconCircle, { backgroundColor: '#dcfce7' }]}>
                      <SparklesIcon color="#15803d" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>Top Match Results</Text>
                      <Text style={styles.sectionSub}>
                        {smartSearch.isAutoPivoted
                          ? `Auto-matched for "${smartSearch.effectiveQuery}"`
                          : (smartSearch.intent.school
                              ? `Auto-matched for ${smartSearch.intent.school}`
                              : smartSearch.intent.unitCode
                                ? `Auto-matched for ${smartSearch.intent.unitCode}`
                                : `${filteredPapers.length} paper${filteredPapers.length === 1 ? '' : 's'} found for "${smartSearch.effectiveQuery || searchQuery}"`)}
                      </Text>
                    </View>
                  </View>
                  {renderGridItems(filteredPapers)}
                </>
              )}

              {/* ZERO DIRECT RESULTS FALLBACK */}
              {filteredPapers.length === 0 && !isSearchLoading && (
                <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 16, marginVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  {requestedQuery === searchQuery.trim() ? (
                    <>
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <CheckIcon color="#15803d" size={24} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#15803d', textAlign: 'center' }}>
                        Request Sent Successfully
                      </Text>
                      <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center', maxWidth: 320, lineHeight: 18 }}>
                        Your request for "{searchQuery.trim()}" has been recorded. You'll receive a notification once it's available.
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={{ marginTop: 14, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        onPress={() => {
                          setSearchQuery('');
                          setRequestedQuery(null);
                        }}
                      >
                        <ChevronRightIcon color="#0f172a" size={13} style={{ transform: [{ rotate: '180deg' }] }} />
                        <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 12 }}>
                          Back to Past Papers
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <DocumentIcon color="#94a3b8" size={36} />
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 10, textAlign: 'center' }}>
                        No exact matches for "{searchQuery}"
                      </Text>
                      <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center', maxWidth: 300, lineHeight: 18 }}>
                        {smartSearch.intent.didYouMeanText
                          ? `We found a related recommendation: "${smartSearch.intent.didYouMeanText}". Tap the recommendation above, or browse related papers below.`
                          : 'Explore related papers and recommendations from campus below.'}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={{ marginTop: 14, backgroundColor: '#15803d', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        onPress={handleRequestMissingMaterial}
                      >
                        <SparklesIcon color="#ffffff" size={14} />
                        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                          Request this Past Paper
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* SECTION 2: YOU MAY ALSO LIKE (AUTO-SCROLLING HORIZONTAL CAROUSEL) */}
              {searchRecommendations.youMayAlsoLike.length > 0 && (
                <View style={{ marginTop: filteredPapers.length > 0 ? 32 : 12 }}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={[styles.sectionIconCircle, { backgroundColor: '#fef3c7' }]}>
                      <SparklesIcon color="#d97706" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>You May Also Like</Text>
                      <Text style={styles.sectionSub}>
                        Closest related to {searchRecommendations.contextLabel}
                      </Text>
                    </View>
                  </View>

                  <FlatList
                    ref={searchCarouselListRef}
                    data={searchRecommendations.youMayAlsoLike}
                    keyExtractor={(item) => `search-like-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselListContent}
                    snapToInterval={CAROUSEL_CARD_WIDTH + 14}
                    decelerationRate="fast"
                    onScrollBeginDrag={() => { isSearchCarouselInteracting.current = true; }}
                    onScrollEndDrag={() => { setTimeout(() => { isSearchCarouselInteracting.current = false; }, 3000); }}
                    onMomentumScrollEnd={(event) => {
                      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (CAROUSEL_CARD_WIDTH + 14));
                      setSearchCarouselIndex(Math.max(0, Math.min(nextIndex, searchRecommendations.youMayAlsoLike.length - 1)));
                      setTimeout(() => { isSearchCarouselInteracting.current = false; }, 3000);
                    }}
                    onScrollToIndexFailed={(info) => {
                      searchCarouselListRef.current?.scrollToOffset({
                        offset: info.index * (CAROUSEL_CARD_WIDTH + 14),
                        animated: true
                      });
                    }}
                    getItemLayout={(_, index) => ({
                      length: CAROUSEL_CARD_WIDTH + 14,
                      offset: (CAROUSEL_CARD_WIDTH + 14) * index,
                      index
                    })}
                    renderItem={({ item }) => (
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
                              <Text style={styles.carouselTypeText}>{item.hasSolutions ? '✓ Solved' : 'Exam Paper'}</Text>
                            </View>
                            {item.tag && (
                              <View style={styles.carouselTagBadge}>
                                <Text style={styles.carouselTagText}>{item.tag}</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.carouselBody}>
                          <Text style={styles.carouselMeta}>{item.mtid ? `mtid: ${item.mtid} • ` : ''}{item.unitCode} • {item.school}</Text>
                          <Text style={styles.carouselTitle} numberOfLines={2}>{item.title}</Text>

                          <View style={styles.carouselFooter}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <DownloadIcon color="#15803d" size={13} />
                              <Text style={styles.carouselStats}>{formatCount(item.downloadsCount)} downloads</Text>
                            </View>
                            <Text style={styles.ratingText}>⭐ {item.ratingScore}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />

                  {/* Carousel Pagination Indicator Dots */}
                  <View style={styles.dotsRow}>
                    {searchRecommendations.youMayAlsoLike.map((_, i) => (
                      <View
                        key={i}
                        style={[styles.dot, i === searchCarouselIndex ? styles.activeDot : styles.inactiveDot]}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* SECTION 3: CONTINUATION FEED (SMART RHYTHM GRID & CAROUSELS) */}
              {searchRecommendations.continuationFeed.length > 0 && (
                <View style={{ marginTop: 28 }}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={[styles.sectionIconCircle, { backgroundColor: '#eff6ff' }]}>
                      <TrendingUpIcon color="#2563eb" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>Trending & Recommended Past Papers</Text>
                      <Text style={styles.sectionSub}>
                        Continue browsing popular campus exams & model papers
                      </Text>
                    </View>
                  </View>

                  {(searchRecommendations.feedBlocks || []).map((block, bIdx) => {
                    if (block.kind === 'carousel') {
                      return (
                        <PastPaperCarouselSection
                          key={`search-carousel-${block.title}-${bIdx}`}
                          title={block.title || 'Recommended For You'}
                          subtitle={block.subtitle || 'Personalized study resources'}
                          items={block.items}
                          onOpenPreview={handleOpenPreview}
                        />
                      );
                    }
                    return (
                      <React.Fragment key={`search-grid-${bIdx}`}>
                        {renderGridItems(block.items)}
                      </React.Fragment>
                    );
                  })}
                </View>
              )}
            </View>
          )
        ) : (
          feedBlocks.map((block, index) => {
            if (!block.items || block.items.length === 0) return null;
            if (block.kind === 'carousel') {
              return (
                <PastPaperCarouselSection
                  key={`carousel-${block.title}-${index}`}
                  title={block.title || ''}
                  subtitle={block.subtitle || ''}
                  items={block.items}
                  onOpenPreview={handleOpenPreview}
                />
              );
            }
            const isFirstGrid = feedBlocks.findIndex((b) => b.kind === 'grid' && b.items && b.items.length > 0) === index;
            return (
              <React.Fragment key={`grid-${index}`}>
                {isFirstGrid && (
                  <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                    <View style={[styles.sectionIconCircle, { backgroundColor: '#dcfce7' }]}>
                      <BookIcon color="#15803d" size={18} />
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>Full Exam Revision Feed</Text>
                      <Text style={styles.sectionSub}>Past papers & model solutions from all departments</Text>
                    </View>
                  </View>
                )}
                {renderGridItems(block.items)}
              </React.Fragment>
            );
          })
        )}

        {/* Facebook Style Shimmer Skeleton Loader when fetching next 2 lines */}
        {loadingMore && <ShimmerGridLoader title="loading more resources" count={4} />}
      </ScrollView>

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
  feedScroll: {
    flex: 1
  },
  feedContent: {
    paddingBottom: 32
  },
  discoverySection: {
    marginTop: 24
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: 'none'
  } as any,
  discScroll: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    maxHeight: 52
  },
  discContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center'
  },
  discPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  discPillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  discText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  discTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    gap: 10
  },
  sectionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1
  },
  carouselListContent: {
    paddingHorizontal: 16,
    gap: 14
  },
  carouselCard: {
    width: CAROUSEL_CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  carouselThumbnailContainer: {
    height: 132,
    width: '100%',
    position: 'relative'
  },
  carouselImage: {
    width: '100%',
    height: '100%'
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)'
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
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  carouselTypeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  carouselTagBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  carouselTagText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700'
  },
  carouselBody: {
    padding: 12
  },
  carouselMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 4
  },
  carouselTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
    height: 36
  },
  carouselFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  carouselStats: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#eab308'
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6
  },
  dot: {
    height: 6,
    borderRadius: 3
  },
  activeDot: {
    width: 20,
    backgroundColor: '#15803d'
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#cbd5e1'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    columnGap: 10,
    rowGap: 12,
    marginTop: 4
  },
  gridCard: {
    // Two responsive columns. flexBasis/flexGrow keeps the layout stable on
    // narrow phones and prevents a card from taking the whole row.
    width: '47%',
    flexBasis: '47%',
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  gridImageContainer: {
    height: 100,
    width: '100%',
    position: 'relative'
  },
  gridImage: {
    width: '100%',
    height: '100%'
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  gridBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  gridSolutionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#15803d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  gridSolutionText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  gridRatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  gridRatingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a'
  },
  gridBody: {
    padding: 10
  },
  gridPaperType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
    textTransform: 'uppercase'
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
    lineHeight: 16,
    height: 32
  },
  gridSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  gridDownloads: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  miniStarBtn: {
    padding: 3,
    borderRadius: 4,
    backgroundColor: '#f1f5f9'
  },
  miniStarBtnActive: {
    backgroundColor: '#fef9c3'
  },
  miniArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  shimmerContainer: {
    paddingHorizontal: 16,
    marginTop: 14
  },
  shimmerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  shimmerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e'
  },
  shimmerLoadingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d'
  },
  shimmerCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    height: 180,
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden'
  },
  shimmerThumbnail: {
    height: 95,
    backgroundColor: '#cbd5e1'
  },
  shimmerBody: {
    padding: 10,
    gap: 6
  },
  shimmerBadge: {
    width: 50,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#cbd5e1'
  },
  shimmerTitleLine: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#cbd5e1'
  },
  shimmerSubLine: {
    width: '60%',
    height: 10,
    borderRadius: 4,
    backgroundColor: '#cbd5e1'
  }
});
