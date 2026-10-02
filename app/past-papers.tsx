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
import { saveDownloadedPaper } from '../src/services/offlineStorage';
import { PDFViewerModal, formatCount, PDFDocumentItem } from '../src/components/PDFViewerModal';
import { apiRequest } from '../src/services/api';
import { getShowDemoMaterialsSetting } from '../src/services/appSettingsService';
import { OfflineState } from '../src/components/OfflineState';
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
  LaptopIcon
} from '../src/components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);

export interface PastPaperItem {
  id: string;
  mtid?: string;
  title: string;
  unitCode: string;
  unitName: string;
  school: string;
  examYear: string;
  semester: string;
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

const FILTER_DISCS = [
  { id: 'all', label: 'All Past Papers', iconType: 'all' },
  { id: 'solutions', label: 'Worked Solutions', iconType: 'check' },
  { id: 'hot', label: 'Top Downloaded', iconType: 'flame' },
  { id: '2025', label: '2025 Papers', iconType: 'zap' },
  { id: '2024', label: '2024 Papers', iconType: 'document' },
  { id: 'info', label: 'Info Sciences', iconType: 'laptop' },
  { id: 'science', label: 'Science', iconType: 'book' }
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

export default function PastPapersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterDisc, setActiveFilterDisc] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [papersData, setPapersData] = useState<PastPaperItem[]>([]);
  const [userStars, setUserStars] = useState<Record<string, boolean>>({});

  // Facebook-Style Lazy Loading State (load 4 cards = 2 rows at a time)
  const [visibleCount, setVisibleCount] = useState(4);
  const [loadingMore, setLoadingMore] = useState(false);

  // Auto-scroll Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselListRef = useRef<FlatList>(null);
  const isCarouselInteracting = useRef(false);

  // Fast PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const router = useAppNavigation();

