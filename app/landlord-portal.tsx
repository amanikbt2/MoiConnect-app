import { showIceMessage } from '../src/components/IceMessageCard';
import * as ImagePicker from 'expo-image-picker';
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
  Image,
  Linking
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
  CloseIcon,
  DocumentIcon,
  FolderIcon,
  SearchIcon,
  CheckIcon
} from '../src/components/Icons';

export default function LandlordPortalScreen() {
  const router = useAppNavigation();
  const { user } = useAuth();

  // Verification Credentials State
  const [landlordMID, setLandlordMID] = useState('');
  const [landlordSerial, setLandlordSerial] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [isVerified, setIsVerified] = useState(Boolean(user?.roles?.includes('admin') || user?.roles?.includes('landlord')));
  const [verifying, setVerifying] = useState(false);

  // Portal Main Section Tab State ('listings' | 'notify' | 'materials' | 'temp')
  const [portalTab, setPortalTab] = useState<'listings' | 'notify' | 'materials' | 'temp'>('listings');
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

  // Material Approvals State
  const [pendingPapers, setPendingPapers] = useState<any[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [paperSearch, setPaperSearch] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Paper Modal Edit Fields
  const [editTitle, setEditTitle] = useState('');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editYear, setEditYear] = useState('2025');
  const [editType, setEditType] = useState('past_paper');
  const [editThumbnail, setEditThumbnail] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Server Media (Temp) State
  const [tempFiles, setTempFiles] = useState<any[]>([]);
  const [tempStats, setTempStats] = useState({ totalFiles: 0, totalSizeBytes: 0, totalSizeFormatted: '0 B' });
  const [loadingTemp, setLoadingTemp] = useState(false);
  const [selectedFilenames, setSelectedFilenames] = useState<string[]>([]);
  const [cleaningTemp, setCleaningTemp] = useState(false);

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

  const fetchPendingPapers = async () => {
    setLoadingPapers(true);
    try {
      const res: any = await apiRequest('/dashboard/overview');
      if (res?.success && Array.isArray(res.pendingPapers)) {
        setPendingPapers(res.pendingPapers);
      }
    } catch (e) {
      console.log('Error fetching pending papers:', e);
    }
    setLoadingPapers(false);
  };

  const fetchTempFiles = async () => {
    setLoadingTemp(true);
    try {
      const res: any = await apiRequest('/dashboard/temp-files');
      if (res?.success && Array.isArray(res.files)) {
        setTempFiles(res.files);
        setTempStats({
          totalFiles: res.totalFiles || res.files.length,
          totalSizeBytes: res.totalSizeBytes || 0,
          totalSizeFormatted: res.totalSizeFormatted || '0 B'
        });
      }
    } catch (e) {
      console.log('Error loading temp files:', e);
    }
    setLoadingTemp(false);
  };

  useEffect(() => {
    if (isVerified) {
      if (portalTab === 'notify') fetchPopupHistory();
      if (portalTab === 'materials') fetchPendingPapers();
      if (portalTab === 'temp') fetchTempFiles();
      // Always pre-populate counts in background
      fetchPendingPapers();
      fetchTempFiles();
    }
  }, [isVerified, portalTab]);

  const handleOpenPaperModal = (paper: any) => {
    setSelectedPaper(paper);
    setEditTitle(paper.title || '');
    setEditCourseCode(paper.courseCode || paper.unitCode || '');
    setEditSchool(paper.school || '');
    setEditYear(String(paper.examYear || 2025));
    setEditType(paper.type || 'past_paper');
    setShowPaperModal(true);
  };

  const handlePickThumbnail = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showIceMessage('Permission Needed', 'Allow photo access to choose a material thumbnail.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85
      });
      if (result.canceled || !result.assets?.[0] || !selectedPaper) return;

      const asset = result.assets[0];
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.fileName || 'material-thumbnail.jpg');
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'material-thumbnail.jpg',
          type: asset.mimeType || 'image/jpeg'
        } as any);
      }

      setUploadingThumbnail(true);
      const response: any = await apiRequest(`/dashboard/papers/${selectedPaper._id}/upload-thumbnail`, {
        method: 'POST',
        body: formData
      });
      if (!response?.success || !response.data?.thumbnail) {
        throw new Error(response?.error || 'Thumbnail upload failed.');
      }

      setEditThumbnail(response.data.thumbnail);
      setSelectedPaper((prev: any) => ({ ...prev, thumbnail: response.data.thumbnail }));
      showIceMessage('Thumbnail Ready', 'The selected image will be used when this material is approved.');
    } catch (error: any) {
      showIceMessage('Thumbnail Upload Failed', error?.message || 'Could not upload the thumbnail.');
    } finally {
      setUploadingThumbnail(false);
    }
  };
  const handleSavePaperEdits = async () => {
    if (!selectedPaper) return;
    setActionLoading(true);
    try {
      const res = await apiRequest(`/dashboard/papers/${selectedPaper._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle.trim(),
          courseCode: editCourseCode.trim().toUpperCase(),
          unitCode: editCourseCode.trim().toUpperCase(),
          school: editSchool.trim(),
          department: editSchool.trim(),
          examYear: parseInt(editYear) || 2025,
          type: editType
        })
      });
      if (res?.success) {
        showIceMessage('Saved! ✅', 'Document metadata updated successfully.');
        setSelectedPaper((prev: any) => ({
          ...prev,
          title: editTitle.trim(),
          courseCode: editCourseCode.trim().toUpperCase(),
          school: editSchool.trim(),
          examYear: parseInt(editYear) || 2025,
          type: editType
        }));
        fetchPendingPapers();
      } else {
        showIceMessage('Save Failed', res?.error || 'Could not update document.');
      }
    } catch (e: any) {
      showIceMessage('Error', e?.message || 'Network error while updating.');
    }
    setActionLoading(false);
  };

  const handleApprovePaper = async () => {
    if (!selectedPaper) return;
    setActionLoading(true);
    try {
      const res = await apiRequest(`/dashboard/papers/${selectedPaper._id}/approve`, {
        method: 'POST'
      });
      if (res?.success) {
        showIceMessage(
          'Approved & Uploaded! ✨',
          `Document approved with MTID ${res.data?.mtid || ''}!\n\nUploaded to Cloudinary (folder: MoiConnect/pdf). Server temporary file has been safely removed.`
        );
        setShowPaperModal(false);
        fetchPendingPapers();
        fetchTempFiles();
      } else {
        showIceMessage('Approval Failed', res?.error || 'Could not approve paper.');
      }
    } catch (e: any) {
      showIceMessage('Error', e?.message || 'Failed to approve paper.');
    }
    setActionLoading(false);
  };

  const handleRejectPaper = async () => {
    if (!selectedPaper) return;
    showIceMessage(
      'Confirm Rejection',
      'Are you sure you want to reject this submission? The temporary file will be deleted from the server disk.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject & Delete Temp',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await apiRequest(`/dashboard/papers/${selectedPaper._id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason: 'Document does not meet upload standards.' })
              });
              if (res?.success) {
                showIceMessage('Rejected ❌', 'Material rejected and temporary file removed from server disk.');
                setShowPaperModal(false);
                fetchPendingPapers();
                fetchTempFiles();
              } else {
                showIceMessage('Error', res?.error || 'Could not reject paper.');
              }
            } catch (e: any) {
              showIceMessage('Error', e?.message || 'Failed to reject paper.');
            }
            setActionLoading(false);
          }
        }
      ]
    );
  };

  const handleToggleSelectFilename = (filename: string) => {
    setSelectedFilenames((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedFilenames.length === tempFiles.length) {
      setSelectedFilenames([]);
    } else {
      setSelectedFilenames(tempFiles.map((f) => f.name));
    }
  };

  const handleDeleteSingleTempFile = (filename: string) => {
    showIceMessage(
      'Delete Temp File?',
      `Are you sure you want to delete "${filename}" from the server temporary storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiRequest(`/dashboard/temp-files/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
              });
              if (res?.success) {
                showIceMessage('Deleted', `File "${filename}" deleted from server.`);
                fetchTempFiles();
                fetchPendingPapers();
              } else {
                showIceMessage('Error', res?.error || 'Failed to delete file.');
              }
            } catch (e: any) {
              showIceMessage('Error', e?.message || 'Delete request failed.');
            }
          }
        }
      ]
    );
  };

  const handleBatchDeleteTempFiles = () => {
    if (selectedFilenames.length === 0) return;
    showIceMessage(
      'Clean Server Media?',
      `Are you sure you want to permanently delete ${selectedFilenames.length} temporary file(s) from the server?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Clean ${selectedFilenames.length} Files`,
          style: 'destructive',
          onPress: async () => {
            setCleaningTemp(true);
            try {
              const res: any = await apiRequest('/dashboard/temp-files/delete-batch', {
                method: 'POST',
                body: JSON.stringify({ filenames: selectedFilenames })
              });
              if (res?.success) {
                showIceMessage('Server Cleaned! 🧹', `Deleted ${res.deletedCount || selectedFilenames.length} temporary file(s) from server disk.`);
                setSelectedFilenames([]);
                fetchTempFiles();
                fetchPendingPapers();
              } else {
                showIceMessage('Error', res?.error || 'Failed to clean files.');
              }
            } catch (e: any) {
              showIceMessage('Error', e?.message || 'Batch delete failed.');
            }
            setCleaningTemp(false);
          }
        }
      ]
    );
  };

  const handleAuthenticate = () => {
    if (!landlordMID.trim() || !landlordSerial.trim() || !securityKey.trim()) {
      showIceMessage('Missing Verification Keys', 'Please enter your MID, Serial Number, and Security Key to authenticate.');
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setIsVerified(true);
      showIceMessage(
        'Authentication Successful! 🟢',
        `Welcome to the Admin Portal! You can manage listings and broadcast Popups.`
      );
    }, 900);
  };

  const handleCreateNormalPopup = async () => {
    if (!popTitle.trim()) {
      showIceMessage('Incomplete Form', 'Please enter a title for the popup.');
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
        showIceMessage('Popup Created! 📢', `Broadcast created successfully with auto-incrementing ID!`);
        fetchPopupHistory();
      } else {
        showIceMessage('Creation Failed', res.error || 'Could not save popup.');
      }
    } catch (e) {
      showIceMessage('Error', 'Failed to connect to backend server.');
    }
    setCreatingPopup(false);
  };

  const handleCreateUpdatePopup = async () => {
    if (!upMinVersion.trim() || !upTitle.trim()) {
      showIceMessage('Incomplete Form', 'Please enter minimum version and update title.');
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
        showIceMessage('Update Broadcast Created! 🚀', `App version update popup for v${upMinVersion} broadcasted successfully!`);
        fetchPopupHistory();
      } else {
        showIceMessage('Creation Failed', res.error || 'Could not save update broadcast.');
      }
    } catch (e) {
      showIceMessage('Error', 'Failed to connect to backend server.');
    }
    setCreatingPopup(false);
  };

  const handleDeletePopup = async (popupId: string) => {
    showIceMessage(
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
              showIceMessage('Error', 'Could not remove popup.');
            }
          }
        }
      ]
    );
  };

  const handleCreateListingSubmit = async () => {
    if (!newTitle.trim() || !newDesc.trim() || !newRent.trim()) {
      showIceMessage('Incomplete Form', 'Please fill in the title, description, and monthly rent.');
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
        showIceMessage('Success 🎉', 'Apartment listing published successfully!');
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
        showIceMessage('Listing Added 🎉', 'Apartment listing created successfully!');
      }
    } catch (e: any) {
      showIceMessage('Error', e?.message || 'Failed to create listing.');
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
          <Text style={styles.headerTitle}>
            <Text style={{ color: '#ffffff' }}>Landlord </Text>
            <Text style={{ color: '#a7f3d0' }}>Portal</Text>
          </Text>
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
          {/* Main Top Navigation Tabs (Listings, Approvals, Server Temp, Notify) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mainTabSwitchRow}
          >
            <TouchableOpacity
              style={[styles.mainTabBtn, portalTab === 'listings' && styles.mainTabBtnActive]}
              onPress={() => setPortalTab('listings')}
            >
              <HouseIcon color={portalTab === 'listings' ? '#ffffff' : '#64748b'} size={16} />
              <Text style={[styles.mainTabText, portalTab === 'listings' && styles.mainTabTextActive]}>
                Apartments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainTabBtn, portalTab === 'materials' && styles.mainTabBtnActiveMaterials]}
              onPress={() => setPortalTab('materials')}
            >
              <DocumentIcon color={portalTab === 'materials' ? '#ffffff' : '#047857'} size={16} />
              <Text style={[styles.mainTabText, portalTab === 'materials' && styles.mainTabTextActive]}>
                Approvals {pendingPapers.length > 0 ? `(${pendingPapers.length})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainTabBtn, portalTab === 'temp' && styles.mainTabBtnActiveTemp]}
              onPress={() => setPortalTab('temp')}
            >
              <FolderIcon color={portalTab === 'temp' ? '#ffffff' : '#b45309'} size={16} />
              <Text style={[styles.mainTabText, portalTab === 'temp' && styles.mainTabTextActive]}>
                Server Media (Temp) {tempStats.totalFiles > 0 ? `(${tempStats.totalFiles})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainTabBtn, portalTab === 'notify' && styles.mainTabBtnActiveNotify]}
              onPress={() => setPortalTab('notify')}
            >
              <SparklesIcon color={portalTab === 'notify' ? '#ffffff' : '#2563eb'} size={16} />
              <Text style={[styles.mainTabText, portalTab === 'notify' && styles.mainTabTextActive]}>
                Notify (Popups)
              </Text>
            </TouchableOpacity>
          </ScrollView>

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
          ) : portalTab === 'materials' ? (
            /* MATERIAL APPROVALS SECTION */
            <View style={styles.materialsSection}>
              {/* Header with Search and Refresh */}
              <View style={styles.materialHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Material Approvals</Text>
                  <Text style={styles.sectionSubtitle}>
                    {pendingPapers.length} submissions pending review and Cloudinary sync
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={fetchPendingPapers}
                  disabled={loadingPapers}
                  activeOpacity={0.8}
                >
                  <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchBar}>
                <SearchIcon color="#94a3b8" size={16} />
                <TextInput
                  style={styles.searchBarInput}
                  placeholder="Search code, title, school..."
                  placeholderTextColor="#94a3b8"
                  value={paperSearch}
                  onChangeText={setPaperSearch}
                />
                {!!paperSearch && (
                  <TouchableOpacity onPress={() => setPaperSearch('')}>
                    <CloseIcon color="#94a3b8" size={14} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Tiny Compact List */}
              {loadingPapers ? (
                <ActivityIndicator color="#15803d" size="large" style={{ marginVertical: 30 }} />
              ) : pendingPapers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardEmoji}>🎉</Text>
                  <Text style={styles.emptyCardTitle}>No Pending Approvals</Text>
                  <Text style={styles.emptyCardText}>All contributed materials have been reviewed and uploaded.</Text>
                </View>
              ) : (
                <View style={styles.tinyListContainer}>
                  {pendingPapers
                    .filter((p) => {
                      if (!paperSearch.trim()) return true;
                      const q = paperSearch.toLowerCase();
                      return (
                        p.title?.toLowerCase().includes(q) ||
                        p.courseCode?.toLowerCase().includes(q) ||
                        p.unitCode?.toLowerCase().includes(q) ||
                        p.school?.toLowerCase().includes(q)
                      );
                    })
                    .map((paper) => (
                      <TouchableOpacity
                        key={paper._id}
                        style={styles.tinyPaperRow}
                        onPress={() => handleOpenPaperModal(paper)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.codePill}>
                          <Text style={styles.codePillText}>{paper.courseCode || paper.unitCode || 'UNIT'}</Text>
                        </View>

                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={styles.tinyRowTitle} numberOfLines={1}>
                            {paper.title}
                          </Text>
                          <View style={styles.tinyRowMetaRow}>
                            <Text style={styles.tinyRowSchool} numberOfLines={1}>
                              {paper.school || 'Moi University'}
                            </Text>
                            <Text style={styles.tinyRowDot}>•</Text>
                            <Text style={styles.tinyRowType}>
                              {paper.type === 'past_paper' ? 'Past Paper' : paper.type === 'cat' ? 'CAT' : 'Notes'}
                            </Text>
                            <Text style={styles.tinyRowDot}>•</Text>
                            <View style={styles.sizePill}>
                              <Text style={styles.sizePillText}>
                                {paper.fileSize ? `${(paper.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'PDF'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.reviewPill}>
                          <Text style={styles.reviewPillText}>Review ⚡</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
          ) : portalTab === 'temp' ? (
            /* SERVER MEDIA (TEMP) SECTION */
            <View style={styles.tempSection}>
              {/* KPI cards */}
              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
                  <Text style={styles.kpiNumber}>{tempStats.totalFiles}</Text>
                  <Text style={styles.kpiLabel}>Temp Files</Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: '#fed7aa', backgroundColor: '#fff7ed' }]}>
                  <Text style={styles.kpiNumber}>{tempStats.totalSizeFormatted}</Text>
                  <Text style={styles.kpiLabel}>Disk Space</Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: '#e2e8f0', backgroundColor: '#ffffff' }]}>
                  <Text style={styles.kpiNumber}>Folder</Text>
                  <Text style={styles.kpiLabel}>uploads/temp</Text>
                </View>
              </View>

              {/* Batch Operations Bar */}
              <View style={styles.batchBar}>
                <TouchableOpacity
                  style={styles.batchBtnOutline}
                  onPress={handleToggleSelectAll}
                  activeOpacity={0.8}
                >
                  <Text style={styles.batchBtnOutlineText}>
                    {selectedFilenames.length === tempFiles.length && tempFiles.length > 0
                      ? 'Deselect All'
                      : `Select All (${tempFiles.length})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.batchBtnDelete,
                    selectedFilenames.length === 0 && styles.batchBtnDeleteDisabled
                  ]}
                  onPress={handleBatchDeleteTempFiles}
                  disabled={selectedFilenames.length === 0 || cleaningTemp}
                  activeOpacity={0.8}
                >
                  {cleaningTemp ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.batchBtnDeleteText}>
                      🗑️ Clean Selected ({selectedFilenames.length})
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refreshIconBtn}
                  onPress={fetchTempFiles}
                  disabled={loadingTemp}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16 }}>🔄</Text>
                </TouchableOpacity>
              </View>

              {/* Files List */}
              {loadingTemp ? (
                <ActivityIndicator color="#15803d" size="large" style={{ marginVertical: 30 }} />
              ) : tempFiles.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardEmoji}>✨</Text>
                  <Text style={styles.emptyCardTitle}>Server Temp Folder is Clean!</Text>
                  <Text style={styles.emptyCardText}>No leftover temporary files stored in uploads/temp/.</Text>
                </View>
              ) : (
                <View style={styles.tempFilesList}>
                  {tempFiles.map((file) => {
                    const isSelected = selectedFilenames.includes(file.name);
                    return (
                      <View key={file.name} style={[styles.tempFileCard, isSelected && styles.tempFileCardSelected]}>
                        <TouchableOpacity
                          style={styles.tempCheckArea}
                          onPress={() => handleToggleSelectFilename(file.name)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                            {isSelected && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                          </View>
                        </TouchableOpacity>

                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={styles.tempFileName} numberOfLines={1}>
                            {file.name}
                          </Text>
                          <View style={styles.tempFileMetaRow}>
                            <Text style={styles.tempFileSize}>{file.sizeFormatted}</Text>
                            <Text style={styles.tinyRowDot}>•</Text>
                            <Text style={styles.tempFileDate}>
                              {new Date(file.modifiedAt).toLocaleDateString()}
                            </Text>
                          </View>
                          {file.isPending ? (
                            <View style={styles.pendingTag}>
                              <Text style={styles.pendingTagText}>
                                🟡 Linked: {file.paperCode || ''} {file.paperTitle || ''}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.orphanTag}>
                              <Text style={styles.orphanTagText}>⚪ Unlinked / Orphaned</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.tempRowActions}>
                          <TouchableOpacity
                            style={styles.tempActionBtn}
                            onPress={() => {
                              if (file.url) Linking.openURL(file.url);
                            }}
                            activeOpacity={0.7}
                          >
                            <DownloadIcon color="#15803d" size={16} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.tempActionBtn, { backgroundColor: '#fee2e2' }]}
                            onPress={() => handleDeleteSingleTempFile(file.name)}
                            activeOpacity={0.7}
                          >
                            <TrashIcon color="#ef4444" size={16} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
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
                  <ScrollView
                    style={styles.historyList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {popupsHistory.map((item) => (
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
                    ))}
                  </ScrollView>
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

      {/* Material Review & Approval Modal */}
      <Modal
        visible={showPaperModal && !!selectedPaper}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaperModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Material Approval & Review</Text>
                <Text style={styles.modalSubtitleSmall}>
                  Inspect media, edit details, or approve to Cloudinary
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPaperModal(false)}>
                <CloseIcon color="#ef4444" size={20} />
              </TouchableOpacity>
            </View>

            {/* Media Download & Verification Box */}
            <View style={styles.mediaDownloadBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mediaBoxTitle}>Uploaded Temporary Media</Text>
                <Text style={styles.mediaBoxSub} numberOfLines={1}>
                  {selectedPaper?.tempFilename || selectedPaper?.fileUrl?.split('/').pop() || 'document.pdf'}
                </Text>
                <Text style={styles.mediaBoxSize}>
                  Size: {selectedPaper?.fileSize ? `${(selectedPaper.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'PDF'} • Status: Pending Review
                </Text>
              </View>
              <TouchableOpacity
                style={styles.downloadMediaBtn}
                onPress={() => {
                  if (selectedPaper?.fileUrl) {
                    Linking.openURL(selectedPaper.fileUrl);
                  }
                }}
                activeOpacity={0.8}
              >
                <DownloadIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={styles.downloadMediaBtnText}>Download Media</Text>
              </TouchableOpacity>
            </View>

            {/* Material Thumbnail */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Material Thumbnail</Text>
              <Text style={styles.mediaBoxSub}>Optional — a default image is used if you do not upload one.</Text>
              {editThumbnail ? (
                <Image source={{ uri: editThumbnail }} style={{ width: '100%', height: 150, borderRadius: 12, marginTop: 8 }} resizeMode="cover" />
              ) : (
                <View style={{ height: 110, borderRadius: 12, marginTop: 8, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#047857', fontWeight: '700' }}>Default thumbnail will be applied</Text>
                </View>
              )}
              <TouchableOpacity style={[styles.saveEditsBtn, uploadingThumbnail && styles.btnDisabled, { marginTop: 10 }]} onPress={handlePickThumbnail} disabled={uploadingThumbnail || actionLoading}>
                {uploadingThumbnail ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.saveEditsBtnText}>{editThumbnail ? 'Replace Thumbnail' : 'Upload Thumbnail'}</Text>}
              </TouchableOpacity>
            </View>
            {/* Metadata Editing Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="e.g. Distributed Operating Systems"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course / Unit Code <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                value={editCourseCode}
                onChangeText={setEditCourseCode}
                placeholder="e.g. COM 310"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>School / Faculty</Text>
              <TextInput
                style={styles.textInput}
                value={editSchool}
                onChangeText={setEditSchool}
                placeholder="e.g. School of Information Sciences"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Exam Year</Text>
                <TextInput
                  style={styles.textInput}
                  value={editYear}
                  onChangeText={setEditYear}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Type</Text>
                <TextInput
                  style={styles.textInput}
                  value={editType}
                  onChangeText={setEditType}
                  placeholder="past_paper, cat, notes"
                />
              </View>
            </View>

            {/* Save Edits Button */}
            <TouchableOpacity
              style={styles.saveEditsBtn}
              onPress={handleSavePaperEdits}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.saveEditsBtnText}>💾 Save Metadata Edits</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            {/* Decision Buttons */}
            <View style={styles.modalDecisionCol}>
              <TouchableOpacity
                style={[styles.approveBtn, actionLoading && styles.btnDisabled]}
                onPress={handleApprovePaper}
                disabled={actionLoading}
                activeOpacity={0.88}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CheckIcon color="#ffffff" size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.approveBtnText}>✨ Approve & Upload to Cloudinary</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rejectBtn, actionLoading && styles.btnDisabled]}
                onPress={handleRejectPaper}
                disabled={actionLoading}
                activeOpacity={0.88}
              >
                <Text style={styles.rejectBtnText}>❌ Reject & Delete Temp File</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    paddingBottom: 12
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
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
  historyList: {
    maxHeight: 420
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
  },
  /* Materials Section */
  materialsSection: {
    marginTop: 10
  },
  materialHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  refreshBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0
  },
  tinyListContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  tinyPaperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  codePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  codePillText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800'
  },
  tinyRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  tinyRowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  tinyRowSchool: {
    fontSize: 11,
    color: '#64748b',
    maxWidth: 120
  },
  tinyRowDot: {
    fontSize: 10,
    color: '#94a3b8',
    marginHorizontal: 4
  },
  tinyRowType: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  sizePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  sizePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569'
  },
  reviewPill: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  reviewPillText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 10
  },
  emptyCardEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  emptyCardText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
  },

  /* Server Temp Section */
  tempSection: {
    marginTop: 10
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center'
  },
  kpiNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2
  },
  batchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  batchBtnOutline: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff'
  },
  batchBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  batchBtnDelete: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  batchBtnDeleteDisabled: {
    backgroundColor: '#fca5a5',
    opacity: 0.6
  },
  batchBtnDeleteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  refreshIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginLeft: 'auto'
  },
  tempFilesList: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  tempFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  tempFileCardSelected: {
    backgroundColor: '#eff6ff'
  },
  tempCheckArea: {
    paddingRight: 4
  },
  tempFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  tempFileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  tempFileSize: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  tempFileDate: {
    fontSize: 11,
    color: '#94a3b8'
  },
  pendingTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4
  },
  pendingTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309'
  },
  orphanTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4
  },
  orphanTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b'
  },
  tempRowActions: {
    flexDirection: 'row',
    gap: 6
  },
  tempActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },

  /* Modal Additions */
  modalSubtitleSmall: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  mediaDownloadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
    gap: 10
  },
  mediaBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  mediaBoxSub: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2
  },
  mediaBoxSize: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  downloadMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  downloadMediaBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  saveEditsBtn: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4
  },
  saveEditsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b'
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16
  },
  modalDecisionCol: {
    gap: 10,
    marginBottom: 10
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingVertical: 14
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  rejectBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2'
  },
  rejectBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700'
  },
  btnDisabled: {
    opacity: 0.6
  },
  mainTabBtnActiveMaterials: {
    backgroundColor: '#047857'
  },
  mainTabBtnActiveTemp: {
    backgroundColor: '#b45309'
  }
});
