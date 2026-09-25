import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { IPaper } from '@moi/shared';
import { formatCompactNumber } from '../utils/formatters';
import { DownloadIcon, StarIcon } from './Icons';

interface PaperCardProps {
  paper: IPaper;
  onPress: () => void;
}

const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80';

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onPress }) => {
  const mtidText = (paper as any).mtid || 'P0001';
  const paperTypeLabel = (paper.type || 'Exam Pack').replace('_', ' ');
  const downloadsCount = (paper as any).downloads || (paper as any).downloadCount || 2200;
  const ratingScore = (paper as any).ratingScore || '4.8';

  return (
    <TouchableOpacity style={styles.squareCard} onPress={onPress} activeOpacity={0.88}>
      {/* Thumbnail Banner Header */}
      <View style={styles.thumbnailHeader}>
        <Image
          source={{ uri: (paper as any).thumbnail || FALLBACK_THUMBNAIL }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
        <View style={styles.thumbnailOverlay} />

        {/* Top-Left Paper Type Badge */}
        <View style={styles.topLeftBadge}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{paperTypeLabel.toUpperCase()}</Text>
          </View>
        </View>

        {/* Top-Right Unit Code Badge */}
        <View style={styles.topRightBadge}>
          <View style={styles.unitBadge}>
            <Text style={styles.unitBadgeText}>{paper.unitCode}</Text>
          </View>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        {/* Meta Header Line */}
        <Text style={styles.metaLine} numberOfLines={1}>
          MTID: {mtidText} • {paper.unitCode} • {paper.school?.toUpperCase()}
        </Text>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {paper.title}
        </Text>

        {/* Subtitle */}
        <Text style={styles.cardSub} numberOfLines={1}>
          {paper.unitName} • {paper.examYear}
        </Text>

        <View style={styles.cardDivider} />

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerDownloads}>
            <DownloadIcon color="#15803d" size={11} />
            <Text style={styles.footerDownloadsText}>{formatCompactNumber(downloadsCount)}</Text>
          </View>

          <View style={styles.footerRating}>
            <StarIcon color="#eab308" size={11} />
            <Text style={styles.footerRatingText}>{ratingScore}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  squareCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12
  },
  thumbnailHeader: {
    height: 96,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f1f5f9'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)'
  },
  topLeftBadge: {
    position: 'absolute',
    top: 6,
    left: 6
  },
  typeBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800'
  },
  topRightBadge: {
    position: 'absolute',
    top: 6,
    right: 6
  },
  unitBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  unitBadgeText: {
    color: '#0f172a',
    fontSize: 9.5,
    fontWeight: '800'
  },
  cardBody: {
    padding: 10
  },
  metaLine: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 16.5,
    marginBottom: 4
  },
  cardSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginBottom: 6
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerDownloads: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  footerDownloadsText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803d'
  },
  footerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  footerRatingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a'
  }
});