  const [showDemoMaterials, setShowDemoMaterials] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Fetch real uploaded past papers from Cloudinary / backend API
  const fetchRealPastPapers = async () => {
    try {
      setInitialLoading(true);
      setFetchError(false);
      const demoSetting = await getShowDemoMaterialsSetting();
      setShowDemoMaterials(demoSetting);

      const res = await apiRequest<{ data: IPaper[] }>(`/papers?refresh=${Date.now()}`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const realPastPapers: PastPaperItem[] = res.data
          .filter(
            (p) =>
              p.type === 'past_paper' ||
              p.type === 'solution' ||
              p.title.toLowerCase().includes('exam') ||
              p.title.toLowerCase().includes('paper')
          )
          .map((p) => ({
            id: p._id || (p as any).id,
            mtid: p.mtid || `P${(p._id || '').substring(0, 4)}`,
            title: p.title,
            unitCode: p.unitCode || p.courseCode || 'MOI',
            unitName: p.unitName || p.title,
            school: p.school || 'Moi University',
            examYear: String(p.examYear || 2025),
            semester: p.semester || 'Semester 1',
            downloadsCount: p.downloads || 4500,
            starsCount: 28,
            ratingScore: p.ratingScore || '4.8',
            thumbnail: p.thumbnail 
              || (p.fileType === 'image' || p.fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)/i) ? p.fileUrl : undefined)
              || (Array.isArray(p.attachments) ? p.attachments.find((att: any) => att.fileType === 'image' || att.fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)/i))?.fileUrl : undefined)
              || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
            fileUrl: p.fileUrl,
            ttsTextUrl: (p as any).ttsTextUrl,
            hasSolutions: p.type === 'solution' || p.title.toLowerCase().includes('solution'),
            tag: '✨ Real Uploaded'
          }));

        setPapersData(
          realPastPapers.length > 0
            ? (demoSetting ? [...realPastPapers, ...INITIAL_PAST_PAPERS_DATA] : realPastPapers)
            : (demoSetting ? INITIAL_PAST_PAPERS_DATA : [])
        ); setInitialLoading(false);
      } else if (!res.success) {
        setFetchError(true); setInitialLoading(false);
      } else {
        setPapersData(demoSetting ? INITIAL_PAST_PAPERS_DATA : []); setInitialLoading(false);
      }
    } catch (err) {
      console.log('Error fetching real past papers:', err); setFetchError(true); setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchRealPastPapers();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchRealPastPapers();
    });
    return () => subscription.remove();
  }, []);

  // Auto-Scroll Suggestions Carousel (Slides every 3.8s)
  useEffect(() => {
    if (!RECOMMENDED_PAST_PAPERS || RECOMMENDED_PAST_PAPERS.length <= 1) return;
    const timer = setInterval(() => {
      if (!isCarouselInteracting.current && carouselListRef.current) {
        const nextIdx = (carouselIndex + 1) % RECOMMENDED_PAST_PAPERS.length;
        setCarouselIndex(nextIdx);
        try {
          carouselListRef.current.scrollToIndex({ index: nextIdx, animated: true });
        } catch (e) {
          // ignore index out of range
        }
      }
    }, 3800);
    return () => clearInterval(timer);
  }, [carouselIndex]);

  const filteredPapers = papersData.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      item.title.toLowerCase().includes(q) ||
      item.unitCode.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.school.toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (activeFilterDisc === 'solutions') return item.hasSolutions;
    if (activeFilterDisc === 'hot') return item.downloadsCount > 2500;
    if (activeFilterDisc === '2025') return item.examYear === '2025';
    if (activeFilterDisc === '2024') return item.examYear === '2024';
    if (activeFilterDisc === 'info') return item.school.toLowerCase().includes('information');
    if (activeFilterDisc === 'science') return item.school.toLowerCase().includes('science');

    return true;
  });

  const visibleFeedPapers = filteredPapers.slice(0, visibleCount);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceToBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);

    if (distanceToBottom < 300 && visibleCount < filteredPapers.length && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 4, filteredPapers.length));
        setLoadingMore(false);
      }, 850);
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
              setVisibleCount(4);
              await fetchRealPastPapers();
              setRefreshing(false);
            }}
            colors={['#15803d']}
          />
        }
      >
        {/* Top Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <SearchIcon color="#94a3b8" size={18} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search past papers, unit codes (e.g. COM 310, MAT 210)..."
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
        {((papersData.length > 0 ? papersData.slice(0, 5) : (showDemoMaterials ? RECOMMENDED_PAST_PAPERS : [])).length > 0) && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <SparklesIcon color="#15803d" size={18} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Recommended Past Exams</Text>
                <Text style={styles.sectionSub}>Auto-suggested for your upcoming examinations</Text>
              </View>
            </View>

            <FlatList
              ref={carouselListRef}
              data={papersData.length > 0 ? papersData.slice(0, 5) : (showDemoMaterials ? RECOMMENDED_PAST_PAPERS : [])}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselListContent}
          snapToInterval={CAROUSEL_CARD_WIDTH + 14}
          decelerationRate="fast"
          onScrollBeginDrag={() => { isCarouselInteracting.current = true; }}
          onScrollEndDrag={() => { setTimeout(() => { isCarouselInteracting.current = false; }, 3000); }}
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
          {(papersData.length > 0 ? papersData.slice(0, 5) : (showDemoMaterials ? RECOMMENDED_PAST_PAPERS : [])).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === carouselIndex ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>
      </>
    )}

        {/* MAIN FEED: FACEBOOK STYLE LAZY LOADED CONTINUOUS SCROLL */}
        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <View style={[styles.sectionIconCircle, { backgroundColor: '#dcfce7' }]}>
            <BookIcon color="#15803d" size={18} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Full Exam Revision Feed</Text>
            <Text style={styles.sectionSub}>Past papers & model solutions from all departments</Text>
          </View>
        </View>

        {initialLoading ? (
          <ShimmerGridLoader title="loading more resources" count={6} />
        ) : fetchError && papersData.length === 0 && !showDemoMaterials ? (
          <OfflineState onRetry={fetchRealPastPapers} />
        ) : (
          <View style={styles.gridContainer}>
          {visibleFeedPapers.map((item) => {
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
                  <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.gridSub}>{item.school}</Text>

                  <View style={styles.gridFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <DownloadIcon color="#15803d" size={12} />
                      <Text style={styles.gridDownloads}>{formatCount(item.downloadsCount)}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.miniStarBtn, isStarred && styles.miniStarBtnActive]}
                      onPress={(e) => handleToggleStar(item.id, e)}
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
    height: 125,
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
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 4
  },
  gridCard: {
    width: (SCREEN_WIDTH - 44) / 2,
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
