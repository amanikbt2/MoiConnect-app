import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList
} from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { getOfflineBookings, IQueuedBooking } from '../../src/services/offlineStorage';
import { IBooking, IFavorite } from '@moi/shared';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';

import { FileTextIcon, HouseIcon, ShieldCheckIcon } from '../../src/components/Icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'bookings' | 'saved'>('bookings');
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [offlineBookings, setOfflineBookings] = useState<IQueuedBooking[]>([]);
  const [favorites, setFavorites] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const router = useAppNavigation();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, activeSection]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      if (activeSection === 'bookings') {
        const res = await apiRequest<{ data: IBooking[] }>('/bookings');
        if (res.success && res.data) setBookings(res.data);
        const queued = await getOfflineBookings();
        setOfflineBookings(queued);
      } else {
        const res = await apiRequest('/favorites');
        if (res.success && res.data) setFavorites(res.data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await apiRequest(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' })
    });

    if (res.success) {
      Alert.alert('Booking Cancelled', 'Your booking request has been cancelled.');
      fetchUserData();
    } else {
      Alert.alert('Error', res.error || 'Failed to cancel booking.');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <EmptyState title="Not Signed In" message="Log in or create a student account to manage your profile and bookings." />
        <Button title="Sign In to MoiConnect" onPress={() => router.push('/(auth)/login')} style={{ marginHorizontal: 24, marginTop: 16 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.userCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{user.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadges}>
            {user.roles.map((r) => (
              <Badge key={r} label={r} variant="green" />
            ))}
          </View>
        </View>
      </View>

      {/* Landlord Account Status Card */}
      <View style={styles.landlordStatusCard}>
        <View style={styles.landlordHeader}>
          <Text style={styles.landlordTitle}>Landlord Account Status</Text>
          <Badge
            label={user.landlordStatus}
            variant={
              user.landlordStatus === 'approved'
                ? 'green'
                : user.landlordStatus === 'pending'
                ? 'gold'
                : 'gray'
            }
          />
        </View>

        {user.landlordStatus === 'none' && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => router.push('/(auth)/request-landlord')}
          >
            <Text style={styles.applyBtnText}>Apply for Landlord Verification →</Text>
          </TouchableOpacity>
        )}

        {user.landlordStatus === 'pending' && (
          <Text style={styles.statusInfoText}>
            Your landlord application is currently under review by administrators.
          </Text>
        )}

        {user.landlordStatus === 'approved' && (
          <Text style={styles.statusInfoText}>
            You are a verified landlord. You can publish property listings in the Rentals tab.
          </Text>
        )}
      </View>

      {/* Section Selector */}
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'bookings' && styles.sectionBtnActive]}
          onPress={() => setActiveSection('bookings')}
        >
          <Text style={[styles.sectionBtnText, activeSection === 'bookings' && styles.sectionBtnTextActive]}>
            My Bookings ({bookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'saved' && styles.sectionBtnActive]}
          onPress={() => setActiveSection('saved')}
        >
          <Text style={[styles.sectionBtnText, activeSection === 'saved' && styles.sectionBtnTextActive]}>
            Saved Bookmarks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings Section */}
      {activeSection === 'bookings' ? (
        (bookings.length === 0 && offlineBookings.length === 0) ? (
          <EmptyState title="No Booking Requests" message="You have not requested any house bookings." />
        ) : (
          <>
            {offlineBookings.map((ob) => (
              <View key={ob.tempId} style={[styles.bookingCard, { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }]}>
                <View style={styles.bookingHeader}>
                  <Badge label="Saved Offline (Waiting for Internet)" variant="gold" />
                  <Text style={styles.bookingDate}>Move-in: {ob.requestedMoveIn}</Text>
                </View>
                <Text style={styles.houseTitle}>{ob.houseTitle || 'House Rental Listing'}</Text>
                <Text style={[styles.disclaimerText, { color: '#b45309' }]}>
                  Booking request saved — waiting for internet connection. Will auto-send when connected.
                </Text>
              </View>
            ))}

            {bookings.map((booking) => {
            const house = typeof booking.houseId === 'object' ? (booking.houseId as any) : null;
            return (
              <View key={booking._id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Badge
                    label={booking.status}
                    variant={
                      booking.status === 'accepted'
                        ? 'green'
                        : booking.status === 'pending'
                        ? 'gold'
                        : 'red'
                    }
                  />
                  <Text style={styles.bookingDate}>Move-in: {booking.requestedMoveIn}</Text>
                </View>

                {house && (
                  <Text style={styles.houseTitle}>{house.title}</Text>
                )}

                <Text style={styles.disclaimerText}>
                  Notice: A booking request is not a guaranteed tenancy or proof of payment.
                </Text>

                {booking.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelBooking(booking._id)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          </>
        )
      ) : (
        /* Saved Favorites Section */
        <View style={styles.savedContainer}>
          <Text style={styles.savedHeader}>Saved Past Papers ({favorites?.papers?.length || 0})</Text>
          {favorites?.papers?.map((p: any) => (
            <TouchableOpacity key={p._id} onPress={() => router.push(`/paper/${p._id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 }}>
                <FileTextIcon color="#15803d" size={16} />
                <Text style={styles.savedItemText}>{p.title} ({p.unitCode})</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={[styles.savedHeader, { marginTop: 16 }]}>Saved House Listings ({favorites?.houses?.length || 0})</Text>
          {favorites?.houses?.map((h: any) => (
            <TouchableOpacity key={h._id} onPress={() => router.push(`/house/${h._id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 }}>
                <HouseIcon color="#15803d" size={16} />
                <Text style={styles.savedItemText}>{h.title} - KES {h.monthlyRent}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Privacy Policy & Legal Info */}
      <TouchableOpacity
        style={styles.privacyCard}
        onPress={() => router.push('/privacy')}
        activeOpacity={0.8}
      >
        <View style={styles.privacyHeader}>
          <ShieldCheckIcon color="#15803d" size={20} />
          <Text style={styles.privacyTitle}>Privacy Policy & Data Security</Text>
        </View>
        <Text style={styles.privacySub}>View how your data is protected • Contact: amanikbt1@gmail.com →</Text>
      </TouchableOpacity>

      {/* Logout */}
      <Button
        title="Sign Out"
        variant="danger"
        onPress={() => logout()}
        style={{ marginTop: 16 }}
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
    padding: 16
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6
  },
  roleBadges: {
    flexDirection: 'row'
  },
  landlordStatusCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  landlordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  landlordTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  applyBtn: {
    marginTop: 8,
    paddingVertical: 8
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d'
  },
  statusInfoText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  sectionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  sectionBtnActive: {
    borderBottomColor: '#15803d'
  },
  sectionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  sectionBtnTextActive: {
    color: '#15803d'
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  bookingDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  houseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6
  },
  disclaimerText: {
    fontSize: 11,
    color: '#ca8a04',
    marginVertical: 6,
    fontWeight: '500'
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8
  },
  cancelBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 12
  },
  savedContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  savedHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  savedItemText: {
    fontSize: 13,
    color: '#334155',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  privacyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4'
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d'
  },
  privacySub: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 16
  }
});
