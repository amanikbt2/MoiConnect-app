import { showIceMessage } from '../../src/components/IceMessageCard';
import React, { useState, useEffect } from 'react';
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
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import {
  getStudentPersonalDetails,
  saveStudentPersonalDetails,
  StudentPersonalDetails
} from '../../src/services/offlineStorage';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import {
  HouseIcon,
  ShieldCheckIcon,
  EditIcon,
  CameraIcon,
  AcademicCapIcon,
  IdCardIcon,
  CalendarIcon,
  CloseIcon,
  PhoneIcon,
  BookIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  TrashIcon,

} from '../../src/components/Icons';

const MOI_SCHOOLS_LIST = [
  'School of Information Sciences',
  'School of Science',
  'School of Engineering',
  'School of Law',
  'School of Business & Economics',
  'School of Education',
  'School of Arts & Social Sciences',
  'School of Medicine',
  'School of Nursing',
  'School of Public Health',
  'School of Agriculture'
];

const YEARS_LIST = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'];

export default function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const [studentDetails, setStudentDetails] = useState<StudentPersonalDetails>({
    admissionNumber: 'IS/0012/21',
    school: 'School of Information Sciences',
    course: 'BSc. Computer Science',
    yearOfStudy: 'Year 3',
    phone: '0712 345 678',
    fullName: user?.name || 'Moi Student'
  });

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [editAdmNo, setEditAdmNo] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editName, setEditName] = useState('');
  const [editAvatarUri, setEditAvatarUri] = useState<string | undefined>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);

  const router = useAppNavigation();

  useEffect(() => {
    if (user) {
      loadStudentProfile();
    }
  }, [user]);

  const loadStudentProfile = async () => {
    const saved = await getStudentPersonalDetails();
    if (saved) {
      setStudentDetails(saved);
    } else if (user) {
      setStudentDetails({
        admissionNumber: 'IS/0012/21',
        school: 'School of Information Sciences',
        course: 'BSc. Computer Science',
        yearOfStudy: 'Year 3',
        phone: '0712 345 678',
        fullName: user.name || 'Moi Student'
      });
    }
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
    setEditAdmNo(studentDetails.admissionNumber);
    setEditSchool(studentDetails.school);
    setEditCourse(studentDetails.course);
    setEditYear(studentDetails.yearOfStudy);
    setEditPhone(studentDetails.phone);
    setEditName(studentDetails.fullName || user?.name || '');
    setEditAvatarUri(studentDetails.avatarUri);
    setShowSchoolDropdown(false);
    setShowEditModal(true);
  };

  const handleSaveProfileSubmit = async () => {
    if (!editAdmNo.trim() || !editCourse.trim()) {
      showIceMessage('Incomplete Details', 'Please provide at least your Admission Number and Course of Study.');
      return;
    }

    setSavingProfile(true);
    const updated: StudentPersonalDetails = {
      admissionNumber: editAdmNo.trim(),
      school: editSchool || MOI_SCHOOLS_LIST[0],
      course: editCourse.trim(),
      yearOfStudy: editYear || YEARS_LIST[2],
      phone: editPhone.trim(),
      fullName: editName.trim() || user?.name || 'Moi Student',
      avatarUri: editAvatarUri
    };

    await saveStudentPersonalDetails(updated);
    setStudentDetails(updated);
    setSavingProfile(false);
    setShowEditModal(false);
    showIceMessage('Profile Updated', 'Your personal student academic details have been updated successfully.');
  };

  const confirmDeleteAccount = () => {
    setAccountMenuVisible(false);
    Alert.alert(
      'Permanently Delete Account?',
      'This permanently deletes your profile, posts, uploaded materials, and personal data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: () => deleteAccount() }
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <EmptyState title="Not Signed In" message="Log in or create a student account to manage your profile." />
        <Button title="Sign In to MoiConnect" onPress={() => router.push('/(auth)/login')} style={{ marginHorizontal: 24, marginTop: 16 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Avatar & Header Card */}
      <View style={styles.userCard}>
        <TouchableOpacity
          style={styles.avatarTouchContainer}
          onPress={handleOpenEditModal}
          activeOpacity={0.8}
        >
          {studentDetails.avatarUri ? (
            <Image source={{ uri: studentDetails.avatarUri }} style={styles.avatarLargeImage} />
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
          <Text style={styles.userName}>{studentDetails.fullName || user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userBadgeRow}>
            <Badge label="Moi Student" variant="green" />
            {user.roles?.includes('landlord') && (
              <Badge label="Landlord" variant="gold" />
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
          <Pressable style={styles.accountMenu} onPress={(event) => event.stopPropagation()}>
            <TouchableOpacity style={styles.accountMenuRow} onPress={() => { setAccountMenuVisible(false); logout(); }}>
              <Text style={styles.accountMenuText}>Log out</Text>
            </TouchableOpacity>
            <View style={styles.accountMenuDivider} />
            <TouchableOpacity style={styles.accountMenuRow} onPress={confirmDeleteAccount}>
              <TrashIcon color="#dc2626" size={16} />
              <Text style={styles.accountMenuDeleteText}>Delete account</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      {/* Student Personal Details Card (Admission No, School, Year, Course) */}
      <View style={styles.studentProfileCard}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <AcademicCapIcon color="#15803d" size={20} />
            <View>
              <Text style={styles.cardTitle}>Student Academic Profile</Text>
              <Text style={styles.cardSub}>Official Moi University Campus Details</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsList}>
          {/* Admission Number */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <IdCardIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabelHeader}>ADMISSION NUMBER</Text>
              <Text style={styles.detailValueBold}>{studentDetails.admissionNumber || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.detailItemDivider} />

          {/* School / Faculty */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <HouseIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabelHeader}>SCHOOL / FACULTY</Text>
              <Text style={styles.detailValueText}>{studentDetails.school || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.detailItemDivider} />

          {/* Course / Program */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <BookIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabelHeader}>COURSE / PROGRAM</Text>
              <Text style={styles.detailValueBold}>{studentDetails.course || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.detailItemDivider} />

          {/* Year of Study */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <CalendarIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabelHeader}>YEAR OF STUDY</Text>
              <Text style={styles.detailValueText}>{studentDetails.yearOfStudy || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.detailItemDivider} />

          {/* Phone Contact */}
          <View style={styles.detailItem}>
            <View style={styles.detailIconBox}>
              <PhoneIcon color="#15803d" size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabelHeader}>PHONE CONTACT</Text>
              <Text style={styles.detailValueText}>{studentDetails.phone || 'Not set'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Edit Student Personal Details Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Student Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <CloseIcon color="#ef4444" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Profile Picture</Text>
              <View style={styles.editPhotoRow}>
                {editAvatarUri ? (
                  <Image source={{ uri: editAvatarUri }} style={styles.editAvatarImage} />
                ) : (
                  <View style={styles.editAvatarFallback}>
                    <Text style={styles.editAvatarFallbackText}>{(editName || user?.name || 'M')[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.editPhotoInfo}>
                  <Text style={styles.editPhotoTitle}>Add a clear profile photo</Text>
                  <Text style={styles.editPhotoHint}>Use a square image for the best result.</Text>
                  <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickProfileImage} activeOpacity={0.8}>
                    <CameraIcon color="#ffffff" size={14} />
                    <Text style={styles.changePhotoText}>Choose image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Student Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Amani Kibet"
                placeholderTextColor="#94a3b8"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Admission Number <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. IS/0012/21 or COM/0042/22"
                placeholderTextColor="#94a3b8"
                value={editAdmNo}
                onChangeText={setEditAdmNo}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Course / Degree Program <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. BSc. Computer Science"
                placeholderTextColor="#94a3b8"
                value={editCourse}
                onChangeText={setEditCourse}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select School / Faculty</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowSchoolDropdown(!showSchoolDropdown)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                  {editSchool || 'Select your school/faculty...'}
                </Text>
                <ChevronDownIcon color="#64748b" size={18} />
              </TouchableOpacity>

              {showSchoolDropdown && (
                <View style={styles.dropdownMenu}>
                  {MOI_SCHOOLS_LIST.map((sch) => {
                    const isSelected = editSchool === sch;
                    return (
                      <TouchableOpacity
                        key={sch}
                        style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                        onPress={() => {
                          setEditSchool(sch);
                          setShowSchoolDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextActive]}>
                          {sch}
                        </Text>
                        {isSelected && <Text style={{ color: '#15803d', fontWeight: '800' }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Year of Study</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {YEARS_LIST.map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.chip, editYear === yr && styles.chipActive]}
                    onPress={() => setEditYear(yr)}
                  >
                    <Text style={[styles.chipText, editYear === yr && styles.chipTextActive]}>{yr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Contact Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 0712 345 678"
                placeholderTextColor="#94a3b8"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />
            </View>

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
  }
});

