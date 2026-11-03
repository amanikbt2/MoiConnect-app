import { showIceMessage } from '../../src/components/IceMessageCard';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Platform,
  Image,
  Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import {
  getStudentPersonalDetails,
  saveStudentPersonalDetails,
  StudentPersonalDetails,
  clearMaterialSearchHistory
} from '../../src/services/offlineStorage';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { UserBadge } from '../../src/components/UserBadge';
import { EmptyState } from '../../src/components/EmptyState';
import { DeleteAccountConfirmModal } from '../../src/components/DeleteAccountConfirmModal';
import { useUniversity } from '../../src/context/UniversityContext';
import { findKenyanUniversity, getKenyanUniversitySearchAliases, KENYAN_UNIVERSITIES } from '../../src/data/kenyanUniversities';
import { MOI_SCHOOLS } from '@moi/shared';
import {
  HouseIcon,
  ShieldCheckIcon,
  EditIcon,
  CameraIcon,
  AcademicCapIcon,
  CalendarIcon,
  CloseIcon,
  PhoneIcon,
  BookIcon,
  MoreVerticalIcon,
  TrashIcon,
  HelpCircleIcon,
  LogOutIcon,

} from '../../src/components/Icons';

const CAMPUS_BOT_AVATAR = require('../../assets/campus-bot-avatar.png');
const CAMPUS_AI_AVATAR = require('../../assets/campus-ai-avatar.png');

const isCampusBotUser = (u?: { email?: string; name?: string } | null) => {
  const email = (u?.email || '').toLowerCase().trim();
  const name = (u?.name || '').toLowerCase().trim();
  return email === 'campusbot@moiconnect.app' || name.includes('campus bot');
};

const isCampusAIUser = (u?: { email?: string; name?: string } | null) => {
  const email = (u?.email || '').toLowerCase().trim();
  const name = (u?.name || '').toLowerCase().trim();
  return email === 'campusai@moiconnect.app' || name === 'campus ai';
};

const isAssistantUser = (u?: { email?: string; name?: string } | null) => isCampusBotUser(u) || isCampusAIUser(u);

const getAssistantAvatarSource = (u?: { email?: string; name?: string } | null) => {
  if (isCampusBotUser(u)) return CAMPUS_BOT_AVATAR;
  if (isCampusAIUser(u)) return CAMPUS_AI_AVATAR;
  return null;
};

const YEARS_LIST = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'];

