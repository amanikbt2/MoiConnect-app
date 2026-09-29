import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const OFFLINE_PAPERS_KEY = 'moi_offline_papers';
const OFFLINE_MSG_QUEUE_KEY = 'moi_offline_msg_queue';

export interface OfflinePaper {
  _id: string;
  isDemo?: boolean;
  title: string;
  school: string;
  department?: string;
  courseCode?: string;
  unitCode: string;
  unitName: string;
  type: string;
  examYear?: number | string;
  fileUrl: string;
  localUri?: string;
  fileType?: string;
  uploadedBy?: { _id: string; name: string };
  createdAt: string;
  updatedAt?: string;
  // Card visual attributes
  thumbnail?: string;
  mtid?: string;
  semester?: string;
  academicYear?: string;
  description?: string;
  ratingScore?: string;
  downloadsCount?: number;
  hasSolutions?: boolean;
  starsCount?: number;
  // Dynamic download state
  status?: 'downloading' | 'completed' | 'failed';
  progress?: number; // 0 to 100
  pinned?: boolean;
}

const DEFAULT_INITIAL_PAPERS: OfflinePaper[] = [
  {
    _id: 'pp_rec1',
    mtid: 'P0001',
    isDemo: true,
    title: 'COM 310 Data Structures Main Exam Paper 2024',
    unitCode: 'COM 310',
    unitName: 'Data Structures & Algorithms',
    school: 'School of Information Sciences',
    examYear: '2024',
    semester: 'SEMESTER 1',
    downloadsCount: 2940,
    starsCount: 2410,
    ratingScore: '4.9',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/com310_exam2024.pdf',
    hasSolutions: true,
    type: 'past_paper',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'completed',
    pinned: true
  },
  {
    _id: 'pp_rec2',
    mtid: 'P0002',
    isDemo: true,
    title: 'MAT 210 Calculus II End of Semester Exam 2024',
    unitCode: 'MAT 210',
    unitName: 'Calculus II',
    school: 'School of Science',
    examYear: '2024',
    semester: 'SEMESTER 2',
    downloadsCount: 3180,
    starsCount: 2890,
    ratingScore: '4.8',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://res.cloudinary.com/mconnect/docs/mat210_exam2024.pdf',
    hasSolutions: true,
    type: 'past_paper',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    status: 'completed',
    pinned: false
  }
];

const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

// Subscriber mechanism for real-time progress updates across screens
type DownloadListener = (papers: OfflinePaper[]) => void;
const listeners = new Set<DownloadListener>();

export const subscribeToDownloadUpdates = (listener: DownloadListener) => {
  listeners.add(listener);
  getDownloadedPapers().then((papers) => listener(papers));
  return () => {
    listeners.delete(listener);
  };
};

const notifyDownloadListeners = async () => {
  const papers = await getDownloadedPapers();
  listeners.forEach((fn) => fn(papers));
};

const activeDownloadIntervals: Record<string, any> = {};

const runSimulatedDownload = (paperId: string) => {
  if (activeDownloadIntervals[paperId]) {
    clearInterval(activeDownloadIntervals[paperId]);
  }

  let progress = 5;
  activeDownloadIntervals[paperId] = setInterval(async () => {
    progress += Math.floor(Math.random() * 18) + 12;
    if (progress >= 100) {
      progress = 100;
      clearInterval(activeDownloadIntervals[paperId]);
      delete activeDownloadIntervals[paperId];
      await updatePaperDownloadState(paperId, { status: 'completed', progress: 100 });
    } else {
      await updatePaperDownloadState(paperId, { status: 'downloading', progress });
    }
  }, 220);
};

export const updatePaperDownloadState = async (
  paperId: string,
  updates: Partial<OfflinePaper>
) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  let papers: OfflinePaper[] = existingStr ? JSON.parse(existingStr) : [];
  papers = papers.map((p) => {
    if (p._id === paperId) {
      return { ...p, ...updates };
    }
    return p;
  });
  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  await notifyDownloadListeners();
};

