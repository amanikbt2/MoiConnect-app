import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const OFFLINE_PAPERS_KEY = 'moi_offline_papers';
const OFFLINE_MSG_QUEUE_KEY = 'moi_offline_msg_queue';

export interface OfflinePaper {
  _id: string;
  title: string;
  school: string;
  department?: string;
  courseCode?: string;
  unitCode: string;
  unitName: string;
  type: string;
  examYear?: number | string;
  fileUrl: string;
  fileType?: string;
  uploadedBy?: { _id: string; name: string };
  createdAt: string;
  updatedAt?: string;
  // Dynamic download state
  status?: 'downloading' | 'completed' | 'failed';
  progress?: number; // 0 to 100
  pinned?: boolean;
}

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
  let papers: OfflinePaper[] = existingStr ? JSON.parse(existingStr) : [];

  const targetId = paperInput._id || `paper_${Date.now()}`;
  const existingIndex = papers.findIndex((p) => p._id === targetId);

  const newPaperItem: OfflinePaper = {
    _id: targetId,
    title: paperInput.title || 'Untitled Material',
    school: paperInput.school || 'Moi University',
    department: paperInput.department || paperInput.unitName || '',
    courseCode: paperInput.courseCode || paperInput.unitCode || '',
    unitCode: paperInput.unitCode || 'GEN 101',
    unitName: paperInput.unitName || paperInput.title || '',
    type: paperInput.type || 'study_notes',
    examYear: paperInput.examYear || 2025,
    fileUrl: paperInput.fileUrl || '',
    fileType: paperInput.fileType || 'pdf',
    uploadedBy: paperInput.uploadedBy || { _id: 'admin', name: 'Moi Faculty' },
    createdAt: paperInput.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'downloading',
    progress: 5,
    pinned: false
  };

  if (existingIndex >= 0) {
    if (papers[existingIndex].status === 'completed') {
      return papers[existingIndex];
    }
    papers[existingIndex] = { ...papers[existingIndex], status: 'downloading', progress: 5 };
  } else {
    papers.unshift(newPaperItem);
  }

  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  await notifyDownloadListeners();

  runSimulatedDownload(targetId);
  return newPaperItem;
};

export const saveDownloadedPaper = savePaperForOffline;

export const retryPaperDownload = async (paperId: string) => {
  await updatePaperDownloadState(paperId, { status: 'downloading', progress: 5 });
  runSimulatedDownload(paperId);
};

export const togglePinOfflinePaper = async (paperId: string) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  if (!existingStr) return;
  let papers: OfflinePaper[] = JSON.parse(existingStr);
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
  if (!existingStr) return [];
  const papers: OfflinePaper[] = JSON.parse(existingStr);
  return papers.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
};

export const removeOfflinePaper = async (paperId: string) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  if (!existingStr) return;
  let papers: OfflinePaper[] = JSON.parse(existingStr);
  papers = papers.filter((p) => p._id !== paperId);
  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  if (activeDownloadIntervals[paperId]) {
    clearInterval(activeDownloadIntervals[paperId]);
    delete activeDownloadIntervals[paperId];
  }
  await notifyDownloadListeners();
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
