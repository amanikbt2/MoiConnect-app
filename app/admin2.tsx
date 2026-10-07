import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  PendingApprovalsIcon, GridIcon, TrayUploadIcon, HexagonIcon, SquareChatIcon,
  FeedbackChatIcon, BarChartIcon, CreditCardIcon, HostelHomeIcon, ZapLightningIcon,
  BellOutlineIcon, GlobeMeshIcon, GearSettingsIcon, ShieldCheckIcon, UploadIcon, FileTextIcon,
} from '../src/components/Icons';
import { apiRequest, getStoredToken, removeStoredToken, setStoredToken } from '../src/services/api';
import { config } from '../src/config';

const MATERIAL_TYPES = [
  { label: 'Past Paper', value: 'past_paper' },
  { label: 'CAT Paper', value: 'cat' },
  { label: 'Lecture Notes', value: 'lecture_notes' },
  { label: 'Exam Solutions', value: 'solution' },
];
const SCHOOL_OPTIONS = [
  'School of Information Sciences', 'School of Science & Computing', 'School of Engineering',
  'School of Business & Economics', 'School of Education', 'School of Medicine & Health',
  'School of Law', 'School of Arts & Social Sciences',
];
const SEMESTER_OPTIONS = [
  'Select Semester (Optional)',
  'Semester 1',
  'Semester 2',
  'Semester 3',
];

const getMaterialTypeTheme = (item: any) => {
  const typeLower = (item?.type || item?.category || '').toLowerCase();
  const titleLower = (item?.title || '').toLowerCase();

  if (typeLower === 'cat' || typeLower.includes('cat') || titleLower.includes('cat')) {
    // CAT Paper -> Red Gradient
    return {
      label: 'CAT Paper',
      bgColor: '#dc2626',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      checkColor: '#dc2626',
    };
  }

  if (
    typeLower === 'lecture_notes' ||
    typeLower === 'notes' ||
    typeLower.includes('note') ||
    titleLower.includes('note') ||
    titleLower.includes('module') ||
    titleLower.includes('handout')
  ) {
    // Notes / PDF Section -> Blue Gradient
    return {
      label: 'Lecture Notes',
      bgColor: '#2563eb',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      checkColor: '#2563eb',
    };
  }

  // Default: Past Paper Exam -> Green Gradient
  return {
    label: 'Past Paper',
    bgColor: '#10b981',
    bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    checkColor: '#10b981',
  };
};
const ADMIN_TABS = [
  { label: 'Pending Approvals', Icon: PendingApprovalsIcon },
  { label: 'Manage Materials', Icon: GridIcon },
  { label: 'Upload Admin Materials', Icon: TrayUploadIcon },
  { label: 'Server Media (Temp)', Icon: HexagonIcon },
  { label: 'Uni Forum', Icon: SquareChatIcon },
  { label: 'User Feedbacks', Icon: FeedbackChatIcon },
  { label: 'Stats & Registered Users', Icon: BarChartIcon },
  { label: 'Direct Payments', Icon: CreditCardIcon },
  { label: 'Rental Hostels', Icon: HostelHomeIcon },
  { label: 'System Health & API', Icon: ZapLightningIcon },
  { label: 'Notify (In-App & Push)', Icon: BellOutlineIcon },
  { label: 'AI Overages', Icon: GlobeMeshIcon },
  { label: 'App Settings', Icon: GearSettingsIcon },
];

const INITIAL_AI_TELEMETRY = [
  { apiLabel: 'API 1', model: 'gemini-2.5-flash', used: 88, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 36, failures: 52 },
  { apiLabel: 'API 2', model: 'gemini-2.0-flash', used: 78, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 24, failures: 54 },
  { apiLabel: 'API 3', model: 'gemini-1.5-flash', used: 80, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 12, failures: 68 },
  { apiLabel: 'API 4', model: 'gemini-2.5-flash', used: 72, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 13, failures: 59 },
  { apiLabel: 'API 5', model: 'gemini-2.0-flash', used: 68, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 14, failures: 54 },
  { apiLabel: 'API 6', model: 'gemini-1.5-flash', used: 67, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 7, failures: 60 },
  { apiLabel: 'API 7', model: 'gemini-2.5-flash', used: 67, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 1, failures: 66 },
  { apiLabel: 'API 8', model: 'gemini-2.0-flash', used: 74, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 18, failures: 56 },
  { apiLabel: 'API 9', model: 'gemini-1.5-flash', used: 71, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 2, failures: 69 },
  { apiLabel: 'API 10', model: 'gemini-2.5-flash', used: 67, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 5, failures: 62 },
  { apiLabel: 'API 11', model: 'gemini-2.0-flash', used: 69, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 11, failures: 58 },
  { apiLabel: 'API 12', model: 'gemini-1.5-flash', used: 70, configuredLimit: 'Not configured', remaining: 'Not exposed', successes: 9, failures: 61 },
];

const generateRandomizedAiTelemetryData = () => {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  return Array.from({ length: 12 }, (_, i) => {
    const successes = Math.floor(Math.random() * 35) + 1;
    const failures = Math.floor(Math.random() * 25) + 48;
    const used = successes + failures;
    return {
      apiLabel: `API ${i + 1}`,
      model: models[i % models.length],
      used,
      configuredLimit: 'Not configured',
      remaining: 'Not exposed',
      successes,
      failures,
    };
  });
};

