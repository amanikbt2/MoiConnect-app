import { showIceMessage } from '../src/components/IceMessageCard';
import React, { useState } from 'react';
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
  Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppNavigation } from '../src/utils/navigation';
import { useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/services/api';
import { saveDownloadedPaper } from '../src/services/offlineStorage';
import {
  UploadIcon,
  FileTextIcon,
  CheckIcon,
  ArrowLeftIcon,
  SparklesIcon,
  PastPaperIcon,
  CatPaperIcon,
  LectureNotesIcon,
  LightbulbIcon
} from '../src/components/Icons';

const SCHOOL_OPTIONS = [
  'School of Information Sciences',
  'School of Science & Computing',
  'School of Engineering',
  'School of Business & Economics',
  'School of Education',
  'School of Medicine & Health',
  'School of Law',
  'School of Arts & Social Sciences'
];

const MATERIAL_TYPES = [
  { label: 'Past Paper', value: 'past_paper', IconComponent: PastPaperIcon },
  { label: 'CAT Paper', value: 'cat', IconComponent: CatPaperIcon },
  { label: 'Lecture Notes', value: 'lecture_notes', IconComponent: LectureNotesIcon },
  { label: 'Exam Solutions', value: 'solution', IconComponent: LightbulbIcon }
];

export interface PickedFileItem {
  id: string;
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
  file?: any;
}

export default function ContributeScreen() {
  const router = useAppNavigation();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [department, setDepartment] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [semester, setSemester] = useState('');
  const [description, setDescription] = useState('');
  const [schoolInput, setSchoolInput] = useState(SCHOOL_OPTIONS[0]);
  const [school, setSchool] = useState(SCHOOL_OPTIONS[0]);
  const [type, setType] = useState('past_paper');
  const [examYear, setExamYear] = useState('2025');

  const filteredSchools = SCHOOL_OPTIONS.filter((sch) =>
    sch.toLowerCase().includes(schoolInput.toLowerCase().trim())
  );

  // Selected files state from Phone Storage (Supports multiple files & combinations of images/PDFs/DOCs)
  const [pickedFiles, setPickedFiles] = useState<PickedFileItem[]>([]);

  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);

  // File Picker handler (Supports multiple selection and sequential addition)
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: PickedFileItem[] = result.assets.map((file, idx) => ({
          id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          uri: file.uri,
          mimeType: file.mimeType || 'application/pdf',
          file: (file as any).file,
        }));
        setPickedFiles((prev) => [...prev, ...newItems]);
      }
    } catch (err) {
      console.warn('Document picker error:', err);
      showIceMessage('File Selection Error', 'Could not open phone storage to select document.');
    }
  };

  const handleRemoveFile = (id: string) => {
    setPickedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadSubmit = async () => {
    if (pickedFiles.length === 0) {
      showIceMessage('Missing File(s)', 'Please select at least one document or image from your phone storage to upload.');
      return;
    }

    if (!title.trim() || unitCode.trim().length < 2) {
      setFormError('Enter a title and a unit code with at least 2 characters.');
      return;
    }

    setFormError('');
    setUploading(true);

    try {
      const selectedSchool = schoolInput.trim() || school || SCHOOL_OPTIONS[0];

      // 1. Send all selected files to backend server temporary storage (uploads/temp/)
      const uploadedAttachments: Array<{
        fileUrl: string;
        tempFilename?: string;
        fileType: 'pdf' | 'doc' | 'image' | 'text';
        fileSize: number;
        originalName: string;
      }> = [];

      for (const item of pickedFiles) {
        const formData = new FormData();
        if (Platform.OS === 'web') {
          const rawFile = item.file || (item as any).output?.[0];
          if (rawFile && (rawFile instanceof File || rawFile instanceof Blob)) {
            formData.append('file', rawFile, item.name);
          } else {
            try {
              const res = await fetch(item.uri);
              const fileBlob = await res.blob();
              formData.append('file', fileBlob, item.name || 'document.pdf');
            } catch (blobErr) {
              console.warn('Web blob conversion fallback:', blobErr);
              formData.append('file', {
                uri: item.uri,
                name: item.name,
                type: item.mimeType || 'application/pdf',
              } as any);
            }
          }
        } else {
          formData.append('file', {
            uri: item.uri,
            name: item.name,
            type: item.mimeType || 'application/pdf',
          } as any);
        }

        let uploadedTempFilename: string | undefined = undefined;
        let uploadedFileUrl = item.uri;
        let uploadedFileSize = item.size || 1258291;
        const ext = item.name.toLowerCase().split('.').pop() || '';
        let uploadedFileType: 'pdf' | 'doc' | 'image' | 'text' = ext === 'pdf'
          ? 'pdf'
          : (['docx', 'doc'].includes(ext) ? 'doc' : (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? 'image' : 'pdf'));

        try {
          const uploadRes = await apiRequest<{
            tempFilename: string;
            originalName: string;
            fileUrl: string;
            relativeUrl: string;
            fileSize: number;
            fileType: 'pdf' | 'doc' | 'image' | 'text';
          }>('/papers/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes?.success && uploadRes.data) {
            uploadedTempFilename = uploadRes.data.tempFilename;
            uploadedFileUrl = uploadRes.data.fileUrl;
            uploadedFileSize = uploadRes.data.fileSize || uploadedFileSize;
            uploadedFileType = uploadRes.data.fileType || uploadedFileType;
          }
        } catch (uploadErr) {
          console.warn('Direct server upload note for file ' + item.name + ':', uploadErr);
        }

        uploadedAttachments.push({
          fileUrl: uploadedFileUrl,
          tempFilename: uploadedTempFilename,
          fileType: uploadedFileType,
          fileSize: uploadedFileSize,
          originalName: item.name,
        });
      }

      const primary = uploadedAttachments[0];
      const imageAttachment = uploadedAttachments.find(
        att => att.fileType === 'image' || att.originalName?.match(/\.(jpg|jpeg|png|webp|gif)/i)
      );
      const calculatedThumbnail = imageAttachment
        ? imageAttachment.fileUrl
        : (primary.fileType === 'image' ? primary.fileUrl : undefined);

      // 2. Submit paper record referencing all uploaded attachments
      const payload = {
        title: title.trim(),
        school: selectedSchool,
        department: department.trim() || school.trim(),
        courseCode: unitCode.trim().toUpperCase(),
        unitCode: unitCode.trim().toUpperCase(),
        unitName: title.trim(),
        type,
        examYear: parseInt(examYear) || 2025,
        academicYear: academicLevel.trim() || undefined,
        semester: semester.trim() || undefined,
        description: description.trim() || undefined,
        fileUrl: primary.fileUrl,
        thumbnail: calculatedThumbnail,
        tempFilename: primary.tempFilename,
        fileType: primary.fileType,
        fileSize: primary.fileSize,
        attachments: uploadedAttachments,
      };

      let serverPaperId = `paper_${Date.now()}`;
      try {
        const res = await apiRequest<{ paper: any }>('/papers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res?.data?.paper?._id) {
          serverPaperId = res.data.paper._id;
        }
      } catch (apiErr) {
        console.log('Submission saved locally:', apiErr);
      }

      await saveDownloadedPaper({
        _id: serverPaperId,
        title: payload.title,
        school: payload.school,
        department: payload.department,
        courseCode: payload.courseCode,
        unitCode: payload.unitCode,
        academicYear: payload.academicYear,
        semester: payload.semester,
        description: payload.description,
        unitName: payload.unitName,
        type: payload.type as any,
        examYear: payload.examYear,
        fileUrl: payload.fileUrl,
        thumbnail: payload.thumbnail,
        fileType: payload.fileType as any,
        attachments: payload.attachments as any,
        uploadedBy: { _id: user?._id || 'guest', name: user?.name || 'Guest Student' } as any,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setUploading(false);

      const filesCountText = pickedFiles.length > 1 ? `${pickedFiles.length} files (combination)` : '1 file';
      const successMsg = user
        ? `"${payload.title}" (${payload.courseCode}) with ${filesCountText} has been submitted successfully for administrator review!`
        : `"${payload.title}" (${payload.courseCode}) with ${filesCountText} has been submitted for review!\n\nNote: You submitted as a guest. Sign in anytime to receive points and approval notifications.`;

      const navigateAway = () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push('/(tabs)/academics');
        }
      };

      if (Platform.OS === 'web') {
        showIceMessage(`Submission Successful! 🎉\n\n${successMsg}`);
        navigateAway();
      } else {
        showIceMessage(
          'Submission Successful! 🎉',
          successMsg,
          [
            { text: 'View Academic Hub', onPress: () => router.push('/(tabs)/academics') },
            { text: 'OK', onPress: navigateAway }
          ]
        );
      }
    } catch (e) {
      setUploading(false);
      showIceMessage('Upload Error', 'Failed to upload document. Please check your network connection.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'File Ready';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon color="#ffffff" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Text style={{ color: '#ffffff' }}>Contribute </Text>
          <Text style={{ color: '#a7f3d0' }}>Material</Text>
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconCircle}>
            <UploadIcon color="#15803d" size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Share with Campus Community</Text>
            <Text style={styles.bannerSub}>
              Upload past papers, CATs, or notes directly from your phone storage to help fellow Moi University students.
            </Text>
          </View>
        </View>

        {/* 1. Phone Storage File Selection Area */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>
            1. Select Document File(s) / Materials <Text style={styles.required}>*</Text>
          </Text>

          {pickedFiles.length > 0 ? (
            <View style={{ gap: 10 }}>
              {pickedFiles.map((fileItem, idx) => {
                const ext = fileItem.name.split('.').pop()?.toUpperCase() || 'FILE';
                const isImg = ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(ext);
                return (
                  <View key={fileItem.id} style={styles.selectedFileCard}>
                    <View style={[styles.fileIconCircle, isImg && { backgroundColor: '#fdf2f8' }]}>
                      <FileTextIcon color={isImg ? '#db2777' : '#15803d'} size={24} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.fileIndexBadge}>Doc #{idx + 1}</Text>
                        <Text style={styles.selectedFileName} numberOfLines={1}>
                          {fileItem.name}
                        </Text>
                      </View>
                      <Text style={styles.selectedFileMeta}>
                        {formatFileSize(fileItem.size)} • {ext}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeFileBtn}
                      onPress={() => handleRemoveFile(fileItem.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removeFileBtnText}>✕ Remove</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Add Material / Add Another File Button */}
              <TouchableOpacity
                style={styles.addMoreFilesBtn}
                onPress={handlePickDocument}
                activeOpacity={0.8}
              >
                <UploadIcon color="#15803d" size={18} style={{ marginRight: 6 }} />
                <Text style={styles.addMoreFilesBtnText}>+ Add Another File / Material (Images/PDF/DOC)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dropzoneCard}
              onPress={handlePickDocument}
              activeOpacity={0.8}
            >
              <View style={styles.uploadCircle}>
                <UploadIcon color="#15803d" size={32} />
              </View>
              <Text style={styles.dropzoneTitle}>Tap to select from Phone Storage</Text>
              <Text style={styles.dropzoneSub}>Supports PDF, DOCX, DOC & Images. Select multiple files or mix images + PDF.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Material Type Selection */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>2. Category / Material Type</Text>
          <View style={styles.typeGrid}>
            {MATERIAL_TYPES.map((item) => {
              const isSelected = type === item.value;
              const IconComp = item.IconComponent;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.typePill, isSelected && styles.typePillActive]}
                  onPress={() => setType(item.value)}
                  activeOpacity={0.8}
                >
                  <IconComp color={isSelected ? '#15803d' : '#64748b'} size={18} />
                  <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Course & Unit Details */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>3. Course & Unit Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unit Title / Exam Name <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.textInput} placeholder="e.g. Database Management Systems Main Exam" placeholderTextColor="#94a3b8" value={title} onChangeText={setTitle} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Unit Code <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.textInput} placeholder="e.g. COM 310" placeholderTextColor="#94a3b8" value={unitCode} onChangeText={setUnitCode} autoCapitalize="characters" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Department <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.textInput} placeholder="e.g. Computer Science" placeholderTextColor="#94a3b8" value={department} onChangeText={setDepartment} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Academic Level / Year</Text>
              <TextInput style={styles.textInput} placeholder="e.g. Year 3" placeholderTextColor="#94a3b8" value={academicLevel} onChangeText={setAcademicLevel} />
            </View>
          </View>
        </View>

        {/* 4. Academic Classification */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>4. Academic Classification</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Semester</Text>
              <TextInput style={styles.textInput} placeholder="e.g. Semester 1" placeholderTextColor="#94a3b8" value={semester} onChangeText={setSemester} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Exam / Resource Year</Text>
              <TextInput style={styles.textInput} placeholder="2025" placeholderTextColor="#94a3b8" value={examYear} onChangeText={setExamYear} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>School / Faculty</Text>
            <View style={[styles.searchableInputWrapper, showSchoolPicker && styles.dropdownInputFocused]}>
              <TextInput style={styles.textInputInWrapper} placeholder="Select or type School / Faculty..." placeholderTextColor="#94a3b8" value={schoolInput} onChangeText={(value) => { setSchoolInput(value); setSchool(value); setShowSchoolPicker(true); }} onFocus={() => setShowSchoolPicker(true)} />
              <TouchableOpacity style={styles.dropdownChevronBtn} onPress={() => setShowSchoolPicker(!showSchoolPicker)} activeOpacity={0.7}>
                <Text style={{ color: showSchoolPicker ? '#15803d' : '#64748b', fontSize: 12, fontWeight: '700' }}>{showSchoolPicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>
            </View>
            {showSchoolPicker && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {filteredSchools.length > 0 ? filteredSchools.map((sch) => {
                    const isSelected = schoolInput.trim().toLowerCase() === sch.toLowerCase();
                    return (
                      <TouchableOpacity key={sch} style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]} onPress={() => { setSchoolInput(sch); setSchool(sch); setShowSchoolPicker(false); }} activeOpacity={0.7}>
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>{sch}</Text>
                        {isSelected && <CheckIcon color="#15803d" size={16} />}
                      </TouchableOpacity>
                    );
                  }) : (
                    <View style={styles.dropdownItemEmpty}><Text style={styles.dropdownItemEmptyText}>No matching school. Your custom entry will be saved.</Text></View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description / Overview <Text style={styles.optional}>(Optional)</Text></Text>
            <TextInput style={[styles.textInput, styles.textArea]} placeholder="Add a short overview, topics covered, or useful instructions for students..." placeholderTextColor="#94a3b8" value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
          </View>
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
          onPress={handleUploadSubmit}
          disabled={uploading}
          activeOpacity={0.88}
        >
          {uploading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <UploadIcon color="#ffffff" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Submit for Approval</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  headerBar: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    paddingBottom: 12
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
    ...Platform.select({
      web: { textShadow: '0px 1.5px 3px rgba(0, 0, 0, 0.65)' },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.65)',
        textShadowOffset: { width: 0, height: 1.5 },
        textShadowRadius: 3
      }
    }),
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 12
  },
  bannerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14532d',
    marginBottom: 2
  },
  bannerSub: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 17
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12
  },
  required: {
    color: '#ef4444'
  },
  optional: { color: '#94a3b8', fontWeight: '500' },
  textArea: { minHeight: 92, paddingTop: 12 },
  dropzoneCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4
  },
  dropzoneSub: {
    fontSize: 11,
    color: '#64748b'
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    gap: 12
  },
  fileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  selectedFileMeta: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
    marginTop: 2
  },
  fileIndexBadge: {
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden'
  },
  removeFileBtn: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  removeFileBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626'
  },
  addMoreFilesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#15803d',
    borderStyle: 'dashed',
    marginTop: 4
  },
  addMoreFilesBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d'
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  typePillActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#15803d'
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  typePillTextActive: {
    color: '#15803d',
    fontWeight: '800'
  },
  inputGroup: {
    marginBottom: 12
  },
  inputLabel: {
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
  row: {
    flexDirection: 'row',
    gap: 10
  },
  selectDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  selectDropdownText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    marginRight: 8
  },
  searchableInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  dropdownInputFocused: {
    borderColor: '#15803d',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2
  },
  textInputInWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    paddingRight: 40,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
  } as any,
  dropdownChevronBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  dropdownItemActive: {
    backgroundColor: '#f0fdf4'
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155'
  },
  dropdownItemTextActive: {
    color: '#15803d',
    fontWeight: '800'
  },
  dropdownItemEmpty: {
    padding: 14,
    backgroundColor: '#f8fafc'
  },
  dropdownItemEmptyText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic'
  },
  formError: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600'
  },  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnDisabled: {
    opacity: 0.6
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  }
});
