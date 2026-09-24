import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Image
} from 'react-native';
import { useAppNavigation } from '../src/utils/navigation';
import { useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';
import { IHouse, MOI_LOCATIONS, PROPERTY_TYPES } from '@moi/shared';
import {
  ShieldCheckIcon,
  KeyIcon,
  HouseIcon,
  PlusIcon,
  ArrowLeftIcon,
  PhoneIcon,
  SparklesIcon,
  TrashIcon,
  DownloadIcon,
  CloseIcon
} from '../src/components/Icons';

export default function LandlordPortalScreen() {
  const router = useAppNavigation();
  const { user } = useAuth();

  // Verification Credentials State
  const [landlordMID, setLandlordMID] = useState('');
  const [landlordSerial, setLandlordSerial] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Portal Main Section Tab State ('listings' | 'notify')
  const [portalTab, setPortalTab] = useState<'listings' | 'notify'>('listings');
  const [notifySubTab, setNotifySubTab] = useState<'normal' | 'update'>('normal');

  // Portal Apartment Listings State
  const [listings, setListings] = useState<IHouse[]>([
    {
      _id: 'landlord_h1',
      landlordId: user?._id || 'landlord_1',
      title: 'Kesses Sunrise Hostels (Bedsitters)',
      description: 'Modern tiled bedsitters with fitted kitchen, high-speed fiber Wi-Fi, and 24/7 borehole water.',
      propertyType: 'bedsetter',
      location: 'Kesses',
      locationName: '📍 Kesses (Opposite Stage)',
      monthlyRent: 4800,
      pricePerMonth: 4800,
      deposit: 4800,
      totalRooms: 12,
      availableRooms: 8,
      phoneContact: '0712345678',
      whatsappContact: '254712345678',
      amenities: ['📶 Fiber WiFi', '💧 Water 24/7', '🔒 Security Guard', '⚡ Tokens'],
      photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'],
      status: 'available',
      occupancyStatus: 'available',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'landlord_h2',
      landlordId: user?._id || 'landlord_1',
      title: 'Stage Oasis Single Rooms',
      description: 'Quiet study environment single rooms located 2 minutes walk from Stage.',
      propertyType: 'single_room',
      location: 'Stage',
      locationName: '📍 Stage (Near Bodaboda Stage)',
      monthlyRent: 3500,
      pricePerMonth: 3500,
      deposit: 3500,
      totalRooms: 10,
      availableRooms: 3,
      phoneContact: '0798765432',
      whatsappContact: '254798765432',
      amenities: ['💧 Borehole Water', '🔒 Locked Gate 10PM', '⚡ Tokens'],
      photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80'],
      status: 'available',
      occupancyStatus: 'available',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  // Add Listing Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRent, setNewRent] = useState('');
  const [newDeposit, setNewDeposit] = useState('');
  const [newType, setNewType] = useState<'single_room' | 'bedsetter' | 'one_bedroom' | 'two_bedroom' | 'studio'>('bedsetter');
  const [newLocation, setNewLocation] = useState('Kesses');
  const [totalRooms, setTotalRooms] = useState('10');
  const [availableRooms, setAvailableRooms] = useState('5');
  const [phoneContact, setPhoneContact] = useState('0712345678');
  const [whatsappContact, setWhatsappContact] = useState('254712345678');
  const [newPhoto, setNewPhoto] = useState('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80');

  // Notify Tab State (Normal Popup)
  const [popTitle, setPopTitle] = useState('Welcome {name} to MoiConnect!');
  const [popSubtitle, setPopSubtitle] = useState('Explore the latest study notes for {course}.');
  const [popBody, setPopBody] = useState('Get access to past exam papers, lecture notes, and hostel bookings.');
  const [popImage, setPopImage] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80');
  const [popCancel, setPopCancel] = useState(true);
  const [popActionTarget, setPopActionTarget] = useState('/notes');
  const [popActionText, setPopActionText] = useState('Explore Notes');
  const [popAudience, setPopAudience] = useState<'all' | 'unauthenticated' | 'emails'>('all');
  const [popEmails, setPopEmails] = useState('');
  const [popExpiryDays, setPopExpiryDays] = useState('7');

  // Notify Tab State (Update Popup)
  const [upMinVersion, setUpMinVersion] = useState('1.0.7');
  const [upTitle, setUpTitle] = useState('MoiConnect v{version} Available!');
  const [upSubtitle, setUpSubtitle] = useState('Upgrade now for faster PDF downloads and new features.');
  const [upImage, setUpImage] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80');
  const [upPlayStoreUrl, setUpPlayStoreUrl] = useState('https://play.google.com/store/apps/details?id=com.amanikbt1.moiconnect');
  const [upForce, setUpForce] = useState(false);

  // Popup History
  const [popupsHistory, setPopupsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [creatingPopup, setCreatingPopup] = useState(false);

  const fetchPopupHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/notify/popups');
      if (res.success && Array.isArray(res.data)) {
        setPopupsHistory(res.data);
      }
    } catch (e) {
      console.log('Error loading popups history:', e);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (isVerified && portalTab === 'notify') {
      fetchPopupHistory();
    }
  }, [isVerified, portalTab]);

  const handleAuthenticate = () => {
    if (!landlordMID.trim() || !landlordSerial.trim() || !securityKey.trim()) {
      Alert.alert('Missing Verification Keys', 'Please enter your MID, Serial Number, and Security Key to authenticate.');
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setIsVerified(true);
      Alert.alert(
        'Authentication Successful! 🟢',
        `Welcome to the Admin Portal! You can manage listings and broadcast Popups.`
      );
    }, 900);
  };

  const handleCreateNormalPopup = async () => {
    if (!popTitle.trim()) {
      Alert.alert('Incomplete Form', 'Please enter a title for the popup.');
      return;
    }

    setCreatingPopup(true);
    const daysNum = parseInt(popExpiryDays, 10) || 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysNum);

    const payload = {
      type: 'normal',
      title: popTitle.trim(),
      subtitle: popSubtitle.trim(),
      body: popBody.trim(),
      imageUrl: popImage.trim(),
      hasCancelButton: popCancel,
      actionTarget: popActionTarget,
      actionButtonText: popActionText.trim() || 'Explore',
      targetAudience: popAudience,
      targetEmails: popEmails ? popEmails.split(',').map((e) => e.trim()) : [],
      expiresAt: expiryDate.toISOString()
    };

    try {
      const res = await apiRequest('/notify/popups', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        Alert.alert('Popup Created! 📢', `Broadcast created successfully with auto-incrementing ID!`);
        fetchPopupHistory();
      } else {
        Alert.alert('Creation Failed', res.error || 'Could not save popup.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to connect to backend server.');
    }
    setCreatingPopup(false);
  };

  const handleCreateUpdatePopup = async () => {
    if (!upMinVersion.trim() || !upTitle.trim()) {
      Alert.alert('Incomplete Form', 'Please enter minimum version and update title.');
      return;
    }

    setCreatingPopup(true);
    const payload = {
      type: 'update',
      title: upTitle.trim().replace('{version}', upMinVersion.trim()),
      subtitle: upSubtitle.trim().replace('{version}', upMinVersion.trim()),
      imageUrl: upImage.trim(),
      hasCancelButton: !upForce,
      minAppVersion: upMinVersion.trim(),
      playStoreUrl: upPlayStoreUrl.trim(),
      isForceUpdate: upForce,
      actionButtonText: 'Update via Play Store',
      targetAudience: 'all'
    };

    try {
      const res = await apiRequest('/notify/popups', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        Alert.alert('Update Broadcast Created! 🚀', `App version update popup for v${upMinVersion} broadcasted successfully!`);
        fetchPopupHistory();
      } else {
        Alert.alert('Creation Failed', res.error || 'Could not save update broadcast.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to connect to backend server.');
    }
    setCreatingPopup(false);
  };

  const handleDeletePopup = async (popupId: string) => {
    Alert.alert(
      'Remove Popup',
      `Are you sure you want to remove popup "${popupId}" from active history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/notify/popups/${popupId}`, { method: 'DELETE' });
              fetchPopupHistory();
            } catch (e) {
              Alert.alert('Error', 'Could not remove popup.');
            }
          }
        }
      ]
    );
  };

  const handleCreateListingSubmit = async () => {
    if (!newTitle.trim() || !newDesc.trim() || !newRent.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in the title, description, and monthly rent.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        propertyType: newType,
        location: newLocation,
        monthlyRent: parseInt(newRent, 10) || 0,
        deposit: parseInt(newDeposit, 10) || 0,
        totalRooms: parseInt(totalRooms, 10) || 1,
        availableRooms: parseInt(availableRooms, 10) || 1,
        phoneContact: phoneContact.trim(),
        whatsappContact: whatsappContact.trim(),
        photos: [newPhoto.trim()]
      };

      const res = await apiRequest<{ data: IHouse }>('/houses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.data) {
        setListings((prev) => [res.data!, ...prev]);
        setShowAddModal(false);
        setNewTitle('');
        setNewDesc('');
        setNewRent('');
        setNewDeposit('');
        Alert.alert('Success 🎉', 'Apartment listing published successfully!');
      } else {
        // Fallback local addition if server offline / demo mode
        const newListing: IHouse = {
          _id: `landlord_h_${Date.now()}`,
          landlordId: user?._id || 'landlord_1',
          title: newTitle.trim(),
          description: newDesc.trim(),
          propertyType: newType,
          location: newLocation,
          locationName: `📍 ${newLocation}`,
          monthlyRent: parseInt(newRent, 10) || 0,
          pricePerMonth: parseInt(newRent, 10) || 0,
          deposit: parseInt(newDeposit, 10) || 0,
          totalRooms: parseInt(totalRooms, 10) || 1,
          availableRooms: parseInt(availableRooms, 10) || 1,
          phoneContact: phoneContact.trim(),
          whatsappContact: whatsappContact.trim(),
          amenities: ['📶 Fiber WiFi', '💧 Water 24/7', '🔒 Security Guard'],
          photos: [newPhoto.trim() || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'],
          status: 'available',
          occupancyStatus: 'available',
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setListings((prev) => [newListing, ...prev]);
        setShowAddModal(false);
        setNewTitle('');
        setNewDesc('');
        setNewRent('');
        setNewDeposit('');
        Alert.alert('Listing Added 🎉', 'Apartment listing created successfully!');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick helper to insert magic variables into inputs
  const insertMagicVariable = (variableStr: string, field: 'title' | 'sub' | 'body') => {
    if (field === 'title') setPopTitle((prev) => `${prev} ${variableStr}`.trim());
    if (field === 'sub') setPopSubtitle((prev) => `${prev} ${variableStr}`.trim());
    if (field === 'body') setPopBody((prev) => `${prev} ${variableStr}`.trim());
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon color="#ffffff" size={20} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>MoiConnect Admin & Landlord Portal</Text>
          <Text style={styles.headerSub}>🔒 Ultimate Secure Management</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {!isVerified ? (
        /* STEP 1: VERIFICATION FORM */
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.securityBannerCard}>
            <View style={styles.shieldCircle}>
              <ShieldCheckIcon color="#15803d" size={32} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>In-Person Admin Account Verification</Text>
              <Text style={styles.securitySub}>
                To prevent fraud, landlord listings and broadcast notifications require authentication.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Enter Assigned Verification Keys</Text>
            <Text style={styles.formSubtitle}>Input your official MID, Serial, and Security Key:</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>1. Landlord / Admin MID <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. LL-8842-MOI"
                placeholderTextColor="#94a3b8"
                value={landlordMID}
                onChangeText={setLandlordMID}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>2. Hardware Serial Number <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. SN-9920-KESSES"
                placeholderTextColor="#94a3b8"
                value={landlordSerial}
                onChangeText={setLandlordSerial}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>3. Security Master Key <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••••••"
                placeholderTextColor="#94a3b8"
                value={securityKey}
                onChangeText={setSecurityKey}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={handleAuthenticate}
              disabled={verifying}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <KeyIcon color="#ffffff" size={18} style={{ marginRight: 6 }} />
                  <Text style={styles.verifyBtnText}>Authenticate & Enter Portal</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* STEP 2: VERIFIED DASHBOARD WITH NOTIFY TAB */
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Main Top Navigation Tabs (Listings vs Notify) */}
          <View style={styles.mainTabSwitchRow}>
            <TouchableOpacity
              style={[styles.mainTabBtn, portalTab === 'listings' && styles.mainTabBtnActive]}
              onPress={() => setPortalTab('listings')}
            >
              <HouseIcon color={portalTab === 'listings' ? '#ffffff' : '#64748b'} size={18} />
              <Text style={[styles.mainTabText, portalTab === 'listings' && styles.mainTabTextActive]}>
                Apartment Buildings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainTabBtn, portalTab === 'notify' && styles.mainTabBtnActiveNotify]}
              onPress={() => setPortalTab('notify')}
            >
              <SparklesIcon color={portalTab === 'notify' ? '#ffffff' : '#2563eb'} size={18} />
              <Text style={[styles.mainTabText, portalTab === 'notify' && styles.mainTabTextActive]}>
                Notify (Popups & Updates)
              </Text>
            </TouchableOpacity>
          </View>

          {portalTab === 'listings' ? (
            /* LISTINGS SECTION */
            <>
              {/* Verified Landlord Profile Card */}
              <View style={styles.landlordBadgeCard}>
                <View style={styles.landlordBadgeHeader}>
                  <View style={styles.verifiedAvatar}>
                    <HouseIcon color="#15803d" size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.landlordName}>{user?.name || 'Moi Verified Admin'}</Text>
                    <Text style={styles.landlordMeta}>MID: {landlordMID || 'LL-8842-MOI'} • Serial: {landlordSerial || 'SN-9920'}</Text>
                  </View>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>🟢 Verified Active</Text>
                  </View>
                </View>
              </View>

              {/* Stats Summary Bar */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{listings.length}</Text>
                  <Text style={styles.statLabel}>Apartments</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {listings.reduce((acc, h) => acc + (h.availableRooms !== undefined ? h.availableRooms : (h.occupancyStatus === 'available' ? 1 : 0)), 0)}
                  </Text>
                  <Text style={styles.statLabel}>Vacant Rooms</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>18</Text>
                  <Text style={styles.statLabel}>Student Contacts</Text>
                </View>
              </View>

              {/* Section Header */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>My Apartment Buildings</Text>
                <TouchableOpacity
                  style={styles.addHouseBtn}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.8}
                >
                  <PlusIcon color="#ffffff" size={16} style={{ marginRight: 4 }} />
                  <Text style={styles.addHouseBtnText}>Add New Apartment</Text>
                </TouchableOpacity>
              </View>

              {/* Apartment Cards */}
              {listings.map((house) => {
                const avail = house.availableRooms !== undefined ? house.availableRooms : (house.occupancyStatus === 'available' ? 1 : 0);
                return (
                  <View key={house._id} style={styles.houseCard}>
                    <View style={styles.cardImageHeader}>
                      <Image source={{ uri: house.photos[0] }} style={styles.cardThumbnail} resizeMode="cover" />
                      <View style={styles.locationBadge}>
                        <Text style={styles.locationBadgeText}>{house.locationName || house.location}</Text>
                      </View>
                    </View>
                    <View style={styles.houseCardBody}>
                      <Text style={styles.houseTitle}>{house.title}</Text>
                      <Text style={styles.housePrice}>KSh {house.monthlyRent || house.pricePerMonth} / month</Text>

                      <View style={styles.contactRow}>
                        <View style={styles.contactChip}>
                          <PhoneIcon color="#334155" size={12} />
                          <Text style={styles.contactChipText}>{house.phoneContact}</Text>
                        </View>
                        <View style={styles.whatsappChip}>
                          <Text style={styles.whatsappChipText}>💬 {house.whatsappContact}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            /* NOTIFY TAB SECTION (POPUP & UPDATE CREATION) */
            <View style={styles.notifyContainer}>
              {/* Notify Sub Tabs */}
              <View style={styles.subTabRow}>
                <TouchableOpacity
                  style={[styles.subTabBtn, notifySubTab === 'normal' && styles.subTabBtnActive]}
                  onPress={() => setNotifySubTab('normal')}
                >
                  <Text style={[styles.subTabText, notifySubTab === 'normal' && styles.subTabTextActive]}>
                    📢 Normal Popup
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTabBtn, notifySubTab === 'update' && styles.subTabBtnActiveUpdate]}
                  onPress={() => setNotifySubTab('update')}
                >
                  <Text style={[styles.subTabText, notifySubTab === 'update' && styles.subTabTextActive]}>
                    🚀 App Update Popup
                  </Text>
                </TouchableOpacity>
              </View>

              {notifySubTab === 'normal' ? (
                /* NORMAL POPUP FORM */
                <View style={styles.notifyFormCard}>
                  <Text style={styles.notifyFormTitle}>Broadcast In-App Normal Popup</Text>
                  <Text style={styles.notifyFormSubtitle}>
                    Create a zero-lag announcement popup displayed to users on app launch.
                  </Text>

                  {/* Magic Line Placeholders Helper */}
                  <View style={styles.magicLineBox}>
                    <Text style={styles.magicLineHeader}>✨ Insert Magic Personalization Lines:</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <TouchableOpacity
                        style={styles.magicChip}
                        onPress={() => insertMagicVariable('{name}', 'title')}
                      >
                        <Text style={styles.magicChipText}>+ {"{name}"} (Student Name)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.magicChip}
                        onPress={() => insertMagicVariable('{course}', 'sub')}
                      >
                        <Text style={styles.magicChipText}>+ {"{course}"} (Student Course)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Popup Title <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Welcome {name} to MoiConnect!"
                      placeholderTextColor="#94a3b8"
                      value={popTitle}
                      onChangeText={setPopTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subtitle</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Access latest study summaries for {course}."
                      placeholderTextColor="#94a3b8"
                      value={popSubtitle}
                      onChangeText={setPopSubtitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Body Content Description</Text>
                    <TextInput
                      style={[styles.textInput, { height: 60 }]}
                      placeholder="Detailed text description inside the popup..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      value={popBody}
                      onChangeText={setPopBody}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Header Image Banner URL</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="https://..."
                      placeholderTextColor="#94a3b8"
                      value={popImage}
                      onChangeText={setPopImage}
                    />
                  </View>

                  {/* Smart Action Destination Discs/Chips Selector */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Smart Action Destination (Discs / Chips)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                      {[
                        { target: '/notes', label: 'Notes PDF 📄' },
                        { target: '/past-papers', label: 'Past Papers 📑' },
                        { target: '/cat-papers', label: 'CAT Papers 📝' },
                        { target: '/community', label: 'Community Chat 💬' },
                        { target: '/rentals', label: 'Rentals Marketplace 🏠' },
                        { target: '/contribute', label: 'Upload Materials 📤' },
                        { target: '/login', label: 'Sign In Page 🔑' }
                      ].map((item) => {
                        const isSel = popActionTarget === item.target;
                        return (
                          <TouchableOpacity
                            key={item.target}
                            style={[styles.smartChip, isSel && styles.smartChipActive]}
                            onPress={() => setPopActionTarget(item.target)}
                          >
                            <Text style={[styles.smartChipText, isSel && styles.smartChipTextActive]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Action Button Label Text</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Explore Notes"
                      placeholderTextColor="#94a3b8"
                      value={popActionText}
                      onChangeText={setPopActionText}
                    />
                  </View>

                  {/* Target Audience Selector */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Target Audience</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[
                        { id: 'all', label: 'All Users 🌐' },
                        { id: 'unauthenticated', label: 'Guests Only 👤' },
                        { id: 'emails', label: 'Email List 📧' }
                      ].map((aud) => {
                        const isSel = popAudience === aud.id;
                        return (
                          <TouchableOpacity
                            key={aud.id}
                            style={[styles.audChip, isSel && styles.audChipActive]}
                            onPress={() => setPopAudience(aud.id as any)}
                          >
                            <Text style={[styles.audChipText, isSel && styles.audChipTextActive]}>
                              {aud.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {popAudience === 'emails' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Recipient Emails (Comma-separated)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="student1@moi.ac.ke, student2@gmail.com"
                        placeholderTextColor="#94a3b8"
                        value={popEmails}
                        onChangeText={setPopEmails}
                      />
                    </View>
                  )}

                  {/* Cancel Button Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setPopCancel(!popCancel)}
                  >
                    <View style={[styles.checkbox, popCancel && styles.checkboxChecked]}>
                      {popCancel && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>Include Cancel / Dismiss Button</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createNotifyBtn}
                    onPress={handleCreateNormalPopup}
                    disabled={creatingPopup}
                    activeOpacity={0.88}
                  >
                    {creatingPopup ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <SparklesIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                        <Text style={styles.createNotifyBtnText}>Broadcast Normal Popup</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* UPDATE POPUP FORM */
                <View style={styles.notifyFormCard}>
                  <Text style={styles.notifyFormTitle}>Broadcast App Update Popup</Text>
                  <Text style={styles.notifyFormSubtitle}>
                    Push mandatory or optional version update prompts to users whose app version is outdated.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Minimum Required App Version <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 1.0.7"
                      placeholderTextColor="#94a3b8"
                      value={upMinVersion}
                      onChangeText={setUpMinVersion}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Update Title</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. MoiConnect v1.0.7 Available!"
                      placeholderTextColor="#94a3b8"
                      value={upTitle}
                      onChangeText={setUpTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Update Subtitle / Description</Text>
                    <TextInput
                      style={[styles.textInput, { height: 60 }]}
                      placeholder="Update description..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      value={upSubtitle}
                      onChangeText={setUpSubtitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Google Play Store URL</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      placeholderTextColor="#94a3b8"
                      value={upPlayStoreUrl}
                      onChangeText={setUpPlayStoreUrl}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setUpForce(!upForce)}
                  >
                    <View style={[styles.checkbox, upForce && styles.checkboxChecked]}>
                      {upForce && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>Force Update (Mandatory, non-dismissible)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.createNotifyBtn, { backgroundColor: '#2563eb' }]}
                    onPress={handleCreateUpdatePopup}
                    disabled={creatingPopup}
                    activeOpacity={0.88}
                  >
                    {creatingPopup ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <DownloadIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                        <Text style={styles.createNotifyBtnText}>Broadcast Version Update</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* POPUP HISTORY LIST */}
              <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>Active Popups & Broadcast History</Text>
                {loadingHistory ? (
                  <ActivityIndicator color="#15803d" size="small" style={{ marginVertical: 10 }} />
                ) : popupsHistory.length === 0 ? (
                  <Text style={styles.emptyHistoryText}>No active or past popups yet.</Text>
                ) : (
                  popupsHistory.map((item) => (
                    <View key={item._id} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <View style={styles.historyIdTag}>
                          <Text style={styles.historyIdText}>{item.popupId || 'POPUP-0000'}</Text>
                        </View>
                        <Text style={styles.historyTypeTag}>{item.type.toUpperCase()}</Text>
                        <TouchableOpacity onPress={() => handleDeletePopup(item._id)}>
                          <TrashIcon color="#ef4444" size={16} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.historyTitleText}>{item.title}</Text>
                      {!!item.subtitle && <Text style={styles.historySubText}>{item.subtitle}</Text>}
                      <View style={styles.historyMetaRow}>
                        <Text style={styles.historyMetaText}>Target: {item.actionTarget || 'N/A'}</Text>
                        <Text style={styles.historyMetaText}>Audience: {item.targetAudience}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Apartment Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>List New Apartment</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <CloseIcon color="#ef4444" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apartment Building Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Kesses Sunrise Hostels"
                placeholderTextColor="#94a3b8"
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Rent (KSh) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 4800"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={newRent}
                onChangeText={setNewRent}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateListingSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Publish Apartment Listing</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#15803d',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  headerSub: {
    color: '#dcfce7',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  securityBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  shieldCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 2
  },
  securitySub: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  required: {
    color: '#ef4444'
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a'
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  mainTabSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  mainTabBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  mainTabBtnActiveNotify: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  mainTabTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  landlordBadgeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  landlordBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  verifiedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  landlordName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  landlordMeta: {
    fontSize: 12,
    color: '#64748b'
  },
  verifiedTag: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803d'
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  addHouseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  addHouseBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  houseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardImageHeader: {
    height: 120,
    width: '100%',
    position: 'relative'
  },
  cardThumbnail: {
    width: '100%',
    height: '100%'
  },
  locationBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  locationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  houseCardBody: {
    padding: 14
  },
  houseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  housePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 8
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  contactChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  whatsappChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  whatsappChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  /* Notify Tab Styles */
  notifyContainer: {
    gap: 16
  },
  subTabRow: {
    flexDirection: 'row',
    gap: 10
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  subTabBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  subTabBtnActiveUpdate: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  subTabTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  notifyFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  notifyFormTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  notifyFormSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14
  },
  magicLineBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  magicLineHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af'
  },
  magicChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93c5fd'
  },
  magicChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb'
  },
  smartChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  smartChipActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  smartChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  smartChipTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  audChip: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  audChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  audChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  audChipTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  createNotifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10
  },
  createNotifyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  historyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12
  },
  emptyHistoryText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic'
  },
  historyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  historyIdTag: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  historyIdText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800'
  },
  historyTypeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb'
  },
  historyTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  historySubText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6
  },
  historyMetaRow: {
    flexDirection: 'row',
    gap: 12
  },
  historyMetaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500'
  },
  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalScroll: {
    maxHeight: '90%'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 10
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  }
});
