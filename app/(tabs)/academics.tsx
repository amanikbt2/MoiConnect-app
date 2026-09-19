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
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { IPaper, MOI_SCHOOLS, PAPER_TYPES } from '@moi/shared';
import { PaperCard } from '../../src/components/PaperCard';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { useAppNavigation } from '../../src/utils/navigation';
import { getDownloadedPapers } from '../../src/services/offlineStorage';

export default function AcademicsScreen({ route }: any) {
  const [activeTab, setActiveTab] = useState<'browse' | 'submissions' | 'offline'>('browse');
  const [papers, setPapers] = useState<IPaper[]>([]);
  const [mySubmissions, setMySubmissions] = useState<IPaper[]>([]);
  const [downloadedPapers, setDownloadedPapers] = useState<IPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Submission Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [school, setSchool] = useState(MOI_SCHOOLS[0]);
  const [department, setDepartment] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [type, setType] = useState<any>('past_paper');
  const [examYear, setExamYear] = useState('2025');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const router = useAppNavigation();

  useEffect(() => {
    if (route?.params?.upload === 'true' || route?.params?.upload === true) {
      setShowUploadModal(true);
    }
  }, [route?.params]);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchPapers();
    } else if (activeTab === 'submissions') {
      fetchMySubmissions();
    } else if (activeTab === 'offline') {
      fetchOfflinePapers();
    }
  }, [activeTab, selectedType, selectedSchool]);

  const fetchOfflinePapers = async () => {
    setLoading(true);
    const saved = await getDownloadedPapers();
    setDownloadedPapers(saved);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchPapers = async () => {
    setLoading(true);
    let url = `/papers?limit=30`;
    if (selectedType) url += `&type=${selectedType}`;
    if (selectedSchool) url += `&school=${encodeURIComponent(selectedSchool)}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const res = await apiRequest<{ data: IPaper[] }>(url);
    setLoading(false);
    setRefreshing(false);
    if (res.success && res.data) {
      setPapers(res.data);
    }
  };

  const fetchMySubmissions = async () => {
    if (!user) return;
    setLoading(true);
    const res = await apiRequest<{ data: IPaper[] }>('/papers/my-submissions');
    setLoading(false);
    setRefreshing(false);
    if (res.success && res.data) {
      setMySubmissions(res.data);
    }
  };

  const handleSearchSubmit = () => {
    fetchPapers();
  };

  const handleUploadPaper = async () => {
    if (!title || !department || !courseCode || !unitCode || !unitName || !fileUrl) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields including document file URL.');
      return;
    }

    setSubmitting(true);
    const res = await apiRequest('/papers', {
      method: 'POST',
      body: JSON.stringify({
        title,
        school,
        department,
        courseCode,
        unitCode,
        unitName,
        type,
        examYear: parseInt(examYear || '2025', 10),
        fileUrl,
        fileType: 'pdf'
      })
    });
    setSubmitting(false);

    if (res.success) {
      Alert.alert(
        'Submission Received',
        'Your academic paper has been submitted successfully and is pending administrator review.',
        [{ text: 'OK', onPress: () => {
          setShowUploadModal(false);
          setActiveTab('submissions');
          fetchMySubmissions();
        }}]
      );
    } else {
      Alert.alert('Error', res.error || 'Paper submission failed.');
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
            Browse Resources
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'submissions' && styles.tabBtnActive]}
          onPress={() => {
            if (!user) {
              router.push('/(auth)/login');
            } else {
              setActiveTab('submissions');
            }
          }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'submissions' && styles.tabBtnTextActive]}>
            Submissions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'offline' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('offline');
            fetchOfflinePapers();
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <DownloadIcon color={activeTab === 'offline' ? '#ffffff' : '#475569'} size={14} />
            <Text style={[styles.tabBtnText, activeTab === 'offline' && styles.tabBtnTextActive]}>
              Offline ({downloadedPapers.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {activeTab === 'offline' ? (
        <FlatList
          data={downloadedPapers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchOfflinePapers} colors={['#15803d']} />
          }
          renderItem={({ item }) => (
            <PaperCard paper={item} onPress={() => router.push(`/paper/${item._id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No Offline Papers Downloaded"
              message="Tap 'Save for Offline Reading' on any past paper or CAT to read it later without internet."
            />
          }
        />
      ) : activeTab === 'browse' ? (
        <FlatList
          data={papers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPapers(); }} colors={['#15803d']} />
          }
          ListHeaderComponent={
            <View>
              {/* Search input */}
              <View style={styles.searchRow}>
                <TextInput
                  placeholder="Search title, unit code (e.g. COM 310)..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchSubmit}
                  style={styles.searchInput}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearchSubmit}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>

              {/* Resource Type Filter Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                <TouchableOpacity
                  style={[styles.pill, selectedType === '' && styles.pillActive]}
                  onPress={() => setSelectedType('')}
                >
                  <Text style={[styles.pillText, selectedType === '' && styles.pillTextActive]}>All Types</Text>
                </TouchableOpacity>
                {PAPER_TYPES.map((pt) => (
                  <TouchableOpacity
                    key={pt}
                    style={[styles.pill, selectedType === pt && styles.pillActive]}
                    onPress={() => setSelectedType(selectedType === pt ? '' : pt)}
                  >
                    <Text style={[styles.pillText, selectedType === pt && styles.pillTextActive]}>
                      {pt.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Upload Button Header Action */}
              <TouchableOpacity style={styles.uploadBanner} onPress={() => setShowUploadModal(true)}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <PlusIcon color="#ffffff" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadBannerTitle}>Submit Past Paper or Notes</Text>
                  <Text style={styles.uploadBannerSub}>Share revision materials with fellow Moi University students</Text>
                </View>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <PaperCard paper={item} onPress={() => router.push(`/paper/${item._id}`)} />
          )}
          ListEmptyComponent={
            loading ? (
              <View style={{ gap: 10, marginTop: 12 }}>
                <Skeleton height={120} />
                <Skeleton height={120} />
                <Skeleton height={120} />
              </View>
            ) : (
              <EmptyState
                title="No Academic Resources Found"
                message="Try clearing filters or search query to view available past papers and revision notes."
              />
            )
          }
        />
      ) : (
        <FlatList
          data={mySubmissions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMySubmissions(); }} colors={['#15803d']} />
          }
          renderItem={({ item }) => (
            <View style={styles.submissionCard}>
              <View style={styles.subHeader}>
                <Badge
                  label={item.status}
                  variant={item.status === 'approved' ? 'green' : item.status === 'pending' ? 'gold' : 'red'}
                />
                <Text style={styles.subDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.subTitle}>{item.title}</Text>
              <Text style={styles.subDetail}>{item.unitCode} - {item.unitName}</Text>
              {item.rejectionReason && (
                <Text style={styles.rejectionText}>Reason for Rejection: {item.rejectionReason}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            loading ? (
              <Skeleton height={100} />
            ) : (
              <EmptyState
                title="No Submissions Yet"
                message="You have not submitted any academic papers. Click 'Submit Paper' to upload revision notes."
              />
            )
          }
        />
      )}

      {/* Upload Paper Modal */}
      <Modal visible={showUploadModal} animationType="slide" onRequestClose={() => setShowUploadModal(false)}>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Academic Resource</Text>
            <TouchableOpacity onPress={() => setShowUploadModal(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          <Input label="Document Title *" placeholder="COM 310 Final Exam 2025" value={title} onChangeText={setTitle} />
          <Input label="Department *" placeholder="Computer Science" value={department} onChangeText={setDepartment} />
          <Input label="Course Code *" placeholder="COM 310" value={courseCode} onChangeText={setCourseCode} />
          <Input label="Unit Code *" placeholder="COM 310" value={unitCode} onChangeText={setUnitCode} />
          <Input label="Unit Name *" placeholder="Data Structures & Algorithms" value={unitName} onChangeText={setUnitName} />
          <Input label="Exam / Academic Year" placeholder="2025" value={examYear} onChangeText={setExamYear} keyboardType="numeric" />
          <Input
            label="PDF File Document Link / Cloudinary URL *"
            placeholder="https://res.cloudinary.com/.../document.pdf"
            value={fileUrl}
            onChangeText={setFileUrl}
          />

          <Button title="Submit for Admin Review" onPress={handleUploadPaper} loading={submitting} style={{ marginTop: 16 }} />
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
  pillScroll: {
    flexDirection: 'row',
    marginBottom: 16
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
  uploadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16
  },
  uploadBannerIcon: {
    fontSize: 24,
    marginRight: 12
  },
  uploadBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534'
  },
  uploadBannerSub: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2
  },
  submissionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  subDate: {
    fontSize: 12,
    color: '#94a3b8'
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  subDetail: {
    fontSize: 13,
    color: '#64748b'
  },
  rejectionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
    fontWeight: '600'
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
  }
});
