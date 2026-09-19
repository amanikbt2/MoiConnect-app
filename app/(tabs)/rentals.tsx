import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { cacheRentals, getCachedRentals } from '../../src/services/offlineStorage';
import { IHouse, PROPERTY_TYPES, MOI_LOCATIONS, RENTAL_AMENITIES } from '@moi/shared';
import { HouseCard } from '../../src/components/HouseCard';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';

import { LocationIcon, PlusIcon } from '../../src/components/Icons';

const LOCATIONS_LIST = ['All Locations', 'Stage', 'Mabs', 'Viewland', 'Kesses', 'Talai', 'Annex'];

const MOCK_RENTAL_HOUSES: IHouse[] = [
  {
    _id: 'rental_1',
    landlordId: 'landlord_1',
    title: 'Sunrise Haven Bedsitters',
    description: 'Modern spacious bedsitter with fitted kitchen, high speed fiber Wi-Fi, and 24/7 borehole water supply.',
    propertyType: 'bedsetter',
    location: 'Stage',
    locationName: '📍 Stage (2 min to Main Gate)',
    monthlyRent: 4500,
    pricePerMonth: 4500,
    deposit: 4500,
    amenities: ['📶 Fiber WiFi', '💧 Water 24/7', '🔒 Security Guard', '⚡ Tokens'],
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'],
    status: 'available',
    occupancyStatus: 'available',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'rental_2',
    landlordId: 'landlord_2',
    title: 'Mabs View Heights Single Rooms',
    description: 'Affordable single rooms located right at Mabs stage. Quiet study environment for students.',
    propertyType: 'single_room',
    location: 'Mabs',
    locationName: '📍 Mabs (Near Shopping Center)',
    monthlyRent: 3500,
    pricePerMonth: 3500,
    deposit: 3500,
    amenities: ['💧 Water 24/7', '🔒 Gate Locked 10PM', '⚡ Tokens'],
    photos: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80'],
    status: 'available',
    occupancyStatus: 'available',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'rental_3',
    landlordId: 'landlord_3',
    title: 'Kesses Executive Bedsitters',
    description: 'Executive tiled bedsitters with hot instant shower, private balcony, and high security.',
    propertyType: 'bedsetter',
    location: 'Kesses',
    locationName: '📍 Kesses (Opposite Stage)',
    monthlyRent: 5000,
    pricePerMonth: 5000,
    deposit: 5000,
    amenities: ['📶 High Speed WiFi', '🚿 Instant Shower', '💧 Water 24/7', '🔒 CCTV Camera'],
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80'],
    status: 'available',
    occupancyStatus: 'available',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'rental_4',
    landlordId: 'landlord_4',
    title: 'Viewland Park 1-Bedroom Apartments',
    description: 'Spacious 1 bedroom apartment with sitting room, separate kitchen, and balcony view of campus.',
    propertyType: 'one_bedroom',
    location: 'Viewland',
    locationName: '📍 Viewland (View Stage)',
    monthlyRent: 7500,
    pricePerMonth: 7500,
    deposit: 7500,
    amenities: ['📶 WiFi Included', '🛋️ Living Room', '💧 Water 24/7', '🔒 Security Guard'],
    photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'],
    status: 'available',
    occupancyStatus: 'available',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'rental_5',
    landlordId: 'landlord_5',
    title: 'Stage Oasis Student Bedsitters',
    description: 'Neat student bedsitters 1 minute walk from Stage. Clean environment and reliable water.',
    propertyType: 'bedsetter',
    location: 'Stage',
    locationName: '📍 Stage (Near Bodaboda Stage)',
    monthlyRent: 4200,
    pricePerMonth: 4200,
    deposit: 4200,
    amenities: ['📶 Free WiFi', '💧 Water Included', '🔒 Night Guard'],
    photos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'],
    status: 'available',
    occupancyStatus: 'available',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'rental_6',
    landlordId: 'landlord_6',
    title: 'Talai Ridge Single Rooms',
    description: 'Very affordable single rooms in Talai. Perfect for students looking for budget-friendly housing.',
    propertyType: 'single_room',
    location: 'Talai',
    locationName: '📍 Talai (5 min walk to Campus)',
    monthlyRent: 3000,
    pricePerMonth: 3000,
    deposit: 3000,
    amenities: ['💧 Borehole Water', '⚡ Prepaid Tokens'],
    photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'],
    status: 'available',
    occupancyStatus: 'available',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function RentalsScreen() {
  const [activeTab, setActiveTab] = useState<'browse' | 'my_listings'>('browse');
  const [houses, setHouses] = useState<IHouse[]>([]);
  const [myListings, setMyListings] = useState<IHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [maxRent, setMaxRent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Listing Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<any>('bedsetter');
  const [location, setLocation] = useState<any>(MOI_LOCATIONS[0]);
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['WiFi', 'Water 24/7']);
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const router = useAppNavigation();

  const isLandlord = user?.roles.includes('landlord') && user?.landlordStatus === 'approved';

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchHouses();
    } else {
      fetchMyListings();
    }
  }, [activeTab, selectedType, selectedLocation]);

  const filterMockData = () => {
    return MOCK_RENTAL_HOUSES.filter((h) => {
      // Filter location
      if (selectedLocation && selectedLocation !== 'All Locations') {
        const locLower = selectedLocation.toLowerCase();
        const houseLoc = (h.location || h.locationName || '').toLowerCase();
        if (!houseLoc.includes(locLower)) return false;
      }
      // Filter room type
      if (selectedType) {
        if (h.propertyType !== selectedType) return false;
      }
      // Filter search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = h.title.toLowerCase().includes(q);
        const locMatch = (h.locationName || h.location || '').toLowerCase().includes(q);
        const typeMatch = h.propertyType.toLowerCase().includes(q);
        if (!titleMatch && !locMatch && !typeMatch) return false;
      }
      return true;
    });
  };

  const fetchHouses = async () => {
    setLoading(true);
    let url = `/houses?limit=30`;
    if (selectedType) url += `&propertyType=${selectedType}`;
    if (selectedLocation && selectedLocation !== 'All Locations') url += `&location=${encodeURIComponent(selectedLocation)}`;
    if (maxRent) url += `&maxRent=${maxRent}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const res = await apiRequest<{ data: IHouse[] }>(url);
    setLoading(false);
    setRefreshing(false);

    if (res.success && res.data && res.data.length > 0) {
      setHouses(res.data);
      cacheRentals(res.data);
    } else {
      // Use local mock data filtered by user selection
      setHouses(filterMockData());
    }
  };

  const fetchMyListings = async () => {
    if (!user) return;
    setLoading(true);
    const res = await apiRequest<{ data: IHouse[] }>('/houses/my-listings');
    setLoading(false);
    setRefreshing(false);
    if (res.success && res.data) {
      setMyListings(res.data);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleCreateListing = async () => {
    if (!title || !description || !monthlyRent || !photoUrl) {
      Alert.alert('Incomplete Form', 'Please provide a title, description, monthly rent, and photo URL.');
      return;
    }

    setSubmitting(true);
    const res = await apiRequest('/houses', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        propertyType,
        location,
        monthlyRent: parseInt(monthlyRent, 10),
        deposit: deposit ? parseInt(deposit, 10) : 0,
        amenities: selectedAmenities,
        photos: [photoUrl]
      })
    });
    setSubmitting(false);

    if (res.success) {
      Alert.alert(
        'Listing Created',
        'Your rental listing has been submitted for administrator review.',
        [{ text: 'OK', onPress: () => {
          setShowCreateModal(false);
          setActiveTab('my_listings');
          fetchMyListings();
        }}]
      );
    } else {
      Alert.alert('Submission Failed', res.error || 'Failed to create listing.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'browse' && styles.tabBtnActive]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'browse' && styles.tabBtnTextActive]}>
            Available Houses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my_listings' && styles.tabBtnActive]}
          onPress={() => {
            if (!user) {
              router.push('/(auth)/login');
            } else if (!isLandlord) {
              router.push('/(auth)/request-landlord');
            } else {
              setActiveTab('my_listings');
            }
          }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'my_listings' && styles.tabBtnTextActive]}>
            Landlord Portal {isLandlord ? '(Verified)' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'browse' ? (
        <FlatList
          data={houses}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHouses(); }} colors={['#15803d']} />
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 14 }}>
              {/* Search Bar */}
              <View style={styles.searchRow}>
                <TextInput
                  placeholder="Search Stage, Mabs, Kesses, Bedsitter..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={fetchHouses}
                  style={styles.searchInput}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={fetchHouses}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>

              {/* Location Filter Chips */}
              <Text style={styles.filterSectionTitle}>📍 Filter by Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {LOCATIONS_LIST.map((loc) => {
                  const isActive = selectedLocation === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={[styles.locationPill, isActive && styles.locationPillActive]}
                      onPress={() => setSelectedLocation(loc)}
                    >
                      <Text style={[styles.locationPillText, isActive && styles.locationPillTextActive]}>
                        {loc === 'All Locations' ? '🌐 All Locations' : `📍 ${loc}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Property Type Pills */}
              <Text style={styles.filterSectionTitle}>🏠 Room Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                <TouchableOpacity
                  style={[styles.pill, selectedType === '' && styles.pillActive]}
                  onPress={() => setSelectedType('')}
                >
                  <Text style={[styles.pillText, selectedType === '' && styles.pillTextActive]}>All Types</Text>
                </TouchableOpacity>
                {PROPERTY_TYPES.map((pt) => {
                  const label =
                    pt === 'bedsetter'
                      ? 'Bedsitter'
                      : pt === 'single_room'
                      ? 'Single Room'
                      : pt === 'one_bedroom'
                      ? '1 Bedroom'
                      : pt.replace('_', ' ');
                  return (
                    <TouchableOpacity
                      key={pt}
                      style={[styles.pill, selectedType === pt && styles.pillActive]}
                      onPress={() => setSelectedType(selectedType === pt ? '' : pt)}
                    >
                      <Text style={[styles.pillText, selectedType === pt && styles.pillTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Landlord Action Banner */}
              {isLandlord && (
                <TouchableOpacity style={styles.landlordBanner} onPress={() => setShowCreateModal(true)}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <PlusIcon color="#ffffff" size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.landlordBannerTitle}>Create New House Listing</Text>
                    <Text style={styles.landlordBannerSub}>Post single rooms, bedsitters or apartments near campus</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <HouseCard house={item} onPress={() => router.push(`/house/${item._id}`)} />
          )}
          ListEmptyComponent={
            loading ? (
              <View style={{ gap: 10, marginTop: 12 }}>
                <Skeleton height={180} />
                <Skeleton height={180} />
              </View>
            ) : (
              <EmptyState
                title="No Rental Listings Found"
                message="Try clearing location or rent filters to explore available houses around Moi University."
              />
            )
          }
        />
      ) : (
        <FlatList
          data={myListings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyListings(); }} colors={['#15803d']} />
          }
          ListHeaderComponent={
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.createBtnText}>+ Add New House Listing</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <View style={styles.myListingCard}>
              <View style={styles.myListingHeader}>
                <Badge
                  label={item.status}
                  variant={item.status === 'approved' ? 'green' : item.status === 'pending' ? 'gold' : 'red'}
                />
                <Badge
                  label={item.occupancyStatus}
                  variant={item.occupancyStatus === 'available' ? 'blue' : 'gray'}
                />
              </View>
              <Text style={styles.myListingTitle}>{item.title}</Text>
              <Text style={styles.myListingPrice}>KES {item.monthlyRent.toLocaleString()} / month</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <LocationIcon color="#64748b" size={14} />
                <Text style={styles.myListingLoc}>{item.location}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            loading ? (
              <Skeleton height={120} />
            ) : (
              <EmptyState
                title="No Property Listings"
                message="You have not published any rental listings yet. Tap 'Add New House Listing' above to publish."
              />
            )
          }
        />
      )}

      {/* Create Listing Modal */}
      <Modal visible={showCreateModal} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Publish House Listing</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          <Input label="Listing Title *" placeholder="Modern Tiled Bedsitter near Stage" value={title} onChangeText={setTitle} />
          <Input label="Description *" placeholder="24/7 water, secure gate, separate washroom..." value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          <Input label="Monthly Rent (KES Integer) *" placeholder="4500" value={monthlyRent} onChangeText={setMonthlyRent} keyboardType="numeric" />
          <Input label="Deposit (KES)" placeholder="4500" value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
          <Input label="Photo Image URL *" placeholder="https://res.cloudinary.com/.../house.jpg" value={photoUrl} onChangeText={setPhotoUrl} />

          <Text style={styles.amenitiesHeader}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {RENTAL_AMENITIES.map((am) => {
              const selected = selectedAmenities.includes(am);
              return (
                <TouchableOpacity
                  key={am}
                  style={[styles.amenityChip, selected && styles.amenityChipSelected]}
                  onPress={() => toggleAmenity(am)}
                >
                  <Text style={[styles.amenityChipText, selected && styles.amenityChipTextSelected]}>
                    {selected ? '• ' : ''}{am}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button title="Submit Listing for Approval" onPress={handleCreateListing} loading={submitting} style={{ marginTop: 20 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabBtnActive: {
    borderBottomColor: '#15803d'
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#15803d'
  },
  listContent: {
    padding: 16
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  searchBtn: {
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4
  },
  locationPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4
  },
  locationPillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  locationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  locationPillTextActive: {
    color: '#ffffff'
  },
  pillScroll: {
    flexDirection: 'row',
    marginBottom: 12
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8
  },
  pillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'capitalize'
  },
  pillTextActive: {
    color: '#ffffff'
  },
  landlordBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16
  },
  landlordBannerIcon: {
    fontSize: 24,
    marginRight: 12
  },
  landlordBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534'
  },
  landlordBannerSub: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2
  },
  createBtn: {
    backgroundColor: '#15803d',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14
  },
  myListingCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  myListingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  myListingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  myListingPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4
  },
  myListingLoc: {
    fontSize: 12,
    color: '#64748b'
  },
  modalContent: {
    padding: 24,
    backgroundColor: '#ffffff',
    flexGrow: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  closeBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626'
  },
  amenitiesHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  amenityChipSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#15803d'
  },
  amenityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  amenityChipTextSelected: {
    color: '#15803d',
    fontWeight: '700'
  }
});
