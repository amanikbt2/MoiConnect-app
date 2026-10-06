import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
  Linking,
  Platform,
  AppState
} from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { getShowDemoMaterialsSetting } from '../../src/services/appSettingsService';
import { PortalViewerModal, PortalConfig } from '../../src/components/PortalViewerModal';
import { getGlobalSearchDestination, rankMaterialsForProfile } from '../../src/utils/materialSearch';

import {
  SearchIcon,
  FileTextIcon,
  BookIcon,
  HouseIcon,
  StarIcon,
  UsersIcon,
  SparklesIcon,
  DownloadIcon,
  ChevronRightIcon,
  UploadIcon,
  NotesIcon,
  GraduationCapIcon,
  LaptopIcon,
  SendIcon
} from '../../src/components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);
const CARD_GAP = 14;

interface SuggestedMaterial {
  id: string;
  title: string;
  code: string;
  school: string;
  paperType: string;
  downloads: string;
  recommendationTag: string;
  thumbnail: string;
}

const SUGGESTED_MATERIALS: SuggestedMaterial[] = [];

function getGreetingText(userName?: string): string {
  const hour = new Date().getHours();
  let timePrefix = 'Jambo';

  if (hour >= 5 && hour < 12) {
    timePrefix = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    timePrefix = 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    timePrefix = 'Good evening';
  } else {
    const swahiliGreetings = ['Jambo', 'Habari', 'Hello'];
    timePrefix = swahiliGreetings[hour % swahiliGreetings.length];
  }

  if (userName && userName.trim()) {
    const firstName = userName.trim().split(' ')[0];
    return `${timePrefix}, ${firstName}`;
  }

  return `${timePrefix}, Moi University Student`;
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSuggestedIndex, setActiveSuggestedIndex] = useState(0);

  // Built-in Portal Viewer Modal State
  const [activePortal, setActivePortal] = useState<PortalConfig | null>(null);
  const [showPortalModal, setShowPortalModal] = useState(false);

  const handleOpenPortal = async (config: PortalConfig) => {

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(config.url, '_blank', 'noopener,noreferrer');
      } else {
        Linking.openURL(config.url);
      }
      return;
    }
    setActivePortal(config);
    setShowPortalModal(true);
  };

  const handleGlobalSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    router.push(getGlobalSearchDestination(query));
    setSearchQuery('');
  };

  const flatListRef = useRef<FlatList>(null);
  const isInteracting = useRef(false);

  const { user } = useAuth();
  const router = useAppNavigation();
  const profileComplete = Boolean(
    user?.course && user.course !== 'Unset' &&
    user?.school && user.school !== 'Unset' &&
    user?.yearOfStudy && user.yearOfStudy !== 'Unset'
  );

  const [showDemoMaterials, setShowDemoMaterials] = useState(false);
  const [realSuggestedMaterials, setRealSuggestedMaterials] = useState<SuggestedMaterial[]>([]);

  useEffect(() => {
    fetchDashboardData();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchDashboardData();
    });
    return () => subscription.remove();
  }, [user]);

  const displaySuggestedMaterials = realSuggestedMaterials.length > 0
    ? realSuggestedMaterials
    : (showDemoMaterials ? SUGGESTED_MATERIALS : []);

  // Smart continuous auto-scroll timer for Suggested Materials
  useEffect(() => {
    if (!user || displaySuggestedMaterials.length === 0) return;
    const timer = setInterval(() => {
      if (!isInteracting.current && flatListRef.current) {
        const nextIndex = (activeSuggestedIndex + 1) % displaySuggestedMaterials.length;
        setActiveSuggestedIndex(nextIndex);
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 3800);

    return () => clearInterval(timer);
  }, [displaySuggestedMaterials.length, Boolean(user)]);

  const fetchDashboardData = async () => {
    try {
      getShowDemoMaterialsSetting().then((enabled) => setShowDemoMaterials(enabled));

      const res = await apiRequest<{ data: any[] }>('/papers');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: SuggestedMaterial[] = res.data.map((p, idx) => ({
          id: p._id || String(idx),
          title: p.title,
          code: p.unitCode || p.courseCode || 'MOI',
          school: p.school || 'Moi University',
          paperType: p.type === 'cat'
            ? 'CAT Paper'
            : p.type === 'past_paper'
              ? 'Past Paper'
              : p.type === 'solution'
                ? 'Exam Solution'
                : 'Notes PDF',
          downloads: String(p.downloads || 45),
          recommendationTag: p.mtid ? `MTID: ${p.mtid}` : '✨ Real Uploaded',
          thumbnail: p.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'
        }));
        setRealSuggestedMaterials(rankMaterialsForProfile(mapped, user));
      } else {
        setRealSuggestedMaterials([]);
      }

      if (user) {
        const favsRes = await apiRequest<{ favorites: any[] }>('/favorites');
        if (favsRes && favsRes.success && favsRes.data && Array.isArray(favsRes.data.favorites)) {
          setFavoritesCount(favsRes.data.favorites.length);
        }
      }
    } catch (e) {
      setRealSuggestedMaterials([]);
      console.warn('Dashboard fetch error', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleScrollBegin = () => {
    isInteracting.current = true;
  };

  const handleScrollEnd = () => {
    setTimeout(() => {
      isInteracting.current = false;
    }, 4000);
  };

  const renderSuggestedCard = ({ item }: { item: SuggestedMaterial }) => {
    return (
      <TouchableOpacity
        style={styles.suggestedCard}
        activeOpacity={0.88}
        onPress={() => router.push(`/(tabs)/academics?search=${encodeURIComponent(item.code)}`)}
      >
        {/* Thumbnail Header */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          <View style={styles.thumbnailOverlay} />

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.paperTypeBadge}>
              <Text style={styles.paperTypeText}>{item.paperType}</Text>
            </View>

            <View style={styles.matchBadge}>
              <SparklesIcon color="#15803d" size={12} style={{ marginRight: 4 }} />
              <Text style={styles.matchText}>{item.recommendationTag}</Text>
            </View>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardMeta}>
            {item.code} • {item.school}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.downloadRow}>
              <DownloadIcon color="#15803d" size={14} style={{ marginRight: 4 }} />
              <Text style={styles.downloadText}>{item.downloads} downloads</Text>
            </View>
            <View style={styles.actionArrow}>
              <ChevronRightIcon color="#15803d" size={16} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#15803d']} />}
    >
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.welcomeText}>
          {getGreetingText(user?.name)}
        </Text>
        <Text style={styles.bannerSub}>Find past papers, revision notes, and verified rental houses.</Text>

        {/* Global Search Bar */}
        <View style={styles.searchBox}>
          <SearchIcon color="#94a3b8" size={18} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search papers by code, unit, or house..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleGlobalSearch}
            style={styles.searchInput}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleGlobalSearch}
              style={styles.searchSendBtn}
            >
              <SendIcon color="#ffffff" size={14} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Access Actions (2x2 Grid) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <View style={styles.gridContainer}>
          {/* Notes PDF row (full-width feature card) */}
          <TouchableOpacity
            style={styles.notesCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/academics')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: '#dbeafe' }]}>
              <NotesIcon color="#2563eb" size={28} />
            </View>
            <View style={styles.notesCardText}>
              <Text style={styles.quickTitle}>Notes PDF</Text>
              <Text style={styles.quickSub}>Lecture notes & study guides</Text>
            </View>
            <ChevronRightIcon color="#94a3b8" size={18} />
          </TouchableOpacity>

          <View style={styles.cardRow}>
            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() => router.push('/past-papers')}
            >
              <View style={[styles.iconWrapper, { backgroundColor: '#dcfce7' }]}>
                <FileTextIcon color="#15803d" size={28} />
              </View>
              <Text style={styles.quickTitle}>Past Papers</Text>
              <Text style={styles.quickSub}>Exam revision papers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() => router.push('/cat-papers')}
            >
              <View style={[styles.iconWrapper, { backgroundColor: '#fef3c7' }]}>
                <BookIcon color="#d97706" size={28} />
              </View>
              <Text style={styles.quickTitle}>CAT Papers</Text>
              <Text style={styles.quickSub}>Continuous assessment</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardRow}>
            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/rentals')}
            >
              <View style={[styles.iconWrapper, { backgroundColor: '#dbeafe' }]}>
                <HouseIcon color="#2563eb" size={28} />
              </View>
              <Text style={styles.quickTitle}>Rentals around Stage</Text>
              <Text style={styles.quickSub}>Student housing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() => router.push('/contribute')}
            >
              <View style={[styles.iconWrapper, { backgroundColor: '#f3e8ff' }]}>
                <UploadIcon color="#7c3aed" size={28} />
              </View>
              <Text style={styles.quickTitle}>Contribute</Text>
              <Text style={styles.quickSub}>Upload study materials</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardRow}>
            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() =>
                handleOpenPortal({
                  title: 'Moi University Student Portal',
                  url: 'https://portal.mu.ac.ke/',
                  domain: 'portal.mu.ac.ke'
                })
              }
            >
              <View style={[styles.iconWrapper, { backgroundColor: '#e0f2fe' }]}>
                <GraduationCapIcon color="#0284c7" size={28} />
              </View>
              <Text style={styles.quickTitle}>Student Portal</Text>
              <Text style={styles.quickSub}>Official Moi portal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() =>
                handleOpenPortal({
                  title: 'MuSOMi E-Learning Portal',
                  url: 'https://elearning.mu.ac.ke/',
                  domain: 'elearning.mu.ac.ke'
                })
              }
            >
              <View style={[styles.iconWrapper, { backgroundColor: '#d1fae5' }]}>
                <LaptopIcon color="#059669" size={28} />
              </View>
              <Text style={styles.quickTitle}>MUSOMI E-Learning</Text>
              <Text style={styles.quickSub}>Online portal & lectures</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Suggested Materials Section */}
      <View style={styles.suggestedSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.sparkleIconCircle}>
              <SparklesIcon color="#15803d" size={18} />
            </View>
            <View>
              <Text style={styles.sectionTitleNoMargin}>Suggested materials</Text>
              <Text style={styles.sectionSubtitle}>based on your profile</Text>
            </View>
          </View>
        </View>

        {user && !profileComplete ? (
          <View style={styles.loginPromptCard}>
            <View style={styles.loginPromptIconContainer}>
              <SparklesIcon color="#15803d" size={24} />
            </View>
            <View style={styles.loginPromptTextGroup}>
              <Text style={styles.loginPromptTitle}>Complete profile to get suggested material</Text>
              <Text style={styles.loginPromptSub}>
                Add your course, school/faculty, and year so we can show your best matches.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.loginPromptBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/profile?complete=1')}
            >
              <Text style={styles.loginPromptBtnText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        ) : user ? (
          displaySuggestedMaterials.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={displaySuggestedMaterials}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderSuggestedCard}
                contentContainerStyle={styles.suggestedListContent}
                snapToInterval={CARD_WIDTH + CARD_GAP}
                decelerationRate="fast"
                onScrollBeginDrag={handleScrollBegin}
                onScrollEndDrag={handleScrollEnd}
                onMomentumScrollEnd={handleScrollEnd}
                getItemLayout={(_, index) => ({
                  length: CARD_WIDTH + CARD_GAP,
                  offset: (CARD_WIDTH + CARD_GAP) * index,
                  index,
                })}
                onScrollToIndexFailed={(info) => {
                  flatListRef.current?.scrollToOffset({
                    offset: info.index * (CARD_WIDTH + CARD_GAP),
                    animated: true,
                  });
                }}
              />

              {/* Carousel Pagination Dots */}
              <View style={styles.paginationDots}>
                {displaySuggestedMaterials.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.dot,
                      index === activeSuggestedIndex ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, marginHorizontal: 16 }}>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>No academic materials available yet.</Text>
            </View>
          )
        ) : (
          <View style={styles.loginPromptCard}>
            <View style={styles.loginPromptIconContainer}>
              <SparklesIcon color="#15803d" size={24} />
            </View>
            <View style={styles.loginPromptTextGroup}>
              <Text style={styles.loginPromptTitle}>Sign in to get suggested materials</Text>
              <Text style={styles.loginPromptSub}>
                Get personalized past papers, CATs, and study notes tailored for your course.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.loginPromptBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginPromptBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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

      {/* Built-in Portal Viewer Modal with Header & Back Button */}
      <PortalViewerModal
        visible={showPortalModal}
        portal={activePortal}
        onClose={() => setShowPortalModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 12
  },
  banner: {
    backgroundColor: '#15803d',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4
  },
  bannerSub: {
    fontSize: 13,
    color: '#dcfce7',
    marginBottom: 16
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  searchSendBtn: {
    backgroundColor: '#15803d',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14
  },
  gridContainer: {
    gap: 12
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...((Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' } : {}) as any),
    elevation: 2
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  quickSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b'
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...((Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' } : {}) as any),
    elevation: 2,
    gap: 14
  },
  notesCardText: {
    flex: 1
  },
  /* Suggested Materials Section Styles */
  suggestedSection: {
    marginBottom: 24
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  sparkleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitleNoMargin: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
    marginTop: 1
  },
  suggestedListContent: {
    paddingRight: 16,
    gap: CARD_GAP
  },
  suggestedCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...((Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' } : {}) as any),
    elevation: 3
  },
  thumbnailContainer: {
    height: 115,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)'
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  paperTypeBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  paperTypeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    ...((Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' } : {}) as any),
  },
  matchText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800'
  },
  cardBody: {
    padding: 14
  },
  cardMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 19,
    height: 38,
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
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  downloadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d'
  },
  actionArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14
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
  loginPromptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...((Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' } : {}) as any),
    elevation: 2
  },
  loginPromptIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  loginPromptTextGroup: {
    alignItems: 'center',
    marginBottom: 16
  },
  loginPromptTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4
  },
  loginPromptSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12
  },
  loginPromptBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    ...((Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(15, 23, 42, 0.08)' } : {}) as any),
    elevation: 2
  },
  loginPromptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 16,
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