export const savePaperForOffline = async (paperInput: any): Promise<OfflinePaper> => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  const papers: OfflinePaper[] = existingStr ? JSON.parse(existingStr) : [];
  const targetId = paperInput._id || `paper_${Date.now()}`;
  const existingIndex = papers.findIndex((paper) => paper._id === targetId);
  const existingPaper = existingIndex >= 0 ? papers[existingIndex] : undefined;

  if (existingPaper?.status === 'completed' && existingPaper.localUri) {
    return existingPaper;
  }

  const newPaperItem: OfflinePaper = {
    _id: targetId,
    title: paperInput.title || 'Untitled Material',
    school: paperInput.school || 'Moi University',
    department: paperInput.department || paperInput.unitName || '',
    courseCode: paperInput.courseCode || paperInput.unitCode || '',
    unitCode: paperInput.unitCode || 'GEN 101',
    unitName: paperInput.unitName || paperInput.title || '',
    type: paperInput.type || 'study_notes',
    examYear: paperInput.examYear || 2024,
    fileUrl: paperInput.fileUrl || '',
    fileType: paperInput.fileType || 'pdf',
    uploadedBy: paperInput.uploadedBy || { _id: 'admin', name: 'Moi Faculty' },
    thumbnail: paperInput.thumbnail || '',
    mtid: paperInput.mtid || `P000${Math.floor(Math.random() * 9) + 1}`,
    semester: paperInput.semester || 'SEMESTER 1',
    academicYear: paperInput.academicYear || '',
    description: paperInput.description || '',
    ratingScore: paperInput.ratingScore || '4.9',
    downloadsCount: paperInput.downloadsCount || 2900,
    hasSolutions: paperInput.hasSolutions ?? true,
    createdAt: paperInput.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'downloading',
    progress: 0,
    pinned: existingPaper?.pinned || false
  };

  if (existingIndex >= 0) papers[existingIndex] = { ...existingPaper, ...newPaperItem };
  else papers.unshift(newPaperItem);
  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  await notifyDownloadListeners();

  if (Platform.OS === 'web') {
    runSimulatedDownload(targetId);
    return newPaperItem;
  }

  try {
    if (!newPaperItem.fileUrl) throw new Error('This material has no downloadable file URL.');
    const safeName = `${targetId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = newPaperItem.fileType === 'pdf' ? 'pdf' : (newPaperItem.fileType || 'bin').replace(/[^a-zA-Z0-9]/g, '');
    const privateDirectory = `${FileSystem.documentDirectory}offline-materials/`;
    await FileSystem.makeDirectoryAsync(privateDirectory, { intermediates: true });
    const localUri = `${privateDirectory}moi_material_${safeName}.${extension}`;
    const task = FileSystem.createDownloadResumable(
      newPaperItem.fileUrl,
      localUri,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        const progress = totalBytesExpectedToWrite > 0 ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100) : 0;
        updatePaperDownloadState(targetId, { progress });
      }
    );
    const result = await task.downloadAsync();
    if (!result?.uri) throw new Error('The local file was not created.');
    await updatePaperDownloadState(targetId, { status: 'completed', progress: 100, localUri: result.uri } as any);
    return { ...newPaperItem, status: 'completed', progress: 100, localUri: result.uri };
  } catch (error) {
    await updatePaperDownloadState(targetId, { status: 'failed', progress: 0 });
    throw error;
  }
};

export const saveDownloadedPaper = savePaperForOffline;
export const retryPaperDownload = async (paperId: string) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  const paper = existingStr ? (JSON.parse(existingStr) as OfflinePaper[]).find((item) => item._id === paperId) : undefined;
  if (!paper) return;
  if (paper.localUri && Platform.OS !== 'web') {
    await FileSystem.deleteAsync(paper.localUri, { idempotent: true }).catch(() => undefined);
  }
  await savePaperForOffline({ ...paper, localUri: undefined });
};
export const togglePinOfflinePaper = async (paperId: string) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  let papers: OfflinePaper[] = existingStr ? JSON.parse(existingStr) : [];
  papers = papers.map((p) => {
    if (p._id === paperId) {
      return { ...p, pinned: !p.pinned };
    }
    return p;
  });
  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  await notifyDownloadListeners();
};

export const getDownloadedPapers = async (): Promise<OfflinePaper[]> => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  let papers: OfflinePaper[] = existingStr ? JSON.parse(existingStr) : [];
  if (!existingStr || papers.length === 0) {
    papers = [];
  }
  return papers.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
};

export const removeOfflinePaper = async (paperId: string) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  if (activeDownloadIntervals[paperId]) {
    clearInterval(activeDownloadIntervals[paperId]);
    delete activeDownloadIntervals[paperId];
  }
  if (!existingStr) return;

  const papers: OfflinePaper[] = JSON.parse(existingStr);
  const paper = papers.find((item) => item._id === paperId);
  if (paper?.localUri && Platform.OS !== 'web') {
    await FileSystem.deleteAsync(paper.localUri, { idempotent: true }).catch(() => undefined);
  }

  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers.filter((item) => item._id !== paperId)));
  await notifyDownloadListeners();
};
export const removeDownloadedPaper = removeOfflinePaper;

export const isPaperDownloaded = async (paperId: string): Promise<boolean> => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  if (!existingStr) return false;
  const papers: OfflinePaper[] = JSON.parse(existingStr);
  return papers.some((p) => (p._id === paperId || p._id === `note_${paperId}` || p._id === `paper_${paperId}`) && p.status === 'completed');
};


export const cacheRentals = async (rentals: any[]): Promise<void> => {
  try {
    await setItem('moi_cached_rentals_list', JSON.stringify(rentals));
  } catch {}
};

export const getCachedRentals = async (): Promise<any[]> => {
  try {
    const str = await getItem('moi_cached_rentals_list');
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
};

const CACHED_HOUSES_KEY = 'moi_cached_house_details';

export const cacheHouseDetail = async (house: any): Promise<void> => {
  try {
    const existingStr = await getItem(CACHED_HOUSES_KEY);
    const cache: Record<string, any> = existingStr ? JSON.parse(existingStr) : {};
    cache[house._id] = house;
    await setItem(CACHED_HOUSES_KEY, JSON.stringify(cache));
  } catch {}
};

export const getCachedHouseDetail = async (id: string): Promise<any | null> => {
  try {
    const existingStr = await getItem(CACHED_HOUSES_KEY);
    if (!existingStr) return null;
    const cache: Record<string, any> = JSON.parse(existingStr);
    return cache[id] || null;
  } catch {
    return null;
  }
};

// ─── Offline booking queue ────────────────────────────────────────────────

const OFFLINE_BOOKING_QUEUE_KEY = 'moi_offline_booking_queue';

export const enqueueOfflineBooking = async (booking: {
  tempId: string;
  houseId: string;
  requestedMoveIn: string;
  notes?: string;
  houseTitle?: string;
  createdAt: string;
}): Promise<void> => {
  const existingStr = await getItem(OFFLINE_BOOKING_QUEUE_KEY);
  const queue: any[] = existingStr ? JSON.parse(existingStr) : [];
  queue.push(booking);
  await setItem(OFFLINE_BOOKING_QUEUE_KEY, JSON.stringify(queue));
};

export const getOfflineBookingQueue = async (): Promise<any[]> => {
  const existingStr = await getItem(OFFLINE_BOOKING_QUEUE_KEY);
  return existingStr ? JSON.parse(existingStr) : [];
};

// ─── Chat message cache ───────────────────────────────────────────────────

const CHAT_MESSAGES_KEY = 'moi_cached_chat_messages';

export const cacheMessages = async (conversationId: string, messages: any[]): Promise<void> => {
  try {
    const existingStr = await getItem(CHAT_MESSAGES_KEY);
    const cache: Record<string, any[]> = existingStr ? JSON.parse(existingStr) : {};
    cache[conversationId] = messages.slice(-100); // keep last 100
    await setItem(CHAT_MESSAGES_KEY, JSON.stringify(cache));
  } catch {}
};

export const getCachedMessages = async (conversationId: string): Promise<any[]> => {
  try {
    const existingStr = await getItem(CHAT_MESSAGES_KEY);
    if (!existingStr) return [];
    const cache: Record<string, any[]> = JSON.parse(existingStr);
    return cache[conversationId] || [];
  } catch {
    return [];
  }
};

export const enqueueOfflineMessage = async (msg: {
  tempId: string;
  conversationId: string;
  text: string;
  senderId: string;
  createdAt: string;
}) => {
  const existingStr = await getItem(OFFLINE_MSG_QUEUE_KEY);
  let queue: any[] = existingStr ? JSON.parse(existingStr) : [];
  queue.push(msg);
  await setItem(OFFLINE_MSG_QUEUE_KEY, JSON.stringify(queue));
};

export const getOfflineMessageQueue = async (): Promise<any[]> => {
  const existingStr = await getItem(OFFLINE_MSG_QUEUE_KEY);
  return existingStr ? JSON.parse(existingStr) : [];
};

export const clearOfflineMessageQueue = async () => {
  await setItem(OFFLINE_MSG_QUEUE_KEY, JSON.stringify([]));
};

const STUDENT_PROFILE_KEY = 'moi_student_profile_details';

export interface StudentPersonalDetails {
  admissionNumber: string;
  school: string;
  course: string;
  yearOfStudy: string;
  phone: string;
  fullName: string;
  avatarUri?: string;
}

export const saveStudentPersonalDetails = async (details: StudentPersonalDetails) => {
  await setItem(STUDENT_PROFILE_KEY, JSON.stringify(details));
};

export const getStudentPersonalDetails = async (): Promise<StudentPersonalDetails | null> => {
  const existingStr = await getItem(STUDENT_PROFILE_KEY);
  return existingStr ? JSON.parse(existingStr) : null;
};

const COMMUNITY_MESSAGES_KEY = 'moi_community_messages_cache';
const COMMUNITY_MESSAGES_FILE = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}community-messages-cache.json`
  : null;
const LAST_READ_COMMUNITY_KEY = 'moi_community_last_read_id';
const COMMUNITY_REACTOR_ID_KEY = 'moi_community_reactor_id';
const MAX_CACHED_COMMUNITY_MESSAGES = 120;
let communityCacheWrite: Promise<void> = Promise.resolve();

export const getCommunityReactorId = async (): Promise<string> => {
  const existing = await getItem(COMMUNITY_REACTOR_ID_KEY);
  if (existing) return existing;
  const generated = `device_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  await setItem(COMMUNITY_REACTOR_ID_KEY, generated);
  return generated;
};

export const getStoredCommunityMessages = async (): Promise<any[]> => {
  try {
    const existingStr = Platform.OS === 'web'
      ? await getItem(COMMUNITY_MESSAGES_KEY)
      : COMMUNITY_MESSAGES_FILE
        ? await FileSystem.readAsStringAsync(COMMUNITY_MESSAGES_FILE).catch(() => null)
        : await getItem(COMMUNITY_MESSAGES_KEY);
    if (!existingStr) return [];
    const parsed = JSON.parse(existingStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCommunityMessages = async (messages: any[]) => {
  const compact = (message: any) => {
    const stripDataAvatar = (avatar?: string) => avatar?.startsWith('data:') ? undefined : avatar;
    return {
      ...message,
      text: typeof message.text === 'string' ? message.text.slice(-4000) : '',
      senderAvatarUrl: stripDataAvatar(message.senderAvatarUrl),
      pendingPayload: message.pendingPayload
        ? { ...message.pendingPayload, senderAvatarUrl: stripDataAvatar(message.pendingPayload.senderAvatarUrl) }
        : undefined
    };
  };
  const compacted = messages.map(compact);
  const queued = compacted.filter((message) => message.deliveryStatus === 'queued' && message.pendingPayload);
  const history = compacted.filter((message) => !(message.deliveryStatus === 'queued' && message.pendingPayload));

  communityCacheWrite = communityCacheWrite.catch(() => undefined).then(async () => {
    let lastError: unknown;
    for (const keepCount of [MAX_CACHED_COMMUNITY_MESSAGES, 80, 40, 20, 0]) {
      const retained = [...history.slice(keepCount > 0 ? -keepCount : history.length), ...queued]
        .sort((a, b) => String(a.isoDate || '').localeCompare(String(b.isoDate || '')));
      const serialized = JSON.stringify(retained);
      try {
        if (Platform.OS === 'web') {
          await setItem(COMMUNITY_MESSAGES_KEY, serialized);
        } else if (COMMUNITY_MESSAGES_FILE) {
          await FileSystem.writeAsStringAsync(COMMUNITY_MESSAGES_FILE, serialized);
        } else {
          await setItem(COMMUNITY_MESSAGES_KEY, serialized);
        }
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (Platform.OS === 'web') {
          try { localStorage.removeItem(COMMUNITY_MESSAGES_KEY); } catch {}
        }
      }
    }
    if (lastError) console.warn('[Community cache] Unable to persist the compact message cache.');
    await notifyUnreadCountListeners().catch(() => undefined);
  }).catch(() => console.warn('[Community cache] Message cache update was skipped.'));
  await communityCacheWrite;
};
const READ_COMMUNITY_MENTIONS_KEY = 'moi_community_read_mention_ids';

export const getReadCommunityMentionIds = async (): Promise<string[]> => {
  const stored = await getItem(READ_COMMUNITY_MENTIONS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const saveReadCommunityMentionIds = async (ids: string[]): Promise<void> => {
  await setItem(READ_COMMUNITY_MENTIONS_KEY, JSON.stringify(Array.from(new Set(ids))));
};

export const getLastReadCommunityMsgId = async (): Promise<string | null> => {
  return await getItem(LAST_READ_COMMUNITY_KEY);
};

export const saveLastReadCommunityMsgId = async (msgId: string): Promise<void> => {
  await setItem(LAST_READ_COMMUNITY_KEY, msgId);
  await notifyUnreadCountListeners();
};

export const getCommunityUnreadCount = async (): Promise<number> => {
  const [messages, lastReadId] = await Promise.all([
    getStoredCommunityMessages(),
    getLastReadCommunityMsgId()
  ]);

  if (!messages || messages.length === 0) return 0;
  if (!lastReadId) return 0;

  const index = messages.findIndex((m: any) => (m.id || m._id) === lastReadId);
  if (index === -1) return 0;

  return Math.max(0, messages.length - 1 - index);
};

export interface CommunityUnreadSummary {
  general: number;
  mentions: number;
}

export const getCommunityUnreadSummary = async (user?: { email?: string; name?: string } | null): Promise<CommunityUnreadSummary> => {
  const [messages, lastReadId, readMentionIds] = await Promise.all([
    getStoredCommunityMessages(),
    getLastReadCommunityMsgId(),
    getReadCommunityMentionIds()
  ]);

  if (!messages?.length || !lastReadId) return { general: 0, mentions: 0 };

  const lastReadIndex = messages.findIndex((message: any) => (message.id || message._id) === lastReadId);
  if (lastReadIndex === -1) return { general: 0, mentions: 0 };

  const unreadMessages = messages.slice(lastReadIndex + 1);
  const mentionIds = new Set(readMentionIds);
  const email = user?.email?.toLowerCase().trim() || '';
  const emailPrefix = email.split('@')[0];
  const name = user?.name?.toLowerCase().trim() || '';
  const firstName = name.split(' ')[0] || '';
  const nameSlug = name.replace(/\s+/g, '_');

  const mentions = unreadMessages.filter((message: any) => {
    const messageId = message.id || message._id;
    if (!messageId || mentionIds.has(messageId) || message.isMe) return false;
    const text = String(message.text || '').toLowerCase();
    return Boolean(
      (email && text.includes(`@${email}`)) ||
      (emailPrefix && emailPrefix.length >= 3 && text.includes(`@${emailPrefix}`)) ||
      (name && text.includes(`@${name}`)) ||
      (nameSlug && text.includes(`@${nameSlug}`)) ||
      (firstName && firstName.length >= 2 && text.includes(`@${firstName}`))
    );
  }).length;

  return {
    mentions,
    general: Math.max(0, unreadMessages.length - mentions)
  };
};

type UnreadCountListener = (count: number) => void;
const unreadCountListeners = new Set<UnreadCountListener>();

type UnreadSummaryListener = (summary: CommunityUnreadSummary) => void;
const unreadSummaryListeners = new Map<UnreadSummaryListener, { email?: string; name?: string } | null>();

export const subscribeToUnreadSummaryUpdates = (
  listener: UnreadSummaryListener,
  user?: { email?: string; name?: string } | null
) => {
  unreadSummaryListeners.set(listener, user || null);
  getCommunityUnreadSummary(user).then(listener);
  return () => {
    unreadSummaryListeners.delete(listener);
  };
};

export const subscribeToUnreadCountUpdates = (listener: UnreadCountListener) => {
  unreadCountListeners.add(listener);
  getCommunityUnreadCount().then((count) => listener(count));
  return () => {
    unreadCountListeners.delete(listener);
  };
};

export const notifyUnreadCountListeners = async () => {
  const count = await getCommunityUnreadCount();
  unreadCountListeners.forEach((fn) => fn(count));
  unreadSummaryListeners.forEach((user, listener) => {
    getCommunityUnreadSummary(user).then(listener);
  });
};
