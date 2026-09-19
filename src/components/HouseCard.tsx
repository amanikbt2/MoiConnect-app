import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IHouse } from '@moi/shared';
import { Badge } from './Badge';

interface HouseCardProps {
  house: IHouse;
  onPress: () => void;
}

export const HouseCard: React.FC<HouseCardProps> = ({ house, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{house.title}</Text>
        <Badge label={house.status} variant={house.status === 'available' ? 'success' : 'warning'} />
      </View>
      <Text style={styles.location}>📍 {house.locationName}</Text>
      <View style={styles.footer}>
        <Text style={styles.price}>KSh {house.pricePerMonth?.toLocaleString()}/mo</Text>
        <Text style={styles.type}>{house.propertyType.replace('_', ' ')}</Text>
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
    marginBottom: 4
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 8
  },
  location: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803d'
  },
  type: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'capitalize'
  }
});
