import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Platform
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

export interface SmartMirrorSkeletonProps {
  carouselTitle?: string;
  carouselSubtitle?: string;
  gridTitle?: string;
  showCarousel?: boolean;
  gridCount?: number;
  carouselCount?: number;
}

export const SmartMirrorSkeleton: React.FC<SmartMirrorSkeletonProps> = ({
  carouselTitle = 'Recommended Materials',
  carouselSubtitle = 'Matched to your course and academic profile',
  gridTitle = 'loading more resources',
  showCarousel = true,
  gridCount = 6,
  carouselCount = 3
}) => {
  const fadeAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.95,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web'
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web'
        })
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      {/* 1. TOP HORIZONTAL CAROUSEL SHIMMER (STATIC CARDS, NO DOTS) */}
      {showCarousel && (
        <View style={styles.carouselSection}>
          {/* Section Header */}
          <View style={styles.sectionHeaderRow}>
            <Animated.View style={[styles.sectionIconCircle, { opacity: fadeAnim }]} />
            <View style={{ flex: 1, gap: 5 }}>
              <Animated.View style={[styles.shimmerLine, { width: 170, height: 16, borderRadius: 4, opacity: fadeAnim }]} />
              <Animated.View style={[styles.shimmerLine, { width: 230, height: 11, borderRadius: 4, opacity: fadeAnim }]} />
            </View>
          </View>

          {/* Horizontal Static Shimmering Cards */}
          <ScrollView
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselScrollContent}
          >
            {Array.from({ length: carouselCount }).map((_, i) => (
              <Animated.View key={`carousel-shim-${i}`} style={[styles.carouselCard, { opacity: fadeAnim }]}>
                {/* Simulated Thumbnail */}
                <View style={styles.carouselThumbnail}>
                  <View style={styles.carouselBadgeTopLeft} />
                  <View style={styles.carouselBadgeTopRight} />
                </View>

                {/* Simulated Card Body */}
                <View style={styles.carouselBody}>
                  <View style={[styles.shimmerLine, { width: '45%', height: 10 }]} />
                  <View style={[styles.shimmerLine, { width: '90%', height: 14, marginTop: 4 }]} />
                  <View style={[styles.shimmerLine, { width: '65%', height: 14, marginTop: 2 }]} />

                  {/* Simulated Footer */}
                  <View style={styles.carouselFooter}>
                    <View style={[styles.shimmerLine, { width: 80, height: 11 }]} />
                    <View style={[styles.shimmerLine, { width: 36, height: 11 }]} />
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 2. GRID SECTION HEADER */}
      <View style={styles.gridHeaderRow}>
        <Animated.View style={[styles.shimmerDot, { opacity: fadeAnim }]} />
        <Text style={styles.gridLoadingLabel}>{gridTitle}</Text>
      </View>

      {/* 3. RESPONSIVE 2-COLUMN GRID SHIMMER CARDS */}
      <View style={styles.gridContainer}>
        {Array.from({ length: gridCount }).map((_, idx) => (
          <Animated.View key={`grid-shim-${idx}`} style={[styles.gridCard, { opacity: fadeAnim }]}>
            {/* Thumbnail */}
            <View style={styles.gridThumbnail}>
              <View style={styles.gridBadgeTopLeft} />
              <View style={styles.gridBadgeTopRight} />
            </View>

            {/* Body */}
            <View style={styles.gridBody}>
              <View style={[styles.shimmerLine, { width: '50%', height: 9 }]} />
              <View style={[styles.shimmerLine, { width: '92%', height: 12, marginTop: 4 }]} />
              <View style={[styles.shimmerLine, { width: '60%', height: 12, marginTop: 2 }]} />
              <View style={[styles.shimmerLine, { width: '40%', height: 9, marginTop: 4 }]} />

              {/* Footer */}
              <View style={styles.gridFooter}>
                <View style={[styles.shimmerLine, { width: 42, height: 10 }]} />
                <View style={styles.miniStarPlaceholder} />
                <View style={styles.miniArrowPlaceholder} />
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24
  },
  carouselSection: {
    marginBottom: 20
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 10
  },
  sectionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dcfce7'
  },
  carouselScrollContent: {
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  carouselThumbnail: {
    height: 132,
    backgroundColor: '#e2e8f0',
    position: 'relative'
  },
  carouselBadgeTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 55,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#cbd5e1'
  },
  carouselBadgeTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)'
  },
  carouselBody: {
    padding: 12
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
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4
  },
  shimmerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e'
  },
  gridLoadingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    columnGap: 10,
    rowGap: 12
  },
  gridCard: {
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  gridThumbnail: {
    height: 100,
    backgroundColor: '#e2e8f0',
    position: 'relative'
  },
  gridBadgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 45,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#cbd5e1'
  },
  gridBadgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)'
  },
  gridBody: {
    padding: 10
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
  miniStarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#f1f5f9'
  },
  miniArrowPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dcfce7'
  },
  shimmerLine: {
    backgroundColor: '#cbd5e1',
    borderRadius: 4
  }
});
