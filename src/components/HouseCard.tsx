import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { IHouse } from '@moi/shared';
import { Badge } from './Badge';
import { LocationIcon, ChevronRightIcon } from './Icons';

interface HouseCardProps {
  house: IHouse;
  onPress: () => void;
}

const DEFAULT_HOSTEL_IMAGES: Record<string, string> = {
  bedsetter: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  single_room: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
  one_bedroom: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
  two_bedroom: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
  apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  own_compound: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
};

export const HouseCard: React.FC<HouseCardProps> = ({ house, onPress }) => {
  const imageUrl =
    house.photos && house.photos.length > 0 && house.photos[0]
      ? house.photos[0]
      : DEFAULT_HOSTEL_IMAGES[house.propertyType] || DEFAULT_HOSTEL_IMAGES.bedsetter;

  const rentAmount = house.pricePerMonth || house.monthlyRent || 0;
  const formattedPrice = rentAmount > 0 ? `KSh ${rentAmount.toLocaleString()}/mo` : 'Price on request';

  const typeLabel =
    house.propertyType === 'bedsetter'
      ? 'Bedsitter'
      : house.propertyType === 'single_room'
      ? 'Single Room'
      : house.propertyType === 'one_bedroom'
      ? '1 Bedroom'
      : house.propertyType === 'two_bedroom'
      ? '2 Bedroom'
      : house.propertyType
      ? house.propertyType.replace('_', ' ')
      : 'Rental';

  const locationText = house.locationName || house.location || 'Near Campus';

  const availRooms = house.availableRooms !== undefined
    ? house.availableRooms
    : (house.status === 'available' || house.occupancyStatus === 'available' ? 1 : 0);

  const isFullyBooked = availRooms === 0;
  const statusLabel = isFullyBooked
    ? '🔴 Fully Booked'
    : `🟢 ${availRooms} Vacant Room${availRooms > 1 ? 's' : ''}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* House Image Thumbnail with Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.imageOverlay} />

        {/* Top Badges */}
        <View style={styles.topBadgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
          <View style={[
            styles.availabilityBadge,
            isFullyBooked ? styles.badgeFull : styles.badgeVacant
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: isFullyBooked ? '#ef4444' : '#22c55e'
              }} />
              <Text style={[
                styles.availabilityBadgeText,
                isFullyBooked ? styles.badgeTextFull : styles.badgeTextVacant
              ]}>
                {isFullyBooked ? 'Fully Booked' : `${availRooms} Vacant Room${availRooms > 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Price Tag Overlay at Bottom Left of Image */}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{formattedPrice}</Text>
        </View>
      </View>

      {/* Card Content Body */}
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>{house.title}</Text>

        <View style={styles.locationRow}>
          <LocationIcon color="#15803d" size={14} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationText}
          </Text>
        </View>

        {/* Amenities Pills */}
        {house.amenities && house.amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {house.amenities.slice(0, 3).map((amenity, idx) => (
              <View key={idx} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer Link Row */}
        <View style={styles.footerRow}>
          <Text style={styles.viewDetailsText}>View details & contact</Text>
          <View style={styles.arrowCircle}>
            <ChevronRightIcon color="#15803d" size={14} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a'
  },
  thumbnail: {
    width: '100%',
    height: '100%'
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.15)'
  },
  topBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  typeBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  badgeVacant: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  badgeFull: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  availabilityBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  badgeTextVacant: {
    color: '#15803d'
  },
  badgeTextFull: {
    color: '#ef4444'
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  priceText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  },
  cardContent: {
    padding: 14
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d'
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  amenityChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d'
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
