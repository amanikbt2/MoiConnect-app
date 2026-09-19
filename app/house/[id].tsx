import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import {
  cacheHouseDetail,
  getCachedHouseDetail,
  enqueueOfflineBooking
} from '../../src/services/offlineStorage';
import { IHouse } from '@moi/shared';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { Skeleton } from '../../src/components/Skeleton';
import { Input } from '../../src/components/Input';

import { LocationIcon, CheckIcon, PhoneIcon, MessageIcon, ShieldCheckIcon } from '../../src/components/Icons';

export default function HouseDetailScreen({ route }: any) {
  const id = route?.params?.id;
  const [house, setHouse] = useState<IHouse | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [requestedMoveIn, setRequestedMoveIn] = useState('2026-10-01');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Contact / Chatting State
  const [contacting, setContacting] = useState(false);

  const { user } = useAuth();
  const router = useAppNavigation();

  useEffect(() => {
    if (id) fetchHouse();
  }, [id]);

  const fetchHouse = async () => {
    setLoading(true);
    const res = await apiRequest<{ data: IHouse }>(`/houses/${id}`);
    setLoading(false);
    if (res.success && res.data) {
      setHouse(res.data);
      cacheHouseDetail(res.data);
    } else {
      const cached = await getCachedHouseDetail(id);
      if (cached) {
        setHouse(cached);
      }
    }
  };

  const handleContactLandlord = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    if (!house) return;
    const landlord = typeof house.landlordId === 'object' ? (house.landlordId as any) : null;
    const landlordId = landlord ? landlord._id : house.landlordId;

    if (landlordId === user._id) {
      Alert.alert('Notice', 'This is your own rental listing.');
      return;
    }

    setContacting(true);
    const res = await apiRequest('/conversations/messages', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: landlordId,
        houseId: house._id,
        text: `Hi, I am interested in your property: "${house.title}". Is it available?`
      })
    });
    setContacting(false);

    if (res.success && res.data?.conversationId) {
      router.push(`/chat/${res.data.conversationId}`);
    } else {
      Alert.alert('Notice', 'You are currently offline. Visit when online to start a chat.');
    }
  };

  const handleBookingSubmit = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    if (!requestedMoveIn) {
      Alert.alert('Form Error', 'Please select or enter a requested move-in date.');
      return;
    }

    if (!house) return;

    setBookingSubmitting(true);
    const res = await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        houseId: house._id,
        requestedMoveIn,
        notes: bookingMessage
      })
    });
    setBookingSubmitting(false);

    if (res.success) {
      setShowBookingModal(false);
      Alert.alert(
        'Booking Request Submitted',
        'Your booking request has been sent to the landlord.\n\nDisclaimer: A booking request is not a guaranteed tenancy or proof of payment.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/profile') }]
      );
    } else {
      // Save offline booking queue
      await enqueueOfflineBooking({
        tempId: `offline_b_${Date.now()}`,
        houseId: house._id,
        requestedMoveIn,
        notes: bookingMessage,
        houseTitle: house.title,
        createdAt: new Date().toISOString()
      });
      setShowBookingModal(false);
      Alert.alert(
        'Booking Request Saved (Waiting for Internet)',
        'Booking request saved — waiting for internet connection. It will be sent automatically when connectivity returns.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/profile') }]
      );
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 20 }}>
        <Skeleton height={200} />
        <Skeleton height={30} width="70%" />
        <Skeleton height={20} width="40%" />
      </View>
    );
  }

  if (!house) {
    return (
      <View style={{ padding: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#64748b' }}>Rental house not found.</Text>
      </View>
    );
  }

  const landlord = typeof house.landlordId === 'object' ? (house.landlordId as any) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Photos Carousel / Main Image */}
      {house.photos && house.photos.length > 0 && (
        <View style={styles.imageBox}>
          <Image source={{ uri: house.photos[0] }} style={styles.image} resizeMode="cover" />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <Badge label={house.propertyType.replace('_', ' ')} variant="green" />
          <Badge label={house.occupancyStatus} variant={house.occupancyStatus === 'available' ? 'blue' : 'gray'} />
        </View>

        <Text style={styles.title}>{house.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <LocationIcon color="#64748b" size={16} />
          <Text style={styles.location}>{house.location}</Text>
        </View>

        {/* Rent & Deposit */}
        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>Monthly Rent</Text>
            <Text style={styles.priceVal}>KES {house.monthlyRent.toLocaleString()}</Text>
          </View>
          {house.deposit > 0 && (
            <View>
              <Text style={styles.priceLabel}>Deposit</Text>
              <Text style={styles.priceVal}>KES {house.deposit.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Amenities */}
        <Text style={styles.sectionHeader}>Amenities & Features</Text>
        <View style={styles.amenitiesGrid}>
          {house.amenities.map((am, idx) => (
            <View key={idx} style={styles.amenityChip}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <CheckIcon color="#15803d" size={14} />
                <Text style={styles.amenityText}>{am}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.sectionHeader}>Description</Text>
        <Text style={styles.description}>{house.description}</Text>

        {/* Landlord Info */}
        <View style={styles.landlordCard}>
          <Text style={styles.landlordHeader}>Landlord Contact Info</Text>
          <Text style={styles.landlordName}>{landlord?.name || 'Verified Landlord'}</Text>
          {landlord?.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <PhoneIcon color="#15803d" size={14} />
              <Text style={styles.landlordPhone}>Phone: {landlord.phone}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <Button
          title="Chat with Landlord"
          onPress={handleContactLandlord}
          loading={contacting}
          style={{ marginBottom: 10 }}
        />

        <Button
          title="Submit Booking Request"
          variant="secondary"
          onPress={() => setShowBookingModal(true)}
          disabled={house.occupancyStatus === 'occupied'}
        />

        {house.occupancyStatus === 'occupied' && (
          <Text style={styles.occupiedText}>This property is currently occupied.</Text>
        )}
      </View>

      {/* Booking Modal */}
      <Modal visible={showBookingModal} animationType="slide" onRequestClose={() => setShowBookingModal(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request House Booking</Text>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            Property: <Text style={{ fontWeight: '800', color: '#0f172a' }}>{house.title}</Text>
          </Text>

          <Input
            label="Requested Move-in Date *"
            placeholder="YYYY-MM-DD (e.g. 2026-10-01)"
            value={requestedMoveIn}
            onChangeText={setRequestedMoveIn}
          />

          <Input
            label="Message to Landlord (Optional)"
            placeholder="Add any specific questions or request a viewing schedule..."
            value={bookingMessage}
            onChangeText={setBookingMessage}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.disclaimerBox}>
            Notice: A booking request does not constitute a tenancy agreement or proof of payment. It alerts the landlord to your interest.
          </Text>

          <Button
            title="Confirm Booking Request"
            onPress={handleBookingSubmit}
            loading={bookingSubmitting}
            style={{ marginTop: 16 }}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flexGrow: 1
  },
  imageBox: {
    height: 240,
    width: '100%',
    backgroundColor: '#cbd5e1'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  body: {
    padding: 20
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  location: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 16
  },
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20
  },
  priceLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  amenityChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20
  },
  landlordCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  landlordHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  landlordName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  landlordPhone: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
    marginTop: 2
  },
  occupiedText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8
  },
  modalContent: {
    padding: 24,
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalSub: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16
  },
  closeBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626'
  },
  disclaimerBox: {
    fontSize: 12,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    lineHeight: 16,
    marginVertical: 12,
    fontWeight: '600'
  }
});