// Common school and faculty names used across Kenyan universities. Keep the
// input editable so students can still enter names that are institution-specific.
const COMMON_SCHOOL_FACULTIES = [
  'Faculty of Agriculture',
  'Faculty of Arts',
  'Faculty of Built Environment',
  'Faculty of Business and Management Sciences',
  'Faculty of Commerce',
  'Faculty of Computing and Information Technology',
  'Faculty of Education',
  'Faculty of Engineering',
  'Faculty of Environmental Studies',
  'Faculty of Health Sciences',
  'Faculty of Humanities and Social Sciences',
  'Faculty of Law',
  'Faculty of Science',
  'Faculty of Social Sciences',
  'Faculty of Veterinary Medicine',
  'School of Agriculture and Food Sciences',
  'School of Arts and Social Sciences',
  'School of Business',
  'School of Computing and Information Technology',
  'School of Education',
  'School of Engineering and Technology',
  'School of Environmental Studies',
  'School of Health Sciences',
  'School of Humanities',
  'School of Law',
  'School of Medicine',
  'School of Nursing',
  'School of Pharmacy',
  'School of Public Health',
  'School of Science',
  'School of Social Sciences',
  'School of Veterinary Medicine',
];
const SCHOOL_FACULTY_OPTIONS = Array.from(new Set([...MOI_SCHOOLS, ...COMMON_SCHOOL_FACULTIES]));

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, deleteAccount, updateUserProfile } = useAuth();
  const { isDark, colors, toggleDarkTheme } = useTheme();
  const { selectedUniversity, selectUniversity } = useUniversity();
  const scrollBottomPadding = Platform.OS === 'android'
    ? Math.max(88, insets.bottom + 72)
    : 40;
  const editModalBottomPadding = Platform.OS === 'android'
    ? Math.max(88, insets.bottom + 72)
    : 20;
  const [studentDetails, setStudentDetails] = useState<StudentPersonalDetails>({
    school: 'Unset',
    course: 'Unset',
    yearOfStudy: 'Unset',
    phone: '',
    fullName: user?.name || 'Moi Student'
  });

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileCompletionRequired, setProfileCompletionRequired] = useState(false);
  // Track which user we've auto-prompted so we only open once per mount
  const autoOpenedForUserId = useRef<string | null>(null);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [editSchool, setEditSchool] = useState('');
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [editUniversity, setEditUniversity] = useState('');
  const filteredUniversities = KENYAN_UNIVERSITIES.filter((university) =>
    getKenyanUniversitySearchAliases(university).some((alias) => alias.toLowerCase().includes(editUniversity.trim().toLowerCase()))
  ).slice(0, editUniversity.trim() ? 12 : KENYAN_UNIVERSITIES.length);
  const filteredSchoolOptions = SCHOOL_FACULTY_OPTIONS
    .filter((school) => school.toLowerCase().includes(editSchool.trim().toLowerCase()))
    .slice(0, editSchool.trim() ? 12 : SCHOOL_FACULTY_OPTIONS.length);
  const hasExactSchoolMatch = SCHOOL_FACULTY_OPTIONS.some(
    (school) => school.toLowerCase() === editSchool.trim().toLowerCase()
  );
  const [editCourse, setEditCourse] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editName, setEditName] = useState('');
  const [editAvatarUri, setEditAvatarUri] = useState<string | undefined>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileValidationMessage, setProfileValidationMessage] = useState('');
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { complete } = useLocalSearchParams<{ complete?: string }>();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const completeParam = complete || route.params?.complete;
  const openEditParam = route.params?.openEdit;

  const router = useAppNavigation();

  useEffect(() => {
    if (user) {
      loadStudentProfile();
    }
  }, [user]);

  const loadStudentProfile = async () => {
    if (!user) return;
    const isBotOrAI = isAssistantUser(user);
    const defaultVal = isBotOrAI ? 'AI assistant' : 'Unset';
    const defaultPhone = isBotOrAI ? 'AI assistant' : '';

    const saved = await getStudentPersonalDetails(user._id);

    const school = (user.school && user.school !== 'Unset')
      ? user.school
      : (saved?.userId === user._id && saved.school && saved.school !== 'Unset' ? saved.school : defaultVal);

    const course = (user.course && user.course !== 'Unset')
      ? user.course
      : (saved?.userId === user._id && saved.course && saved.course !== 'Unset' ? saved.course : defaultVal);

    const yearOfStudy = (user.yearOfStudy && user.yearOfStudy !== 'Unset')
      ? user.yearOfStudy
      : (saved?.userId === user._id && saved.yearOfStudy && saved.yearOfStudy !== 'Unset' ? saved.yearOfStudy : defaultVal);

    const phone = user.phone || (saved?.userId === user._id ? saved.phone : '') || defaultPhone;
    const fullName = user.name || (saved?.userId === user._id ? saved.fullName : '') || (isCampusAIUser(user) ? 'Campus AI' : (isCampusBotUser(user) ? 'Campus Bot' : 'Moi Student'));
    const avatarUri = user.avatarUrl || (saved?.userId === user._id ? saved.avatarUri : undefined);

    setStudentDetails({
      userId: user._id,
      school,
      course,
      yearOfStudy,
      phone,
      fullName,
      avatarUri
    });
  };

  const handlePickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showIceMessage('Permission Needed', 'Permission to access your photo library is required to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const imageUri = result.assets[0].uri;
        setEditAvatarUri(imageUri);
      }
    } catch (err) {
      console.error('Error picking avatar image:', err);
      showIceMessage('Selection Error', 'Failed to pick image from storage.');
    }
  };

  const handleOpenEditModal = () => {
    const isBotOrAI = isAssistantUser(user);
    const defaultVal = isBotOrAI ? 'AI assistant' : '';
    const rawSchool = studentDetails.school || user?.school || '';
    const rawCourse = studentDetails.course || user?.course || '';
    const rawYear = studentDetails.yearOfStudy || user?.yearOfStudy || '';
    setEditSchool(rawSchool === 'Unset' ? defaultVal : (rawSchool || defaultVal));
    setEditUniversity(selectedUniversity?.name || user?.university || '');
    setEditCourse(rawCourse === 'Unset' ? defaultVal : (rawCourse || defaultVal));
    setEditYear(rawYear === 'Unset' ? defaultVal : (rawYear || defaultVal));
    setEditPhone(studentDetails.phone || user?.phone || (isBotOrAI ? 'AI assistant' : ''));
    setEditName(studentDetails.fullName || user?.name || (isCampusAIUser(user) ? 'Campus AI' : (isCampusBotUser(user) ? 'Campus Bot' : '')));
    setEditAvatarUri(studentDetails.avatarUri || user?.avatarUrl);
    setProfileValidationMessage('');
    setShowSchoolDropdown(false);
    setShowUniversityDropdown(false);
    setShowEditModal(true);
  };

  useEffect(() => {
    if ((openEditParam !== '1' && completeParam !== '1') || !user) return;
    const timer = setTimeout(() => {
      handleOpenEditModal();
      navigation.setParams({ openEdit: undefined, complete: undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [openEditParam, completeParam, user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    if (isAssistantUser(user)) {
      setProfileCompletionRequired(false);
      return;
    }
    const isIncomplete = (
      !user.course || user.course === 'Unset' ||
      !user.school || user.school === 'Unset' ||
      !user.yearOfStudy || user.yearOfStudy === 'Unset'
    );
    // Auto-open if profile is incomplete AND we haven't already auto-opened for this user
    if (isIncomplete && autoOpenedForUserId.current !== user._id) {
      autoOpenedForUserId.current = user._id;
      setProfileCompletionRequired(true);
      // Small delay so the screen has rendered first
      const t = setTimeout(() => handleOpenEditModal(), 300);
      return () => clearTimeout(t);
    }
    // If profile is now complete (user just saved), mark as done
    if (!isIncomplete) {
      autoOpenedForUserId.current = user._id;
      setProfileCompletionRequired(false);
    }
  }, [user?._id, user?.school, user?.course, user?.yearOfStudy, user?.email, user?.name]);

  const handleSaveProfileSubmit = async () => {
    const chosenUniversity = findKenyanUniversity(editUniversity);
    const missingFields = [
      !chosenUniversity ? 'university (choose one from the suggestions)' : '',
      (!editCourse.trim() || editCourse.trim().toLowerCase() === 'unset') ? 'course / degree program' : '',
      (!editSchool.trim() || editSchool.trim().toLowerCase() === 'unset') ? 'school / faculty' : '',
      (!editYear.trim() || editYear.trim().toLowerCase() === 'unset') ? 'year of study' : ''
    ].filter(Boolean);

    if (missingFields.length > 0) {
      const missingText = missingFields.length === 1
        ? missingFields[0]
        : `${missingFields.slice(0, -1).join(', ')} and ${missingFields[missingFields.length - 1]}`;
      setProfileValidationMessage(`Please set your ${missingText} before saving your profile.`);
      return;
    }

    setProfileValidationMessage('');
    setSavingProfile(true);
    const updated: StudentPersonalDetails = {
      userId: user?._id,
      school: editSchool.trim(),
      course: editCourse.trim(),
      yearOfStudy: editYear.trim(),
      phone: editPhone.trim(),
      fullName: editName.trim() || user?.name || 'Moi Student',
      avatarUri: editAvatarUri
    };

    try {
      let persistedAvatarUri = updated.avatarUri;
      if (persistedAvatarUri && !/^https?:\/\//i.test(persistedAvatarUri)) {
        const avatarFormData = new FormData();
        
        if (Platform.OS === 'web') {
          const response = await fetch(persistedAvatarUri);
          const blob = await response.blob();
          avatarFormData.append('file', blob, 'profile-avatar.jpg');
        } else {
          avatarFormData.append('file', {
            uri: persistedAvatarUri,
            name: 'profile-avatar.jpg',
            type: 'image/jpeg'
          } as any);
        }
        const avatarUpload = await apiRequest<{ avatarUrl: string }>('/auth/profile/avatar', {
          method: 'POST',
          body: avatarFormData
        });
        if (!avatarUpload.success || !avatarUpload.data?.avatarUrl) {
          throw new Error(avatarUpload.error || 'Could not upload your profile picture.');
        }
        persistedAvatarUri = avatarUpload.data.avatarUrl;
      }

      await updateUserProfile({
        name: updated.fullName,
        phone: updated.phone,
        school: updated.school,
        course: updated.course,
        yearOfStudy: updated.yearOfStudy,
        university: chosenUniversity!.name,
        ...(persistedAvatarUri ? { avatarUrl: persistedAvatarUri } : {})
      });
      if (chosenUniversity && selectedUniversity?.name !== chosenUniversity.name) {
        await selectUniversity(chosenUniversity);
      }
      const savedProfile = { ...updated, avatarUri: persistedAvatarUri };
      await saveStudentPersonalDetails(savedProfile);
      setStudentDetails(savedProfile);
      setProfileCompletionRequired(false);
      setShowEditModal(false);
      showIceMessage('Profile Updated', 'Your name and profile details were saved to your account and chat.');
      if (profileCompletionRequired) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      showIceMessage('Profile Update Failed', error?.message || 'Could not save your profile changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setAccountMenuVisible(false);
      setShowDeleteConfirm(false);
      setShowEditModal(false);
    }
  }, [user]);

  const handleLogout = async () => {
    setAccountMenuVisible(false);
    try {
      await logout();
    } finally {
      setAccountMenuVisible(false);
      router.replace('/(auth)/login');
    }
  };

  const handleOpenDeleteConfirm = () => {
    setAccountMenuVisible(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setShowDeleteConfirm(false);
      showIceMessage('Account Deleted', 'Your account and all stored local data have been permanently erased.');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        router.replace('/(auth)/login');
        setTimeout(() => {
          if (window.location && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }, 300);
      } else {
        router.replace('/(auth)/login');
      }
    } catch (e) {
      setIsDeletingAccount(false);
    }
  };

  const handleResetAlgorithm = async () => {
    await clearMaterialSearchHistory();
    showIceMessage('Algorithm Reset', 'Your saved material searches were cleared. Suggestions will now learn from fresh searches.');
  };

  if (!user) {
    return (
        <View style={[styles.container, isDark && { backgroundColor: colors.background }]}>
        <EmptyState title="Not Signed In" message="Log in or create a student account to manage your profile." />
        <Button title="Sign In to MConnect" onPress={() => router.push('/(auth)/login')} style={{ marginHorizontal: 24, marginTop: 16 }} />
      </View>
    );
  }

  const isAssistant = isAssistantUser(user);
  const assistantAvatar = getAssistantAvatarSource(user);
  const hasValidAvatarUri = !!(studentDetails.avatarUri && (
    studentDetails.avatarUri.startsWith('http://') ||
    studentDetails.avatarUri.startsWith('https://') ||
    studentDetails.avatarUri.startsWith('file://') ||
    studentDetails.avatarUri.startsWith('data:') ||
    studentDetails.avatarUri.startsWith('blob:')
  ));

  return (
    <ScrollView style={[styles.container, isDark && { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
      {/* Profile Avatar & Header Card */}
      <View style={[styles.userCard, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.avatarTouchContainer}
          onPress={handleOpenEditModal}
          activeOpacity={0.8}
        >
          {hasValidAvatarUri ? (
            <Image source={{ uri: studentDetails.avatarUri }} style={styles.avatarLargeImage} />
          ) : assistantAvatar ? (
            <Image source={assistantAvatar} style={styles.avatarLargeImage} />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{(studentDetails.fullName || user.name)[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.avatarCameraBadge}>
            <CameraIcon size={12} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, isDark && { color: colors.text }]}>{studentDetails.fullName || user.name}</Text>
            <UserBadge badge={user.badge} size={18} />
          </View>
          <Text style={[styles.userEmail, isDark && { color: colors.mutedText }]}>{user.email}</Text>
          <View style={styles.userBadgeRow}>
            {isAssistant ? (
              <Badge label="AI Assistant" variant="success" />
            ) : (
              <Badge label="Moi Student" variant="success" />
            )}
            {user.roles?.includes('landlord') && (
              <Badge label="Landlord" variant="warning" />
            )}
          </View>
        </View>

        <View style={styles.profileHeaderActions}>
          <TouchableOpacity style={styles.editBtnTop} onPress={handleOpenEditModal} activeOpacity={0.8}>
            <EditIcon color="#15803d" size={13} />
            <Text style={styles.editBtnTopText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileMoreBtn} onPress={() => setAccountMenuVisible(true)} accessibilityLabel="Account actions" accessibilityRole="button">
            <MoreVerticalIcon color="#15803d" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={accountMenuVisible} transparent animationType="fade" onRequestClose={() => setAccountMenuVisible(false)}>
        <Pressable style={styles.accountMenuBackdrop} onPress={() => setAccountMenuVisible(false)}>
        <Pressable style={[styles.accountMenu, isDark && { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <TouchableOpacity style={styles.accountMenuRow} onPress={() => { setAccountMenuVisible(false); router.push('/privacy'); }}>
              <ShieldCheckIcon color="#15803d" size={16} />
              <Text style={[styles.accountMenuText, isDark && { color: colors.text }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <View style={styles.accountMenuDivider} />
            <TouchableOpacity style={styles.accountMenuRow} onPress={() => { setAccountMenuVisible(false); router.push('/faq'); }}>
              <HelpCircleIcon color="#2563eb" size={16} />
              <Text style={[styles.accountMenuText, isDark && { color: colors.text }]}>FAQ & Support</Text>
            </TouchableOpacity>
            <View style={styles.accountMenuDivider} />
            <TouchableOpacity style={styles.accountMenuRow} onPress={handleLogout}>
              <LogOutIcon color="#64748b" size={16} />
              <Text style={[styles.accountMenuText, isDark && { color: colors.text }]}>Log out</Text>
            </TouchableOpacity>
            <View style={styles.accountMenuDivider} />
            <TouchableOpacity style={styles.accountMenuRow} onPress={handleOpenDeleteConfirm}>
              <TrashIcon color="#dc2626" size={16} />
              <Text style={styles.accountMenuDeleteText}>Delete account</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Centered Confirmation Popup for Account Deletion */}
      <DeleteAccountConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeleteAccount}
        userId={user._id}
        userName={studentDetails.fullName || user.name}
        userEmail={user.email}
        isDeleting={isDeletingAccount}
      />
      {/* Student Personal Details Card */}
      <View style={[styles.studentProfileCard, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <AcademicCapIcon color="#15803d" size={20} />
            <View>
              <Text style={[styles.cardTitle, isDark && { color: colors.text }]}>{isAssistant ? 'AI Assistant Profile' : 'Student Academic Profile'}</Text>
              <Text style={[styles.cardSub, isDark && { color: colors.mutedText }]}>{isAssistant ? 'Official MConnect Assistant Details' : 'Your campus details'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.detailsList, isDark && { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          {!isAssistant && <>
            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <AcademicCapIcon color="#15803d" size={18} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabelHeader, isDark && { color: colors.mutedText }]}>UNIVERSITY</Text>
                <Text style={[styles.detailValueText, isDark && { color: colors.text }]}>{selectedUniversity?.name || user.university || 'Select your university'}</Text>
              </View>
            </View>
            <View style={styles.detailItemDivider} />
          </>}
          {/* School / Faculty */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <HouseIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabelHeader, isDark && { color: colors.mutedText }]}>SCHOOL / FACULTY</Text>
              <Text style={[styles.detailValueText, isDark && { color: colors.text }]}>
                {studentDetails.school && studentDetails.school !== 'Unset' ? studentDetails.school : (isAssistant ? 'AI assistant' : 'Unset')}
              </Text>
            </View>
          </View>

          <View style={styles.detailItemDivider} />

          {/* Course / Program */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <BookIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabelHeader, isDark && { color: colors.mutedText }]}>COURSE / PROGRAM</Text>
              <Text style={[styles.detailValueBold, isDark && { color: '#4ade80' }]}>
                {studentDetails.course && studentDetails.course !== 'Unset' ? studentDetails.course : (isAssistant ? 'AI assistant' : 'Unset')}
              </Text>
            </View>
          </View>

          <View style={styles.detailItemDivider} />

          {/* Year of Study */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <CalendarIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabelHeader, isDark && { color: colors.mutedText }]}>YEAR OF STUDY</Text>
              <Text style={[styles.detailValueText, isDark && { color: colors.text }]}>
                {studentDetails.yearOfStudy && studentDetails.yearOfStudy !== 'Unset' ? studentDetails.yearOfStudy : (isAssistant ? 'AI assistant' : 'Unset')}
              </Text>
            </View>
          </View>

          <View style={styles.detailItemDivider} />

          {/* Phone Contact */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <PhoneIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabelHeader, isDark && { color: colors.mutedText }]}>PHONE CONTACT (OPTIONAL)</Text>
              <Text style={[styles.detailValueText, isDark && { color: colors.text }]}>
                {studentDetails.phone || (isAssistant ? 'AI assistant' : 'Unset')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.settingsCard, isDark && styles.darkCard]}>
        <View style={styles.settingsHeaderRow}>
          <View style={styles.settingsIcon}><Text style={styles.settingsIconText}>⚙</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingsTitle, isDark && styles.darkText]}>App Settings</Text>
            <Text style={[styles.settingsSubtitle, isDark && styles.darkMutedText]}>Make MConnect feel right for you</Text>
          </View>
        </View>
        <View style={[styles.settingsRow, isDark && styles.darkRow]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingsRowTitle, isDark && styles.darkText]}>Dark theme</Text>
            <Text style={[styles.settingsRowSubtitle, isDark && styles.darkMutedText]}>Use a comfortable dark appearance across the app</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleDarkTheme} trackColor={{ false: '#cbd5e1', true: '#15803d' }} thumbColor="#ffffff" />
        </View>
        <View style={[styles.resetAlgorithmRow, isDark && styles.darkRow]}>
          <View style={styles.resetAlgorithmInfo}>
            <Text style={[styles.resetAlgorithmTitle, isDark && styles.darkText]}>Recommendation algorithm</Text>
            <Text style={[styles.resetAlgorithmHint, isDark && styles.darkMutedText]}>Clear saved search interests and start fresh</Text>
          </View>
          <TouchableOpacity
            style={[styles.resetAlgorithmButton, isDark && styles.darkResetButton]}
            onPress={handleResetAlgorithm}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reset recommendation algorithm"
          >
            <Text style={[styles.resetAlgorithmText, isDark && styles.darkResetText]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Student Personal Details Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => { if (!profileCompletionRequired) setShowEditModal(false); }}>
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={[
              styles.modalContent,
              isDark && { backgroundColor: colors.surface },
              { paddingBottom: editModalBottomPadding }
            ]}
          >
            <View style={[styles.modalHeader, isDark && { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, isDark && { color: colors.text }]}>{isAssistant ? 'Edit Assistant Profile' : (profileCompletionRequired ? 'Complete Student Profile' : 'Edit Student Profile')}</Text>
              {!profileCompletionRequired && (
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <CloseIcon color={isDark ? colors.text : '#000000'} size={20} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, isDark && { color: colors.text }]}>Profile Picture</Text>
              <View style={[styles.editPhotoRow, isDark && { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                {editAvatarUri && (editAvatarUri.startsWith('http://') || editAvatarUri.startsWith('https://') || editAvatarUri.startsWith('file://') || editAvatarUri.startsWith('data:') || editAvatarUri.startsWith('blob:')) ? (
                  <Image source={{ uri: editAvatarUri }} style={styles.editAvatarImage} />
                ) : assistantAvatar ? (
                  <Image source={assistantAvatar} style={styles.editAvatarImage} />
                ) : (
                  <View style={styles.editAvatarFallback}>
                    <Text style={styles.editAvatarFallbackText}>{(editName || user?.name || 'M')[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.editPhotoInfo}>
                  <Text style={[styles.editPhotoTitle, isDark && { color: colors.text }]}>Add a clear profile photo</Text>
                  <Text style={[styles.editPhotoHint, isDark && { color: colors.mutedText }]}>Use a square image for the best result.</Text>
                  <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickProfileImage} activeOpacity={0.8}>
                    <CameraIcon color="#ffffff" size={14} />
                    <Text style={styles.changePhotoText}>Choose image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, isDark && { color: colors.text }]}>Full Student Name</Text>
              <TextInput
                style={[styles.textInput, isDark && { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Amani Kibet"
                placeholderTextColor="#94a3b8"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, isDark && { color: colors.text }]}>University</Text>
              <TextInput
                style={[styles.textInput, isDark && { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="Type to search your university"
                placeholderTextColor="#94a3b8"
                value={editUniversity}
                onFocus={() => setShowUniversityDropdown(true)}
                onChangeText={(value) => {
                  setEditUniversity(value);
                  setShowUniversityDropdown(true);
                }}
                autoCapitalize="words"
              />
              {showUniversityDropdown && (
                <ScrollView style={[styles.dropdownMenu, isDark && { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} nestedScrollEnabled keyboardShouldPersistTaps="always">
                  {filteredUniversities.map((university) => {
                    const isSelected = editUniversity.trim().toLowerCase() === university.name.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={university.name}
                        style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                        onPress={() => {
                          setEditUniversity(university.name);
                          setShowUniversityDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownMenuItemText, isDark && { color: colors.text }, isSelected && styles.dropdownMenuItemTextActive]}>
                          {university.name}
                        </Text>
                        {isSelected && <Text style={{ color: '#15803d', fontWeight: '800' }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                  {filteredUniversities.length === 0 && (
                    <Text style={[styles.dropdownMenuItemText, { padding: 14 }, isDark && { color: colors.mutedText }]}>No university found. Try its abbreviation.</Text>
                  )}
                </ScrollView>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, isDark && { color: colors.text }]}>Course / Degree Program <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput
                style={[styles.textInput, isDark && { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. BSc. Computer Science"
                placeholderTextColor="#94a3b8"
                value={editCourse}
                onChangeText={(value) => {
                  setEditCourse(value);
                  if (profileValidationMessage) setProfileValidationMessage('');
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, isDark && { color: colors.text }]}>Select School / Faculty</Text>
              <TextInput
                style={[styles.textInput, isDark && { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="Type to search or enter your school/faculty"
                placeholderTextColor="#94a3b8"
                value={editSchool}
                onFocus={() => setShowSchoolDropdown(true)}
                onChangeText={(value) => {
                  setEditSchool(value);
                  setShowSchoolDropdown(true);
                  if (profileValidationMessage) setProfileValidationMessage('');
                }}
              />
              {showSchoolDropdown && (
                <ScrollView style={[styles.dropdownMenu, isDark && { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} nestedScrollEnabled keyboardShouldPersistTaps="always">
                  {filteredSchoolOptions.map((school) => {
                    const isSelected = editSchool.trim().toLowerCase() === school.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={school}
                        style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                        onPress={() => {
                          setEditSchool(school);
                          if (profileValidationMessage) setProfileValidationMessage('');
                          setShowSchoolDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownMenuItemText, isDark && { color: colors.text }, isSelected && styles.dropdownMenuItemTextActive]}>
                          {school}
                        </Text>
                        {isSelected && <Text style={{ color: '#15803d', fontWeight: '800' }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                  {editSchool.trim().length > 0 && !hasExactSchoolMatch && (
                    <TouchableOpacity
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        if (profileValidationMessage) setProfileValidationMessage('');
                        setShowSchoolDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownMenuItemText, isDark && { color: colors.text }]}>
                        Use custom: “{editSchool.trim()}”
                      </Text>
                    </TouchableOpacity>
                  )}
                  {filteredSchoolOptions.length === 0 && editSchool.trim().length === 0 && (
                    <Text style={[styles.dropdownMenuItemText, { padding: 14 }, isDark && { color: colors.mutedText }]}>Start typing to search.</Text>
                  )}
                </ScrollView>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, isDark && { color: colors.text }]}>Year of Study</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {YEARS_LIST.map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.chip, isDark && editYear !== yr && { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, editYear === yr && styles.chipActive]}
                     onPress={() => {
                       setEditYear(yr);
                       if (profileValidationMessage) setProfileValidationMessage('');
                     }}
                  >
                    <Text style={[styles.chipText, isDark && editYear !== yr && { color: colors.text }, editYear === yr && styles.chipTextActive]}>{yr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, isDark && { color: colors.text }]}>Phone Contact Number (Optional)</Text>
              <TextInput
                style={[styles.textInput, isDark && { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. 0712 345 678"
                placeholderTextColor="#94a3b8"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />
            </View>

            {profileValidationMessage ? (
              <View style={[styles.profileValidationBox, isDark && { backgroundColor: '#3b1f29', borderColor: '#6b2737' }]}>
                <Text style={styles.profileValidationText}>{profileValidationMessage}</Text>
              </View>
            ) : null}

            <Button
              title="Save Student Profile"
              onPress={handleSaveProfileSubmit}
              loading={savingProfile}
              style={{ marginTop: 14 }}
            />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 40
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
  avatarTouchContainer: {
    position: 'relative',
    marginRight: 14
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff'
  },
  avatarLargeImage: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#15803d',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  userInfo: {
    flex: 1
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b'
  },
  userBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  completeProfileLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  profileHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  profileMoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  editBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignSelf: 'flex-start'
  },
  editBtnTopText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  accountMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.18)'
  },
  accountMenu: {
    position: 'absolute',
    top: 82,
    right: 16,
    width: 190,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8
  },
  accountMenuRow: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9
  },
  accountMenuText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700'
  },
  accountMenuDeleteText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800'
  },
  accountMenuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 10
  },
  studentProfileCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    elevation: 2
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  cardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  detailsList: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 4
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailTextContainer: {
    flex: 1
  },
  detailLabelHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    lineHeight: 18
  },
  detailValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18
  },
  detailItemDivider: {
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  privacyCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0'
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
  editPhotoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, gap: 12 },
  editAvatarImage: { width: 64, height: 64, borderRadius: 32 },
  editAvatarFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center' },
  editAvatarFallbackText: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  editPhotoInfo: { flex: 1 },
  editPhotoTitle: { color: '#0f172a', fontSize: 13, fontWeight: '800' },
  editPhotoHint: { color: '#64748b', fontSize: 11, marginTop: 2, marginBottom: 7 },
  changePhotoBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#15803d', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 },
  changePhotoText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  formGroup: {
    marginBottom: 14
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
  } as any,
  profileValidationBox: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14
  },
  profileValidationText: {
    color: '#be123c',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  dropdownSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 8
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 3
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  dropdownMenuItemActive: {
    backgroundColor: '#f0fdf4'
  },
  dropdownMenuItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1
  },
  dropdownMenuItemTextActive: {
    color: '#15803d',
    fontWeight: '700'
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  chipActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  tinyLogoutContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16
  },
  tinyLogoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tinyLogoutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8'
  },
  tinyDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  tinyDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626'
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 16
  },
  settingsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  settingsIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  settingsIconText: { color: '#15803d', fontSize: 18 },
  settingsTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  settingsSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  settingsRowTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  settingsRowSubtitle: { fontSize: 11, color: '#64748b', marginTop: 3, paddingRight: 12 },
  resetAlgorithmRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginTop: 12 },
  resetAlgorithmInfo: { flex: 1 },
  resetAlgorithmTitle: { color: '#0f172a', fontSize: 12, fontWeight: '800' },
  resetAlgorithmButton: { minWidth: 68, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  resetAlgorithmText: { color: '#15803d', fontSize: 12, fontWeight: '800' },
  resetAlgorithmHint: { color: '#64748b', fontSize: 10, marginTop: 3 },
  darkContainer: { backgroundColor: '#0f172a' },
  darkCard: { backgroundColor: '#172033', borderColor: '#334155' },
  darkRow: { borderTopColor: '#334155' },
  darkText: { color: '#f8fafc' },
  darkMutedText: { color: '#cbd5e1' },
  darkResetButton: { backgroundColor: '#1e293b', borderColor: '#475569' },
  darkResetText: { color: '#86efac' }
});


