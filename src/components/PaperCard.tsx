import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IPaper } from '@moi/shared';
import { Badge } from './Badge';
import { formatCompactNumber } from '../utils/formatters';

interface PaperCardProps {
  paper: IPaper;
  onPress: () => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.unitCode}>{paper.unitCode}</Text>
        <Badge label={paper.type.replace('_', ' ')} variant="success" />
      </View>
      <Text style={styles.title} numberOfLines={2}>{paper.title}</Text>
      <Text style={styles.sub}>{paper.unitName} • {paper.examYear}</Text>
      <View style={styles.footer}>
        <Text style={styles.school}>{paper.school}</Text>
        <Text style={styles.downloads}>⬇ {formatCompactNumber(paper.downloadCount)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  unitCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  sub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8
  },
  school: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8'
  },
  downloads: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  }
});
