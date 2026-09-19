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
  Dimensions
} from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';

import {
  SearchIcon,
  FileTextIcon,
  BookIcon,
  HouseIcon,
  StarIcon,
  UsersIcon,
  SparklesIcon,
  DownloadIcon,
  ChevronRightIcon
} from '../../src/components/Icons';

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

const SUGGESTED_MATERIALS: SuggestedMaterial[] = [
  {
    id: '1',
    title: 'Calculus II Main Examination 2023',
    code: 'MAT 210',
    school: 'School of Science',
    paperType: 'Past Paper',
    downloads: '342',
    recommendationTag: '98% match',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    title: 'Database Management Systems CAT 1',
    code: 'COM 310',
    school: 'Info Sciences',
    paperType: 'CAT Paper',
    downloads: '215',
    recommendationTag: 'Based on COM 310',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    title: 'Software Engineering Principles',
    code: 'COM 410',
    school: 'Computing Dept',
    paperType: 'Past Paper',
    downloads: '189',
    recommendationTag: 'Popular in Year 4',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '4',
    title: 'Discrete Mathematics & Structures',
    code: 'COM 112',
    school: 'Mathematics Dept',
    paperType: 'Special Exam',
    downloads: '512',
    recommendationTag: 'Recommended',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '5',
    title: 'Object-Oriented Programming (Java)',
    code: 'COM 211',
    school: 'Info Sciences',
    paperType: 'CAT & Solutions',
    downloads: '430',
    recommendationTag: 'Top Rated',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
  },
];

const CARD_WIDTH = 280;
const CARD_GAP = 14;

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSuggestedIndex, setActiveSuggestedIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const isInteracting = useRef(false);

  const { user } = useAuth();
  const router = useAppNavigation();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Smart continuous auto-scroll timer for Suggested Materials
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isInteracting.current && flatListRef.current) {
        const nextIndex = (activeSuggestedIndex + 1) % SUGGESTED_MATERIALS.length;
        setActiveSuggestedIndex(nextIndex);
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 3800);

    return () => clearInterval(timer);
  }, [activeSuggestedIndex]);

  const fetchDashboardData = async () => {
    try {
      if (user) {
        const favsRes = await apiRequest<{ favorites: any[] }>('/favorites');
        if (favsRes && favsRes.success && favsRes.data && Array.isArray(favsRes.data.favorites)) {
          setFavoritesCount(favsRes.data.favorites.length);
        }
      }
    } catch (e) {
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
          Jambo, {user ? user.name : 'Moi University Student'}
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
            onSubmitEditing={() => router.push(`/(tabs)/academics?search=${encodeURIComponent(searchQuery)}`)}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Quick Access Actions (2x2 Grid) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <View style={styles.gridContainer}>
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/academics?type=past_paper')}
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
              onPress={() => router.push('/(tabs)/academics?type=cat')}
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
              <Text style={styles.quickTitle}>Hostels & Rooms</Text>
              <Text style={styles.quickSub}>Student housing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() => router.push('/community')}
            >
              <View style={[styles.iconWrapper, { backgroundColor: '#f3e8ff' }]}>
                <UsersIcon color="#7c3aed" size={28} />
              </View>
              <Text style={styles.quickTitle}>Campus Community</Text>
              <Text style={styles.quickSub}>Share thoughts & chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Suggested Materials Carousel (Smart Horizontal Scroll) */}
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

        <FlatList
          ref={flatListRef}
          data={SUGGESTED_MATERIALS}
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
          {SUGGESTED_MATERIALS.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                index === activeSuggestedIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>
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
    paddingBottom: 40
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
    color: '#0f172a'
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
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
  }
});