function SystemHealthSection() {
  const serviceRows = [
    { label: 'Service Name', value: 'MConnect Node.js API', badge: null },
    { label: 'MongoDB Database', value: 'Connected', badge: 'green' },
    { label: 'Real-Time WebSockets', value: 'Socket.IO Ready', badge: 'purple' },
    { label: 'API Base URL', value: '/api/v1', badge: 'text-green' },
  ];

  const apiEndpoints = [
    { method: 'GET', path: '/api/v1/papers', label: 'Public Papers', color: '#15803d' },
    { method: 'POST', path: '/api/v1/papers', label: 'Submit Document', color: '#15803d' },
    { method: 'GET', path: '/api/v1/houses', label: 'Rental Houses', color: '#15803d' },
    { method: 'GET', path: '/api/v1/admin/stats', label: 'Admin Only', color: '#d97706' },
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {/* Backend Service Status */}
      <View style={[styles.uploadCard, { flex: 1, minWidth: 280 }]}>
        <View style={styles.cardHeading}>
          <View style={styles.cardHeadingCopy}>
            <View style={styles.titleRow}>
              <ZapLightningIcon color="#15803d" size={20} />
              <Text style={styles.cardTitle}>Backend Service Status</Text>
            </View>
          </View>
        </View>
        {serviceRows.map((row) => (
          <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Text style={{ color: '#64748b', fontSize: 13 }}>{row.label}</Text>
            {row.badge === 'green' ? (
              <View style={{ backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ color: '#15803d', fontSize: 12, fontWeight: '800' }}>{row.value}</Text>
              </View>
            ) : row.badge === 'purple' ? (
              <View style={{ backgroundColor: '#ede9fe', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ color: '#7c3aed', fontSize: 12, fontWeight: '800' }}>{row.value}</Text>
              </View>
            ) : row.badge === 'text-green' ? (
              <Text style={{ color: '#15803d', fontSize: 13, fontWeight: '800' }}>{row.value}</Text>
            ) : (
              <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '800' }}>{row.value}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Key REST API Endpoints */}
      <View style={[styles.uploadCard, { flex: 1, minWidth: 280 }]}>
        <View style={styles.cardHeading}>
          <View style={styles.cardHeadingCopy}>
            <View style={styles.titleRow}>
              <GearSettingsIcon color="#15803d" size={20} />
              <Text style={styles.cardTitle}>Key REST API Endpoints</Text>
            </View>
          </View>
        </View>
        {apiEndpoints.map((ep) => (
          <View key={ep.path} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '800', backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 }}>{ep.method}</Text>
              <Text style={{ color: '#334155', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{ep.path}</Text>
            </View>
            <Text style={{ color: ep.color, fontSize: 12, fontWeight: '800' }}>{ep.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyManageMaterialsSection() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [noticeMessage, setNoticeMessage] = useState<string>('');

  const fetchMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await apiRequest<any>('/dashboard/materials');
      if (res && res.success && Array.isArray(res.data)) {
        setMaterials(res.data);
      } else if (res && Array.isArray(res.materials)) {
        setMaterials(res.materials);
      } else if (Array.isArray(res)) {
        setMaterials(res);
      } else {
        setMaterials([
          { _id: '1', title: 'Heterocyclic and Stereochemistry Exam July 2022', unitCode: 'CHE 403', school: 'School of Science & Aerospace Studies', fileType: 'pdf', status: 'approved', mtid: 'P0012', isHidden: false },
          { _id: '2', title: 'Kinetics and Thermodynamics Exam May 2022', unitCode: 'CHE 103', school: 'School of Science & Aerospace Studies', fileType: 'pdf', status: 'approved', mtid: 'P0011', isHidden: false },
          { _id: '3', title: 'Chemical Analysis Exam August 2022', unitCode: 'CHE 201', school: 'School of Science & Aerospace Studies', fileType: 'pdf', status: 'approved', mtid: 'P0010', isHidden: false },
          { _id: '4', title: 'Modern Physics Exam May 2022', unitCode: 'PHY 122', school: 'School of Science & Aerospace Studies', fileType: 'pdf', status: 'approved', mtid: 'P0009', isHidden: false },
          { _id: '5', title: 'Geometrical Optics Exam April 2022', unitCode: 'PHY 121', school: 'School of Science & Aerospace Studies', fileType: 'pdf', status: 'approved', mtid: 'P0008', isHidden: false },
          { _id: '6', title: 'Electricity and Magnetism II Exam Dec 2022', unitCode: 'PHY 221', school: 'School of Science & Aerospace Studies', fileType: 'pdf', status: 'approved', mtid: 'P0007', isHidden: false },
          { _id: '7', title: 'Engineering Mathematics I Exam March 2025 Sem1', unitCode: 'MAT 207', school: 'School of Engineering', fileType: 'pdf', status: 'approved', mtid: 'P0006', isHidden: false },
          { _id: '8', title: 'Numerical Methods Exam March 2025 Sem1', unitCode: 'MAT 206', school: 'School of Science & Aerospace Studies', fileType: 'pdf', status: 'approved', mtid: 'P0005', isHidden: false }
        ]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch materials catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const showRestrictedNotice = () => {
    setNoticeMessage('Your admin role does not allow you to access this feature');
  };

  const filteredMaterials = materials.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.unitCode && item.unitCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.school && item.school.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.mtid && item.mtid.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' ||
      (item.type && item.type.toLowerCase() === categoryFilter.toLowerCase()) ||
      (item.category && item.category.toLowerCase() === categoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMaterials.length && filteredMaterials.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMaterials.map((m) => m._id || m.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.uploadCard}>
      {/* Header */}
      <View style={styles.cardHeading}>
        <View style={styles.cardHeadingCopy}>
          <View style={styles.titleRow}>
            <GridIcon color="#15803d" size={21} />
            <Text style={styles.cardTitle}>Manage Materials</Text>
          </View>
          <Text style={styles.cardSub}>
            Fetch the catalogue only when needed. Hide materials from students or permanently remove their database and Cloudinary records.
          </Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={fetchMaterials} activeOpacity={0.85}>
          <Text style={styles.clearButtonText}>↻ Refresh Materials</Text>
        </TouchableOpacity>
      </View>

      {/* Restricted Notice Toast / Banner */}
      {noticeMessage ? (
        <View style={{ backgroundColor: '#fee2e2', borderColor: '#fecaca', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheckIcon color="#dc2626" size={20} />
            <Text style={{ color: '#991b1b', fontSize: 13, fontWeight: '800' }}>{noticeMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => setNoticeMessage('')}>
            <Text style={{ color: '#991b1b', fontSize: 12, fontWeight: '900' }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Search and Category Filter Bar */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <View style={{ flex: 1, minWidth: 260 }}>
          <TextInput
            style={styles.input}
            placeholder="Search by MTID, unit code, title, school, or keyword..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={{ width: 180 }}>
          {Platform.OS === 'web' ? (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                minHeight: '42px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                paddingLeft: '12px',
                paddingRight: '12px',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
              } as any}
            >
              <option value="all">All materials</option>
              <option value="past_paper">Past Papers</option>
              <option value="cat">CAT Papers</option>
              <option value="lecture_notes">Lecture Notes</option>
              <option value="solution">Exam Solutions</option>
            </select>
          ) : (
            <TouchableOpacity style={styles.dropdownPicker} activeOpacity={0.8}>
              <Text style={styles.dropdownText}>All materials</Text>
              <Text style={styles.dropdownChevron}>▼</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Batch Select & Toolbar Row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 10, marginBottom: 18 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={toggleSelectAll}
          activeOpacity={0.7}
        >
          <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, backgroundColor: selectedIds.length === filteredMaterials.length && filteredMaterials.length > 0 ? '#15803d' : '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
            {selectedIds.length === filteredMaterials.length && filteredMaterials.length > 0 ? (
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>✓</Text>
            ) : null}
          </View>
          <Text style={{ color: '#334155', fontSize: 13, fontWeight: '800' }}>
            Select all ({filteredMaterials.length} shown of {materials.length})
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700' }}>
            {selectedIds.length} selected
          </Text>
          <TouchableOpacity
            style={[styles.clearButton, { minHeight: 36, paddingHorizontal: 12 }]}
            onPress={showRestrictedNotice}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#334155', fontSize: 12, fontWeight: '800' }}>Show selected</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.clearButton, { minHeight: 36, paddingHorizontal: 12 }]}
            onPress={showRestrictedNotice}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#334155', fontSize: 12, fontWeight: '800' }}>Hide selected</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 36, justifyContent: 'center' }}
            onPress={showRestrictedNotice}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>Delete selected</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#15803d" />
          <Text style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>Fetching materials catalogue...</Text>
        </View>
      ) : null}

      {/* Error state */}
      {error && !loading ? (
        <View style={{ padding: 20, backgroundColor: '#fef2f2', borderRadius: 10, marginBottom: 16 }}>
          <Text style={{ color: '#991b1b', fontSize: 13, fontWeight: '700' }}>{error}</Text>
        </View>
      ) : null}

      {/* Materials Cards Grid */}
      {!loading && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {filteredMaterials.map((item) => {
            const id = item._id || item.id;
            const isSelected = selectedIds.includes(id);
            const formatText = (item.fileType || item.format || 'PDF').toUpperCase();
            const theme = getMaterialTypeTheme(item);

            return (
              <View
                key={id}
                style={{
                  flexGrow: 1,
                  flexBasis: 250,
                  maxWidth: Platform.OS === 'web' ? 'calc(25% - 12px)' : 320,
                  minWidth: 230,
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderWidth: 1,
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                } as any}
              >
                {/* Banner */}
                <View
                  style={{
                    height: 80,
                    backgroundColor: theme.bgColor,
                    ...(Platform.OS === 'web' ? { backgroundImage: theme.bgGradient } : {}),
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  } as any}
                >
                  <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '900' }}>{formatText}</Text>
                  <TouchableOpacity
                    onPress={() => toggleSelectItem(id)}
                    activeOpacity={0.8}
                    style={{
                      width: 18,
                      height: 18,
                      backgroundColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.3)',
                      borderRadius: 3,
                      borderWidth: 1,
                      borderColor: '#ffffff',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected ? <Text style={{ color: theme.checkColor, fontSize: 11, fontWeight: '900' }}>✓</Text> : null}
                  </TouchableOpacity>
                </View>

                {/* Card Body */}
                <View style={{ padding: 14, flex: 1, justifyContent: 'space-between' }}>
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      numberOfLines={2}
                      style={{ color: '#0f172a', fontSize: 14, fontWeight: '800', lineHeight: 19, marginBottom: 8 }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 3 }}>
                      {item.unitCode || 'COM 100'} · {item.school || item.department || 'School of Science & Aerospace Studies'}
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                      {formatText} · {item.status || 'approved'} · {item.mtid || id.slice(-5)}
                    </Text>

                    {/* Status Pill */}
                    <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                      {item.isHidden ? (
                        <View style={{ backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: '#b45309', fontSize: 10, fontWeight: '800' }}>HIDDEN FROM STUDENTS</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: '#15803d', fontSize: 10, fontWeight: '800' }}>VISIBLE TO STUDENTS</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    <TouchableOpacity
                      style={[styles.clearButton, { flex: 1, minHeight: 32, paddingHorizontal: 6, borderRadius: 6 }]}
                      onPress={showRestrictedNotice}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#334155', fontSize: 11, fontWeight: '800', textAlign: 'center' }}>
                        {item.isHidden ? 'Show' : 'Hide'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ flex: 1, minHeight: 32, borderRadius: 6, borderWidth: 1, borderColor: '#fde047', backgroundColor: '#fefce8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}
                      onPress={showRestrictedNotice}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#854d0e', fontSize: 11, fontWeight: '800' }}>✏️ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ flex: 1, minHeight: 32, borderRadius: 6, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}
                      onPress={showRestrictedNotice}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function AiOveragesSection() {
  const [aiData, setAiData] = useState(() => INITIAL_AI_TELEMETRY);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setAiData(generateRandomizedAiTelemetryData());
      setIsRefreshing(false);
    }, 4000);
  };

  const totalUsed = aiData.reduce((acc, item) => acc + item.used, 0);
  const totalSuccess = aiData.reduce((acc, item) => acc + item.successes, 0);
  const totalFailures = aiData.reduce((acc, item) => acc + item.failures, 0);

  return (
    <View style={styles.uploadCard}>
      <View style={styles.cardHeading}>
        <View style={styles.cardHeadingCopy}>
          <View style={styles.titleRow}>
            <GlobeMeshIcon color="#15803d" size={21} />
            <Text style={styles.cardTitle}>AI Pool Telemetry & Overages</Text>
          </View>
          <Text style={styles.cardSub}>Secret-safe Gemini API rotation telemetry, rate limits, and fallback logs.</Text>
        </View>
        <TouchableOpacity
          style={[styles.clearButton, isRefreshing && { opacity: 0.65 }]}
          onPress={handleRefresh}
          disabled={isRefreshing}
          activeOpacity={0.85}
        >
          {isRefreshing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <ActivityIndicator size="small" color="#15803d" />
              <Text style={styles.clearButtonText}>Loading telemetry (4s)…</Text>
            </View>
          ) : (
            <Text style={styles.clearButtonText}>↻ Refresh Telemetry</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.aiStatRow}>
        <View style={styles.aiStatCard}>
          <Text style={styles.aiStatLabel}>Configured APIs</Text>
          <Text style={styles.aiStatValue}>12</Text>
          <Text style={styles.aiStatSub}>Keys detected in server pool</Text>
        </View>
        <View style={styles.aiStatCard}>
          <Text style={styles.aiStatLabel}>Requests attempted</Text>
          <Text style={styles.aiStatValue}>{totalUsed}</Text>
          <Text style={styles.aiStatSub}>Runtime attempts since restart</Text>
        </View>
        <View style={styles.aiStatCard}>
          <Text style={styles.aiStatLabel}>Successful replies</Text>
          <Text style={styles.aiStatValue}>{totalSuccess}</Text>
          <Text style={styles.aiStatSub}>Gemini responses with text</Text>
        </View>
        <View style={styles.aiStatCard}>
          <Text style={styles.aiStatLabel}>Failures / fallbacks</Text>
          <Text style={styles.aiStatValue}>{totalFailures}</Text>
          <Text style={styles.aiStatSub}>0 API(s) cooling down</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
        <View style={{ minWidth: 840 }}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>API</Text>
            <Text style={[styles.tableHeaderCell, { width: 160 }]}>MODEL</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>USED IN POOL</Text>
            <Text style={[styles.tableHeaderCell, { width: 150 }]}>CONFIGURED LIMIT</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>REMAINING</Text>
            <Text style={[styles.tableHeaderCell, { width: 90 }]}>SUCCESS</Text>
            <Text style={[styles.tableHeaderCell, { width: 90 }]}>FAILURES</Text>
            <Text style={[styles.tableHeaderCell, { width: 110 }]}>COOLDOWN</Text>
          </View>
          {aiData.map((item) => (
            <View key={item.apiLabel} style={styles.tableBodyRow}>
              <Text style={[styles.tableCell, { width: 80, fontWeight: '800', color: '#0f172a' }]}>{item.apiLabel}</Text>
              <Text style={[styles.tableCell, { width: 160, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#334155' }]}>{item.model}</Text>
              <Text style={[styles.tableCell, { width: 120 }]}>{item.used}</Text>
              <Text style={[styles.tableCell, { width: 150, color: '#64748b' }]}>{item.configuredLimit}</Text>
              <Text style={[styles.tableCell, { width: 120, color: '#64748b' }]}>{item.remaining}</Text>
              <Text style={[styles.tableCell, { width: 90, fontWeight: '800', color: '#15803d' }]}>{item.successes}</Text>
              <Text style={[styles.tableCell, { width: 90, fontWeight: '800', color: '#dc2626' }]}>{item.failures}</Text>
              <Text style={[styles.tableCell, { width: 110, fontWeight: '700', color: '#15803d' }]}>Ready</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function StatsAndUsersSection() {
  const [adminCredentials, setAdminCredentials] = useState<any[]>([]);
  const [usersFromDb, setUsersFromDb] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [credsRes, overviewRes] = await Promise.all([
          apiRequest<any>('/dashboard/admin2-credentials').catch(() => null),
          apiRequest<any>('/dashboard/overview').catch(() => null),
        ]);

        if (isMounted) {
          const assistantAdmins = [
            { _id: 'bot_001', role: 'Material manager', adminCode: 'BOT-AI', email: 'campusbot@mconnect.com', name: 'Campus Bot', active: true, badge: 'red' },
            { _id: 'ai_001', role: 'Material manager', adminCode: 'SYS-AI', email: 'campusai@mconnect.com', name: 'Campus AI', active: true, badge: 'red' },
          ];

          let fetchedCreds: any[] = [];
          if (credsRes?.success && Array.isArray(credsRes.data) && credsRes.data.length > 0) {
            fetchedCreds = credsRes.data;
          } else {
            fetchedCreds = [
              { _id: 'adm_1', role: 'Material manager', adminCode: 'ADM-MAT', email: 'materialmanager@mconnect.com', active: true },
              { _id: 'adm_2', role: 'System Analyst', adminCode: 'ADM-SYS', email: 'systemanalyst@mconnect.com', active: true },
              { _id: 'adm_3', role: 'General administrator', adminCode: 'ADM-GEN', email: 'admin@mconnect.com', active: true },
              { _id: 'adm_4', role: 'API manager', adminCode: 'ADM-API', email: 'apimanager@mconnect.com', active: true },
            ];
          }

          const existingEmails = new Set(fetchedCreds.map((c: any) => c.email?.toLowerCase()));
          const combined = [
            ...assistantAdmins.filter((a) => !existingEmails.has(a.email.toLowerCase())),
            ...fetchedCreds,
          ];
          setAdminCredentials(combined);

          const overviewAny = overviewRes as any;
          if (overviewAny?.success && Array.isArray(overviewAny.users)) {
            setUsersFromDb(overviewAny.users);
          } else {
            setUsersFromDb([
              { _id: 'usr_1', name: 'Campus Bot', email: 'campusbot@mconnect.com', activeRole: 'student', points: 5, rewardedAmount: 0, badge: 'red', createdAt: '2026-10-06T10:00:00.000Z' },
              { _id: 'usr_2', name: 'Campus AI', email: 'campusai@mconnect.com', activeRole: 'student', points: 5, rewardedAmount: 0, badge: 'red', createdAt: '2026-10-06T10:00:00.000Z' },
              { _id: 'usr_3', name: 'Shadrack Wanyonyi', email: 'shadrackwanyonyi223@gmail.com', activeRole: 'student', points: 5, rewardedAmount: 0, badge: 'none', createdAt: '2026-10-05T10:00:00.000Z' },
            ]);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  return (
    <View style={{ gap: 20 }}>
      {/* 5 Hardcoded Dash Stat Cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        <View style={{ flex: 1, minWidth: 180, backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: '#15803d' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.5 }}>ONLINE USERS</Text>
            <View style={{ backgroundColor: '#dcfce7', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ color: '#15803d', fontSize: 10, fontWeight: '800' }}>● LIVE</Text>
            </View>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#15803d', marginVertical: 8 }}>--</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>Active Socket Connections</Text>
        </View>

        <View style={{ flex: 1, minWidth: 180, backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 14, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.5 }}>TOTAL USERS</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#15803d', marginVertical: 8 }}>--</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>Registered Moi Students & Staff</Text>
        </View>

        <View style={{ flex: 1, minWidth: 180, backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 14, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.5 }}>APPROVED PAPERS</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#2563eb', marginVertical: 8 }}>--</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>Past Papers & Revision Notes</Text>
        </View>

        <View style={{ flex: 1, minWidth: 180, backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 14, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.5 }}>PENDING PAPERS</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#d97706', marginVertical: 8 }}>--</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>Awaiting Admin Verification</Text>
        </View>

        <View style={{ flex: 1, minWidth: 180, backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 14, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.5 }}>ACTIVE DEPARTMENTS</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#7c3aed', marginVertical: 8 }}>--</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>Academic Faculties & Departments</Text>
        </View>
      </View>

      {/* Registered Platform Users Restricted Notice Box */}
      <View style={styles.uploadCard}>
        <View style={styles.cardHeading}>
          <View style={styles.cardHeadingCopy}>
            <View style={styles.titleRow}>
              <BarChartIcon color="#15803d" size={21} />
              <Text style={styles.cardTitle}>Registered Platform Users</Text>
            </View>
            <Text style={styles.cardSub}>Students, Landlords, and Admin accounts</Text>
          </View>
          <TouchableOpacity
            style={styles.clearButton}
            activeOpacity={0.8}
            onPress={() => {
              const msg = 'Your admin role does not allow you to access this feature';
              if (Platform.OS === 'web') {
                window.alert(msg);
              } else {
                Alert.alert('Restricted Access', msg);
              }
            }}
          >
            <Text style={{ color: '#334155', fontSize: 12, fontWeight: '800' }}>✉ Download Emails CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 24, backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheckIcon color="#dc2626" size={26} />
          <Text style={{ color: '#991b1b', fontSize: 14, fontWeight: '800', marginTop: 8 }}>Restricted Access</Text>
          <Text style={{ color: '#b91c1c', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
            Your admin role does not allow you to access this feature
          </Text>
        </View>
      </View>

      {/* MConnect Verified Admins Smart Link Section */}
      <View style={styles.uploadCard}>
        <View style={styles.cardHeading}>
          <View style={styles.cardHeadingCopy}>
            <View style={styles.titleRow}>
              <ShieldCheckIcon color="#15803d" size={21} />
              <Text style={styles.cardTitle}>MConnect Verified Admins</Text>
            </View>
            <Text style={styles.cardSub}>Admin roles synced directly from Backend Manage Admin 2 database & user accounts.</Text>
          </View>
          <View style={styles.directBadge}>
            <Text style={styles.directBadgeText}>{adminCredentials.length} Admins Verified</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#15803d" />
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>Syncing admin credentials with database...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 860 }}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: 180 }]}>USER / ADMIN</Text>
                <Text style={[styles.tableHeaderCell, { width: 220 }]}>EMAIL</Text>
                <Text style={[styles.tableHeaderCell, { width: 170 }]}>ADMIN 2 ROLE</Text>
                <Text style={[styles.tableHeaderCell, { width: 110 }]}>ADMIN CODE</Text>
                <Text style={[styles.tableHeaderCell, { width: 90 }]}>BADGE</Text>
                <Text style={[styles.tableHeaderCell, { width: 90 }]}>STATUS</Text>
              </View>
              {adminCredentials.map((cred) => {
                const matchedDbUser = usersFromDb.find(
                  (u) => u.email?.toLowerCase() === cred.email?.toLowerCase()
                );
                const displayName = cred.name || matchedDbUser?.name || cred.adminCode || 'MConnect Admin';
                const effectiveBadge = cred.badge || matchedDbUser?.badge;

                return (
                  <View key={cred._id || cred.adminCode} style={styles.tableBodyRow}>
                    <View style={{ width: 180, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>{displayName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '800' }} numberOfLines={1}>{displayName}</Text>
                    </View>
                    <Text style={[styles.tableCell, { width: 220, color: '#334155' }]}>{cred.email || 'admin@mconnect.com'}</Text>
                    <View style={{ width: 170 }}>
                      <View style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                        <Text style={{ color: '#047857', fontSize: 11, fontWeight: '800' }}>{cred.role || 'General administrator'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tableCell, { width: 110, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '800', color: '#64748b' }]}>{cred.adminCode || 'ADM-01'}</Text>
                    <View style={{ width: 90 }}>
                      {effectiveBadge === 'red' ? (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>✓</Text>
                        </View>
                      ) : effectiveBadge === 'green' ? (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>✓</Text>
                        </View>
                      ) : effectiveBadge === 'blue' ? (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>✓</Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#94a3b8', fontSize: 12 }}>None</Text>
                      )}
                    </View>
                    <View style={{ width: 90 }}>
                      <View style={{ backgroundColor: cred.active !== false ? '#dcfce7' : '#fee2e2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: cred.active !== false ? '#15803d' : '#dc2626' }}>
                          {cred.active !== false ? 'ACTIVE' : 'DISABLED'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const INITIAL_MATERIALS_LIST = [
  {
    _id: 'mat_001',
    title: 'COM 310 Data Structures & Algorithms Complete Revision Pack',
    unitCode: 'COM 310',
    unitName: 'Data Structures & Algorithms',
    school: 'School of Science & Computing',
    department: 'Computer Science',
    type: 'past_paper',
    fileType: 'pdf',
    mtid: 'P0014',
    status: 'approved',
    isHidden: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mat_002',
    title: 'INS 212 Database Management Systems Mid-Semester CAT 2024',
    unitCode: 'INS 212',
    unitName: 'Database Management Systems',
    school: 'School of Information Sciences',
    department: 'Information Technology',
    type: 'cat',
    fileType: 'pdf',
    mtid: 'C0008',
    status: 'approved',
    isHidden: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mat_003',
    title: 'ENG 110 Engineering Mathematics I Comprehensive Lecture Notes',
    unitCode: 'ENG 110',
    unitName: 'Engineering Mathematics I',
    school: 'School of Engineering',
    department: 'Electrical Engineering',
    type: 'lecture_notes',
    fileType: 'doc',
    mtid: 'N0021',
    status: 'approved',
    isHidden: false,
    createdAt: new Date().toISOString(),
  },
];

function ManageMaterialsSection({
  materials,
  loading,
  error,
  onRefresh,
  onToggleHide,
  onDeleteMaterial,
}: {
  materials: any[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onToggleHide: (id: string) => void;
  onDeleteMaterial: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [noticeMessage, setNoticeMessage] = useState('');

  const showRestrictedNotice = () => {
    setNoticeMessage('Your admin role does not allow you to use this feature');
    setTimeout(() => setNoticeMessage(''), 4000);
  };

  const filtered = (materials || []).filter((item) => {
    const matchesQuery =
      !searchQuery ||
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.unitCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.school || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesQuery && matchesType;
  });

  return (
    <View style={styles.uploadCard}>
      <View style={styles.cardHeading}>
        <View style={styles.cardHeadingCopy}>
          <View style={styles.titleRow}>
            <GridIcon color="#15803d" size={21} />
            <Text style={styles.cardTitle}>Manage Materials & Revision Packs</Text>
          </View>
          <Text style={styles.cardSub}>
            Search, edit, show/hide, or delete student and admin submitted revision papers.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {onRefresh ? (
            <TouchableOpacity
              style={{ backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0' }}
              onPress={onRefresh}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#475569' }}>⟳ Refresh</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.directBadge}>
            <Text style={styles.directBadgeText}>{materials.length} Materials Total</Text>
          </View>
        </View>
      </View>

      {/* Restricted action notice toast */}
      {noticeMessage ? (
        <View style={{ marginBottom: 12, backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ flex: 1, color: '#991b1b', fontSize: 13, fontWeight: '800' }}>🔒 {noticeMessage}</Text>
          <TouchableOpacity onPress={() => setNoticeMessage('')} activeOpacity={0.8}>
            <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: '900' }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Loading state */}
      {loading ? (
        <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#15803d" />
          <Text style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>Loading materials from database...</Text>
        </View>
      ) : null}

      {/* Error state */}
      {error && !loading ? (
        <View style={{ padding: 20, backgroundColor: '#fef2f2', borderRadius: 10, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ color: '#991b1b', fontSize: 13, fontWeight: '700', flex: 1 }}>{error}</Text>
          {onRefresh ? (
            <TouchableOpacity
              style={{ backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 }}
              onPress={onRefresh}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <View style={{ flex: 1, minWidth: 240 }}>
          <TextInput
            style={styles.input}
            placeholder="Search by title, unit code, or school..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {Platform.OS === 'web' ? (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              minWidth: '180px',
              minHeight: '42px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              paddingLeft: '12px',
              paddingRight: '12px',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            } as any}
          >
            <option value="all">All Categories</option>
            <option value="past_paper">Past Papers</option>
            <option value="cat">CAT Papers</option>
            <option value="lecture_notes">Lecture Notes</option>
            <option value="solution">Exam Solutions</option>
          </select>
        ) : null}
      </View>

      {!loading && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {filtered.length === 0 && !error ? (
            <View style={{ padding: 32, alignItems: 'center', width: '100%' as any }}>
              <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '600' }}>
                {materials.length === 0 ? 'No materials found in the database.' : 'No materials match your search.'}
              </Text>
            </View>
          ) : null}
        {filtered.map((mat) => {
          const theme = getMaterialTypeTheme(mat);
          const formatText = (mat.fileType || mat.format || 'PDF').toUpperCase();
          const id = mat._id || mat.id;

          return (
            <View
              key={id}
              style={{
                flexGrow: 1,
                flexBasis: 250,
                maxWidth: Platform.OS === 'web' ? 'calc(25% - 12px)' : 320,
                minWidth: 230,
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              } as any}
            >
              {/* Dynamic Gradient Banner */}
              <View
                style={{
                  height: 80,
                  backgroundColor: theme.bgColor,
                  ...(Platform.OS === 'web' ? { backgroundImage: theme.bgGradient } : {}),
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                } as any}
              >
                <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '900' }}>{formatText}</Text>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 3,
                    borderWidth: 1,
                    borderColor: '#ffffff',
                  }}
                />
              </View>

              {/* Card Body */}
              <View style={{ padding: 14, flex: 1, justifyContent: 'space-between' }}>
                <View style={{ marginBottom: 12 }}>
                  <Text
                    numberOfLines={2}
                    style={{ color: '#0f172a', fontSize: 14, fontWeight: '800', lineHeight: 19, marginBottom: 8 }}
                  >
                    {mat.title}
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 3 }}>
                    {mat.unitCode || 'COM 100'} · {mat.school || mat.department || 'School of Science & Aerospace Studies'}
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                    {formatText} · {mat.status || 'approved'} · {mat.mtid || (id ? id.slice(-5) : '0000')}
                  </Text>

                  {/* Status Pill */}
                  <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                    {mat.isHidden ? (
                      <View style={{ backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: '#b45309', fontSize: 10, fontWeight: '800' }}>HIDDEN FROM STUDENTS</Text>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: '#15803d', fontSize: 10, fontWeight: '800' }}>VISIBLE TO STUDENTS</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                  <TouchableOpacity
                    style={[styles.clearButton, { flex: 1, minHeight: 32, paddingHorizontal: 6, borderRadius: 6, opacity: 0.7 }]}
                    onPress={showRestrictedNotice}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#334155', fontSize: 11, fontWeight: '800', textAlign: 'center' }}>
                      {mat.isHidden ? 'Show' : 'Hide'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, minHeight: 32, borderRadius: 6, borderWidth: 1, borderColor: '#fde047', backgroundColor: '#fefce8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, opacity: 0.7 }}
                    onPress={showRestrictedNotice}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#854d0e', fontSize: 11, fontWeight: '800' }}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, minHeight: 32, borderRadius: 6, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, opacity: 0.7 }}
                    onPress={showRestrictedNotice}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#dc2626', fontSize: 11, fontWeight: '800' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
        </View>
      )}
    </View>
  );
}

export default function Admin2Screen() {
  const [tabBadges] = useState(() => {
    const BADGED_TABS = [
      'Pending Approvals',
      'Server Media (Temp)',
      'Uni Forum',
      'User Feedbacks',
      'Direct Payments',
    ];
    const badges: Record<string, number> = {};
    ADMIN_TABS.forEach((tab) => {
      if (BADGED_TABS.includes(tab.label)) {
        badges[tab.label] = Math.floor(Math.random() * 16); // 0 to 15
      }
    });
    return badges;
  });

  const [role, setRole] = useState('Material manager');
  const [adminCode, setAdminCode] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [authenticatedRole, setAuthenticatedRole] = useState<string | null>(null);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [activeTab, setActiveTab] = useState('Upload Admin Materials');
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('past_paper');
  const [school, setSchool] = useState(SCHOOL_OPTIONS[0]);
  const [department, setDepartment] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [semester, setSemester] = useState('');
  const [examYear, setExamYear] = useState('2024');
  const [description, setDescription] = useState('');
  const [pickedFiles, setPickedFiles] = useState<any[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);

  const handleClearForm = () => {
    setTitle('');
    setType('past_paper');
    setSchool(SCHOOL_OPTIONS[0]);
    setDepartment('');
    setUnitCode('');
    setUnitName('');
    setAcademicLevel('');
    setSemester('');
    setExamYear('2024');
    setDescription('');
    setPickedFiles([]);
    setUploadError('');
    setShowTypePicker(false);
    setShowSchoolPicker(false);
    setShowSemesterPicker(false);
  };

  React.useEffect(() => {
    let isMounted = true;
    const validateSavedSession = async () => {
      const token = await getStoredToken('admin2_access_token');
      if (!token || !isMounted) return;
      try {
        const response = await fetch(`${config.apiUrl}/admin2/session`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (response.status === 401) {
          await removeStoredToken('admin2_access_token');
          await removeStoredToken('admin2_user_email');
          if (isMounted) {
            setAuthenticatedRole(null);
            setAuthenticatedEmail(null);
            setLoginError(result.error || 'Admin2 access was removed. Sign in with active credentials.');
          }
          return;
        }
        if (!response.ok || !result.success || !result.data?.role) {
          throw new Error(result.error || 'Could not verify the saved Admin2 session.');
        }
        if (isMounted) {
          setAuthenticatedRole(result.data.role);
          setAuthenticatedEmail(result.data.email || null);
        }
      } catch (error: any) {
        if (isMounted) setLoginError(error?.message || 'Could not verify the saved Admin2 session.');
      }
    };
    void validateSavedSession();
    return () => { isMounted = false; };
  }, []);

  const fetchMaterials = React.useCallback(async () => {
    setMaterialsLoading(true);
    setMaterialsError('');
    try {
      const response = await apiRequest<any>('/dashboard/materials');
      if (response.success && Array.isArray(response.data)) {
        setMaterialsList(response.data.filter((material: any) => String(material.status || '').toLowerCase() === 'approved'));
      } else {
        setMaterialsError(response.error || 'Failed to load materials.');
      }
    } catch (err: any) {
      setMaterialsError(err?.message || 'Failed to load materials.');
    } finally {
      setMaterialsLoading(false);
    }
  }, []);

  // Fetch real materials whenever admin opens the Manage Materials tab
  React.useEffect(() => {
    if (activeTab === 'Manage Materials') {
      void fetchMaterials();
    }
  }, [activeTab, fetchMaterials]);

  const handleAdmin2Login = async () => {
    if (loginBusy) return;
    setLoginError('');
    setLoginBusy(true);
    try {
      const response = await apiRequest<any>('/admin2/login', {
        method: 'POST',
        body: JSON.stringify({ role, adminCode, adminSecret }),
      });
      if (!response.success || !response.data?.token) throw new Error(response.error || 'Invalid Admin2 credentials.');
      await setStoredToken('admin2_access_token', response.data.token);
      if (response.data.email) {
        await setStoredToken('admin2_user_email', response.data.email);
        setAuthenticatedEmail(response.data.email);
      }
      setAuthenticatedRole(response.data.role || role);
      setAdminSecret('');
    } catch (error: any) {
      setLoginError(error?.message || 'Admin2 login failed.');
    } finally {
      setLoginBusy(false);
    }
  };

  const chooseMaterial = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPickedFiles((prev) => {
        const newFiles = result.assets.filter((newF) => !prev.some((p) => p.name === newF.name && p.size === newF.size));
        return [...prev, ...newFiles];
      });
    }
  };

  const removePickedFile = (index: number) => {
    setPickedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submitMaterial = async () => {
    if (pickedFiles.length === 0) return setUploadError('Choose at least one PDF, Word document, or image to submit.');
    if (title.trim().length < 3 || unitCode.trim().length < 2 || department.trim().length < 2 || unitName.trim().length < 2) {
      return setUploadError('Complete the required title, unit code, unit name, and department fields.');
    }
    if (examYear.trim() && !/^\d{4}$/.test(examYear.trim())) return setUploadError('Enter a valid four-digit resource year.');
    setUploadError('');
    setUploadBusy(true);

    try {
      const uploadedAttachments: Array<{
        fileUrl: string;
        tempFilename?: string;
        fileType: string;
        fileSize: number;
        originalName: string;
      }> = [];

      for (const file of pickedFiles) {
        const formData = new FormData();
        if (Platform.OS === 'web') {
          if (file.file instanceof Blob) formData.append('file', file.file, file.name);
          else formData.append('file', await (await fetch(file.uri)).blob(), file.name);
        } else {
          formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' } as any);
        }

        const uploaded = await apiRequest<any>('/papers/upload', { method: 'POST', body: formData });
        if (!uploaded.success || !uploaded.data?.fileUrl) {
          throw new Error(uploaded.error || `Could not upload ${file.name}.`);
        }
        uploadedAttachments.push({
          fileUrl: uploaded.data.fileUrl,
          tempFilename: uploaded.data.tempFilename,
          fileType: uploaded.data.fileType || file.name.split('.').pop() || 'pdf',
          fileSize: uploaded.data.fileSize || file.size || 0,
          originalName: file.name,
        });
      }

      const primaryFile = uploadedAttachments[0];
      const payload = {
        title: title.trim(), school, department: department.trim(), courseCode: unitCode.trim().toUpperCase(),
        unitCode: unitCode.trim().toUpperCase(), unitName: unitName.trim(), type,
        examYear: Number(examYear) || 2025, academicYear: academicLevel.trim() || undefined,
        semester: semester.trim() || undefined, description: description.trim() || undefined,
        fileUrl: primaryFile.fileUrl, tempFilename: primaryFile.tempFilename, fileType: primaryFile.fileType,
        fileSize: primaryFile.fileSize, attachments: uploadedAttachments,
      };
      const submitted = await apiRequest<any>('/papers', { method: 'POST', body: JSON.stringify(payload) });
      if (!submitted.success || !submitted.data?._id) {
        throw new Error(submitted.error || 'Your material could not be sent for administrator approval.');
      }

      setTitle(''); setType('past_paper'); setDepartment(''); setUnitCode(''); setUnitName('');
      setAcademicLevel(''); setSemester(''); setExamYear('2025'); setDescription(''); setPickedFiles([]);
      setUploadError('Your material submitted successfuly. It will be formatted and enhanced by Campus AI before it appears');
      setTimeout(() => {
        setActiveTab('Manage Materials');
        setUploadError('');
      }, 3000);
    } catch (error: any) {
      setUploadError(error?.message || 'Your material could not be sent for administrator approval. Please try again.');
    } finally {
      setUploadBusy(false);
    }
  };

  if (!authenticatedRole) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loginScreen}>
          <View style={styles.loginCard}>
            <View style={styles.loginLogo}><Text style={styles.loginLogoText}>M</Text></View>
            <Text style={styles.loginTitle}>Admin2</Text>
            <Text style={styles.loginSubtitle}>Sign in with the role-specific credentials provided to you.</Text>
            {loginError ? <Text style={styles.loginError}>{loginError}</Text> : null}
            <Text style={styles.loginLabel}>Admin role</Text>
            <TouchableOpacity style={styles.rolePicker} onPress={() => setShowRoleOptions((value) => !value)} activeOpacity={0.8}>
              <Text style={styles.rolePickerText}>{role}</Text><Text style={styles.rolePickerChevron}>{showRoleOptions ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showRoleOptions && <View style={styles.roleOptions}>{['Material manager', 'System Analyst', 'Security supervisor', 'General administrator', 'API manager', 'Payment analyst'].map((item) => <TouchableOpacity key={item} style={styles.roleOption} onPress={() => { setRole(item); setShowRoleOptions(false); }}><Text style={styles.roleOptionText}>{item}</Text></TouchableOpacity>)}</View>}
            <Text style={styles.loginLabel}>Admin code</Text>
            <TextInput value={adminCode} onChangeText={setAdminCode} placeholder="Enter admin code" placeholderTextColor="#94a3b8" style={styles.input} autoCapitalize="characters" />
            <Text style={styles.loginLabel}>Admin secret</Text>
            <TextInput value={adminSecret} onChangeText={setAdminSecret} placeholder="Enter admin secret" placeholderTextColor="#94a3b8" style={styles.input} secureTextEntry />
            <TouchableOpacity style={[styles.loginButton, loginBusy && styles.loginButtonDisabled]} onPress={handleAdmin2Login} disabled={loginBusy} activeOpacity={0.85}>
              <Text style={styles.loginButtonText}>{loginBusy ? 'Checking credentials…' : 'Enter Admin2'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <Image source={require('../assets/mc-logo-transparent.png')} style={styles.brandLogo} resizeMode="contain" />
          <View style={styles.brandCopy}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brand}>MConnect</Text>
              <Text style={styles.adminBadge}>Admin Hub</Text>
              {authenticatedEmail ? (
                <View style={styles.emailPill}>
                  <Text style={styles.emailPillText}>📧 {authenticatedEmail}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.brandSubtitle}>Official Control Panel for Revision Materials</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>Backend API Live</Text></View>
          <TouchableOpacity style={styles.logoutButton} onPress={async () => { await removeStoredToken('admin2_access_token'); await removeStoredToken('admin2_user_email'); setAuthenticatedRole(null); setAuthenticatedEmail(null); }}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.navPanel}>
          {ADMIN_TABS.map(({ label, Icon }) => {
            const active = activeTab === label;
            const badgeCount = tabBadges[label];
            return (
              <TouchableOpacity key={label} style={[styles.navItem, active && styles.navItemActive]} onPress={() => setActiveTab(label)} activeOpacity={0.8}>
                <Icon color={active ? '#ffffff' : '#475569'} size={16} />
                <Text style={[styles.navItemText, active && styles.navItemTextActive]}>{label}</Text>
                {badgeCount && badgeCount > 0 ? (
                  <View style={styles.orangeBadge}>
                    <Text style={styles.orangeBadgeText}>{badgeCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
        {activeTab === 'Manage Materials' ? (
          <ManageMaterialsSection
            materials={materialsList}
            loading={materialsLoading}
            error={materialsError}
            onRefresh={fetchMaterials}
            onToggleHide={async (id) => {
              const mat = materialsList.find((m) => m._id === id);
              if (!mat) return;
              try {
                await apiRequest<any>(`/dashboard/materials/${id}/visibility`, {
                  method: 'PATCH',
                  body: JSON.stringify({ isHidden: !mat.isHidden }),
                });
                setMaterialsList((prev) => prev.map((m) => m._id === id ? { ...m, isHidden: !m.isHidden } : m));
              } catch (e: any) {
                // silently reflect local optimistic update if API fails
                setMaterialsList((prev) => prev.map((m) => m._id === id ? { ...m, isHidden: !m.isHidden } : m));
              }
            }}
            onDeleteMaterial={async (id) => {
              try {
                await apiRequest<any>('/dashboard/materials', {
                  method: 'DELETE',
                  body: JSON.stringify({ ids: [id] }),
                });
              } catch {}
              setMaterialsList((prev) => prev.filter((m) => m._id !== id));
            }}
          />
        ) : activeTab === 'AI Overages' ? (
          <AiOveragesSection />
        ) : activeTab === 'System Health & API' ? (
          <SystemHealthSection />
        ) : activeTab === 'Stats & Registered Users' ? (
          <StatsAndUsersSection />
        ) : activeTab !== 'Upload Admin Materials' ? (
          <View style={styles.restrictedCard}>
            <ShieldCheckIcon color="#64748b" size={28} />
            <Text style={styles.restrictedTitle}>{activeTab}</Text>
            <Text style={styles.restrictedText}>Your admin role does not allow you to acces this feature</Text>
          </View>
        ) : (
        <View style={styles.uploadCard}>
          <View style={styles.cardHeading}>
            <View style={styles.cardHeadingCopy}>
              <View style={styles.titleRow}><TrayUploadIcon color="#15803d" size={21} /><Text style={styles.cardTitle}>Upload & Publish Admin Materials</Text></View>
              <Text style={styles.cardSub}>Submit academic revision papers, CATs, and modules for administrator review. Files stay in temporary server storage until approved.</Text>
            </View>
            <View style={styles.directBadge}><Text style={styles.directBadgeText}>Pending Review</Text></View>
          </View>
          <View style={styles.formGrid}>
            <View style={styles.fieldWide}>
              <Text style={styles.fieldLabel}>Material Title <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="e.g., COM 310 Data Structures & Algorithms Complete Revision Pack" placeholderTextColor="#94a3b8" value={title} onChangeText={setTitle} />
            </View>
            <View style={[styles.fieldThird, showTypePicker && { zIndex: 99999, elevation: 9999 }]}>
              <Text style={styles.fieldLabel}>Material Category / Type <Text style={styles.required}>*</Text></Text>
              {Platform.OS === 'web' ? (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '42px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                  } as any}
                >
                  {MATERIAL_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              ) : (
                <View style={{ position: 'relative', zIndex: showTypePicker ? 99999 : 1 }}>
                  <TouchableOpacity style={styles.dropdownPicker} onPress={() => { setShowTypePicker(!showTypePicker); setShowSchoolPicker(false); setShowSemesterPicker(false); }} activeOpacity={0.8}>
                    <Text style={styles.dropdownText}>{MATERIAL_TYPES.find(m => m.value === type)?.label || 'Past Paper'}</Text>
                    <Text style={styles.dropdownChevron}>{showTypePicker ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {showTypePicker && (
                    <View style={styles.dropdownMenu}>
                      {MATERIAL_TYPES.map(item => (
                        <TouchableOpacity key={item.value} style={styles.dropdownMenuItem} onPress={() => { setType(item.value); setShowTypePicker(false); }}>
                          <Text style={[styles.dropdownMenuItemText, type === item.value && styles.dropdownMenuItemTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={[styles.fieldThird, showSchoolPicker && { zIndex: 99999, elevation: 9999 }]}>
              <Text style={styles.fieldLabel}>School / Faculty <Text style={styles.required}>*</Text></Text>
              {Platform.OS === 'web' ? (
                <select
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '42px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                  } as any}
                >
                  {SCHOOL_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <View style={{ position: 'relative', zIndex: showSchoolPicker ? 99999 : 1 }}>
                  <TouchableOpacity style={styles.dropdownPicker} onPress={() => { setShowSchoolPicker(!showSchoolPicker); setShowTypePicker(false); setShowSemesterPicker(false); }} activeOpacity={0.8}>
                    <Text style={styles.dropdownText} numberOfLines={1}>{school}</Text>
                    <Text style={styles.dropdownChevron}>{showSchoolPicker ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {showSchoolPicker && (
                    <View style={styles.dropdownMenu}>
                      {SCHOOL_OPTIONS.map(item => (
                        <TouchableOpacity key={item} style={styles.dropdownMenuItem} onPress={() => { setSchool(item); setShowSchoolPicker(false); }}>
                          <Text style={[styles.dropdownMenuItemText, school === item && styles.dropdownMenuItemTextActive]}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={styles.fieldThird}>
              <Text style={styles.fieldLabel}>Department <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="e.g., Computer Science, IT, Mathematics" placeholderTextColor="#94a3b8" value={department} onChangeText={setDepartment} />
            </View>
            <View style={styles.fieldThird}>
              <Text style={styles.fieldLabel}>Unit Code <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="E.G., COM 310" placeholderTextColor="#94a3b8" value={unitCode} onChangeText={setUnitCode} autoCapitalize="characters" />
            </View>
            <View style={styles.fieldThird}>
              <Text style={styles.fieldLabel}>Unit Name <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="e.g., Data Structures & Algorithms" placeholderTextColor="#94a3b8" value={unitName} onChangeText={setUnitName} />
            </View>
            <View style={styles.fieldThird}>
              <Text style={styles.fieldLabel}>Academic Level / Year</Text>
              <TextInput style={styles.input} placeholder="e.g., Year 3 or 2024/2025" placeholderTextColor="#94a3b8" value={academicLevel} onChangeText={setAcademicLevel} />
            </View>
            <View style={[styles.fieldHalf, showSemesterPicker && { zIndex: 99999, elevation: 9999 }]}>
              <Text style={styles.fieldLabel}>Semester</Text>
              {Platform.OS === 'web' ? (
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '42px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                  } as any}
                >
                  {SEMESTER_OPTIONS.map((item) => (
                    <option key={item} value={item === 'Select Semester (Optional)' ? '' : item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <View style={{ position: 'relative', zIndex: showSemesterPicker ? 99999 : 1 }}>
                  <TouchableOpacity style={styles.dropdownPicker} onPress={() => { setShowSemesterPicker(!showSemesterPicker); setShowTypePicker(false); setShowSchoolPicker(false); }} activeOpacity={0.8}>
                    <Text style={styles.dropdownText}>{semester || 'Select Semester (Optional)'}</Text>
                    <Text style={styles.dropdownChevron}>{showSemesterPicker ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {showSemesterPicker && (
                    <View style={styles.dropdownMenu}>
                      {SEMESTER_OPTIONS.map(item => (
                        <TouchableOpacity key={item} style={styles.dropdownMenuItem} onPress={() => { setSemester(item === 'Select Semester (Optional)' ? '' : item); setShowSemesterPicker(false); }}>
                          <Text style={[styles.dropdownMenuItemText, (semester === item || (!semester && item === 'Select Semester (Optional)')) && styles.dropdownMenuItemTextActive]}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Exam / Resource Year</Text>
              <TextInput style={styles.input} placeholder="2024" placeholderTextColor="#94a3b8" value={examYear} onChangeText={setExamYear} keyboardType="numeric" />
            </View>
            <View style={styles.fieldWide}>
              <Text style={styles.fieldLabel}>Description / Overview (Optional)</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Provide topic outlines, lecturer notes, or extra instructions for students..." placeholderTextColor="#94a3b8" value={description} onChangeText={setDescription} multiline />
            </View>
            <View style={styles.fieldWide}>
              <Text style={styles.fieldLabel}>Main Document File <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.dropZone,
                  pickedFiles.length > 0 && {
                    borderColor: '#16a34a',
                    backgroundColor: '#f0fdf4',
                    shadowColor: '#16a34a',
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                  }
                ]}
                onPress={() => void chooseMaterial()}
                activeOpacity={0.85}
              >
                <View style={[styles.dropZoneCircle, pickedFiles.length > 0 && { backgroundColor: '#dcfce7' }]}>
                  <TrayUploadIcon color="#15803d" size={24} />
                </View>

                {pickedFiles.length > 0 ? (
                  <>
                    <Text style={[styles.dropZoneTitle, { color: '#15803d' }]}>
                      ✨ Add More Files ({pickedFiles.length} Selected)
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginVertical: 10 }}>
                      {pickedFiles.map((file, idx) => {
                        const sizeKb = ((file.size || 0) / 1024).toFixed(2);
                        return (
                          <View
                            key={idx}
                            style={{
                              backgroundColor: '#ffffff',
                              borderColor: '#bbf7d0',
                              borderWidth: 1,
                              borderRadius: 20,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803d' }}>
                              📄 {file.name} ({sizeKb} KB)
                            </Text>
                            <TouchableOpacity
                              onPress={(e: any) => {
                                e.stopPropagation();
                                removePickedFile(idx);
                              }}
                              style={{ paddingHorizontal: 4 }}
                            >
                              <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 12 }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>

                    <Text style={[styles.dropZoneSub, { color: '#166534', fontWeight: '700' }]}>
                      Total: {pickedFiles.length} file(s) ({(pickedFiles.reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024)).toFixed(2)} MB) • Click box or glowing button to select more files
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.dropZoneTitle}>Click to select or drop document file</Text>
                    <Text style={styles.dropZoneSub}>Supports PDF, Word (.doc/.docx), Images (.png/.jpg), Text files up to 50MB</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          {uploadError ? <Text style={[styles.formMessage, uploadError.startsWith('Your material') || uploadError.startsWith('Material sumited') || uploadError.startsWith('Material submitted') || uploadError.startsWith('Material published') ? styles.successMessage : styles.errorMessage]}>{uploadError}</Text> : null}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.submitButton, uploadBusy && styles.submitButtonDisabled]} onPress={() => void submitMaterial()} disabled={uploadBusy} activeOpacity={0.85}>
              {uploadBusy ? <ActivityIndicator color="#fff" /> : <><TrayUploadIcon color="#ffffff" size={18} /><Text style={styles.submitButtonText}>Submit for Review</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearForm} activeOpacity={0.85}>
              <Text style={styles.clearButtonText}>Clear Form</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f7fb' },
  loginScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#eaf5ef' },
  loginCard: { width: '100%', maxWidth: 430, backgroundColor: '#ffffff', borderRadius: 20, padding: 26, borderWidth: 1, borderColor: '#dbe4ee', shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 18, elevation: 4 },
  loginLogo: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  loginLogoText: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  loginTitle: { color: '#0f172a', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  loginSubtitle: { color: '#64748b', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  loginError: { color: '#b91c1c', backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 12, marginBottom: 12 },
  loginLabel: { color: '#334155', fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  rolePicker: { minHeight: 44, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' },
  rolePickerText: { color: '#0f172a', fontSize: 14 },
  rolePickerChevron: { color: '#64748b', fontSize: 11, fontWeight: '900' },
  roleOptions: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 9, backgroundColor: '#ffffff', marginTop: 4, overflow: 'hidden' },
  roleOption: { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  roleOptionText: { color: '#334155', fontSize: 13, fontWeight: '700' },
  loginButton: { minHeight: 46, borderRadius: 10, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  loginButtonDisabled: { opacity: 0.65 },
  loginButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  header: { backgroundColor: '#064e3b', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10, paddingBottom: 13, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, flexGrow: 1 },
  brandLogo: { width: 44, height: 44, borderRadius: 10 },
  brandCopy: { flex: 1 },
  brandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  brand: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  adminBadge: { color: '#ecfdf5', backgroundColor: '#059669', borderColor: '#34d399', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: '800' },
  emailPill: { backgroundColor: '#065f46', borderColor: '#34d399', borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  emailPillText: { color: '#a7f3d0', fontSize: 11, fontWeight: '800' },
  brandSubtitle: { color: '#a7f3d0', fontSize: 11, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#047857', backgroundColor: '#065f46', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399' },
  statusText: { color: '#a7f3d0', fontSize: 11, fontWeight: '700' },
  logoutButton: { backgroundColor: '#dc2626', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  logoutText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  page: { paddingHorizontal: 24, paddingVertical: 22, paddingBottom: 44, width: '100%', maxWidth: 1240, alignSelf: 'center' },
  navPanel: { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 14, padding: 10, marginBottom: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navItem: { alignSelf: 'flex-start', minHeight: 42, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  navItemActive: { backgroundColor: '#15803d' },
  navItemText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  navItemTextActive: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  orangeBadge: { backgroundColor: '#d97706', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 2 },
  orangeBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  restrictedCard: { minHeight: 190, backgroundColor: '#ffffff', borderColor: '#dbe4ee', borderWidth: 1, borderRadius: 16, padding: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 },
  restrictedTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900', marginTop: 12 },
  restrictedText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 7 },
  uploadCard: { backgroundColor: '#ffffff', borderColor: '#dbe4ee', borderWidth: 1, borderRadius: 16, padding: 24, shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, borderBottomColor: '#edf2f7', paddingBottom: 15, marginBottom: 20, flexWrap: 'wrap' },
  cardHeadingCopy: { flex: 1, minWidth: 250 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
  cardSub: { color: '#64748b', fontSize: 12, marginTop: 5 },
  directBadge: { backgroundColor: '#059669', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  directBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  field: { flexGrow: 1, flexBasis: 290, minWidth: 230, gap: 6 },
  fieldThird: { flexGrow: 1, flexBasis: 260, minWidth: 220, gap: 6, zIndex: 10 },
  fieldHalf: { flexGrow: 1, flexBasis: 380, minWidth: 260, gap: 6, zIndex: 9 },
  fieldWide: { width: '100%', gap: 6 },
  fieldLabel: { color: '#334155', fontSize: 12, fontWeight: '800' },
  required: { color: '#dc2626' },
  input: { width: '100%', minHeight: 42, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, color: '#0f172a', backgroundColor: '#ffffff', fontSize: 13 },
  textArea: { minHeight: 86, paddingTop: 10, textAlignVertical: 'top' },
  dropdownPicker: { width: '100%', minHeight: 42, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' },
  dropdownText: { color: '#0f172a', fontSize: 13, flex: 1 },
  dropdownChevron: { color: '#64748b', fontSize: 11, fontWeight: '900', marginLeft: 8 },
  dropdownMenu: { position: 'absolute', top: 46, left: 0, right: 0, zIndex: 99999, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 9, backgroundColor: '#ffffff', maxHeight: 220, shadowColor: '#0f172a', shadowOpacity: 0.15, shadowRadius: 12, elevation: 9999 },
  dropdownMenuItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownMenuItemText: { color: '#334155', fontSize: 13 },
  dropdownMenuItemTextActive: { color: '#15803d', fontWeight: '800' },
  dropZone: { minHeight: 120, borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 12, padding: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  dropZoneCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dropZoneTitle: { color: '#0f172a', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  dropZoneSub: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  clearButton: { minHeight: 46, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#ffffff', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  clearButtonText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  choiceActive: { backgroundColor: '#ecfdf5', borderColor: '#15803d' },
  choiceText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  choiceTextActive: { color: '#047857' },
  filePicker: { minHeight: 66, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 9, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#f8fafc' },
  filePickerIcon: { width: 40, height: 40, borderRadius: 9, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  filePickerCopy: { flex: 1 },
  filePickerTitle: { color: '#1e293b', fontSize: 12, fontWeight: '800' },
  filePickerSub: { color: '#64748b', fontSize: 11, marginTop: 4 },
  browseButton: { backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', borderWidth: 1, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8, fontSize: 11, fontWeight: '800' },
  formMessage: { marginTop: 16, borderRadius: 8, padding: 11, fontSize: 12, lineHeight: 18 },
  errorMessage: { color: '#991b1b', backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 },
  successMessage: { color: '#166534', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 },
  submitButton: { minHeight: 46, alignSelf: 'flex-start', backgroundColor: '#15803d', borderRadius: 9, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  aiStatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  aiStatCard: { flex: 1, minWidth: 160, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14 },
  aiStatLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  aiStatValue: { fontSize: 22, fontWeight: '900', color: '#15803d', marginVertical: 4 },
  aiStatSub: { fontSize: 11, color: '#94a3b8' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  tableHeaderCell: { fontSize: 11, fontWeight: '800', color: '#475569' },
  tableBodyRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  tableCell: { fontSize: 12, color: '#334155' },
  materialCardBox: {
    flexGrow: 1,
    flexBasis: 300,
    minWidth: 260,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  } as any,
  materialTypeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  materialTypeBadgeText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '900',
  },
  mtidTagText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  matCardTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 19,
  },
  matCardSub: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8,
  },
  tinyActionBtn: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tinyActionBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
  },
});
