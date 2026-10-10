import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { apiRequest, getStoredToken } from './api';
import { scheduleLocalMissedMessagesNotification } from './notificationService';

const OFFLINE_PAPERS_KEY = 'moi_offline_papers';
const OFFLINE_MSG_QUEUE_KEY = 'moi_offline_msg_queue';
const UNREAD_DOWNLOAD_BADGE_KEY = 'moi_unread_download_badge';

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
  ttsTextUrl?: string;
  ttsLocalUri?: string;
  ttsPersonalized?: boolean;
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

const DEFAULT_INITIAL_PAPERS: OfflinePaper[] = [];

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

type DownloadBadgeListener = (count: number) => void;
const downloadBadgeListeners = new Set<DownloadBadgeListener>();

export const getUnreadDownloadBadgeCount = async (): Promise<number> => {
  const storedCount = Number(await getItem(UNREAD_DOWNLOAD_BADGE_KEY) || 0);
  return Number.isFinite(storedCount) && storedCount > 0 ? Math.floor(storedCount) : 0;
};

export const subscribeToDownloadBadgeUpdates = (listener: DownloadBadgeListener) => {
  downloadBadgeListeners.add(listener);
  getUnreadDownloadBadgeCount().then(listener).catch(() => listener(0));
  return () => downloadBadgeListeners.delete(listener);
};

const notifyDownloadBadgeListeners = async () => {
  const count = await getUnreadDownloadBadgeCount();
  downloadBadgeListeners.forEach((listener) => listener(count));
};

const incrementUnreadDownloadBadge = async () => {
  const count = await getUnreadDownloadBadgeCount();
  await setItem(UNREAD_DOWNLOAD_BADGE_KEY, String(count + 1));
  await notifyDownloadBadgeListeners();
};

export const clearUnreadDownloadBadge = async () => {
  await setItem(UNREAD_DOWNLOAD_BADGE_KEY, '0');
  await notifyDownloadBadgeListeners();
};

export const subscribeToDownloadUpdates = (listener: DownloadListener) => {
  listeners.add(listener);
  getDownloadedPapers().then((papers) => listener(papers));
  return () => {
    listeners.delete(listener);
  };
};

const notifyDownloadListeners = async () => {
  const papers = await getDownloadedPapers(false);
  listeners.forEach((fn) => fn(papers));
};

const activeDownloadTasks: Record<string, FileSystem.DownloadResumable> = {};
const OFFLINE_PDF_DB = 'mconnect-offline-materials';
const OFFLINE_PDF_STORE = 'pdf-files';

const openOfflinePdfDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') {
    reject(new Error('Offline file storage is unavailable in this browser.'));
    return;
  }
  const request = indexedDB.open(OFFLINE_PDF_DB, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(OFFLINE_PDF_STORE)) {
      request.result.createObjectStore(OFFLINE_PDF_STORE);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Could not open offline file storage.'));
});

const saveOfflineWebPdf = async (paperId: string, blob: Blob): Promise<void> => {
  const database = await openOfflinePdfDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_PDF_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_PDF_STORE).put(blob, paperId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not save PDF offline.'));
    transaction.onabort = () => reject(transaction.error || new Error('Saving PDF offline was interrupted.'));
  });
  database.close();
};

const getOfflineWebPdf = async (paperId: string): Promise<Blob | null> => {
  const database = await openOfflinePdfDatabase();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const request = database.transaction(OFFLINE_PDF_STORE, 'readonly').objectStore(OFFLINE_PDF_STORE).get(paperId);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error || new Error('Could not read saved PDF.'));
  });
  database.close();
  return blob;
};

const removeOfflineWebPdf = async (paperId: string): Promise<void> => {
  const database = await openOfflinePdfDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_PDF_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_PDF_STORE).delete(paperId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not delete saved PDF.'));
  });
  database.close();
};

export const readOfflineWebPdfBase64 = async (paperId: string): Promise<string> => {
  const blob = await getOfflineWebPdf(paperId);
  if (!blob) throw new Error('The saved PDF is missing from offline storage.');
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const separator = result.indexOf(',');
      if (separator < 0) reject(new Error('Could not read the saved PDF.'));
      else resolve(result.slice(separator + 1));
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read the saved PDF.'));
    reader.readAsDataURL(blob);
  });
};

export const updatePaperDownloadState = async (
  paperId: string,
  updates: Partial<OfflinePaper>
) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  let papers: OfflinePaper[] = existingStr ? JSON.parse(existingStr) : [];
  const existingPaper = papers.find((paper) => paper._id === paperId);
  papers = papers.map((p) => {
    if (p._id === paperId) {
      return { ...p, ...updates };
    }
    return p;
  });
  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  if (updates.status === 'completed' && existingPaper?.status !== 'completed') {
    await incrementUnreadDownloadBadge();
  }
  await notifyDownloadListeners();
};

export const savePaperForOffline = async (paperInput: any): Promise<OfflinePaper> => {
  const reportProgress = (progress: number) => {
    if (typeof paperInput?.onProgress === 'function') paperInput.onProgress(progress);
  };
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  const papers: OfflinePaper[] = existingStr ? JSON.parse(existingStr) : [];
  const targetId = paperInput._id || `paper_${Date.now()}`;
  const existingIndex = papers.findIndex((paper) => paper._id === targetId);
  let existingPaper = existingIndex >= 0 ? papers[existingIndex] : undefined;

  if (existingPaper?.status === 'completed' && existingPaper.localUri) {
    let savedFileIsValid = false;
    if (Platform.OS === 'web' && existingPaper.localUri === `offline-web:${targetId}`) {
      savedFileIsValid = Boolean(await getOfflineWebPdf(targetId).catch(() => null));
    } else if (Platform.OS !== 'web') {
      const fileInfo = await FileSystem.getInfoAsync(existingPaper.localUri).catch(() => null);
      savedFileIsValid = Boolean(fileInfo?.exists && fileInfo.size && fileInfo.size > 0);
    }
    if (savedFileIsValid) {
      if (!paperInput.ttsTextUrl || Platform.OS === 'web' || existingPaper.ttsPersonalized) {
        return existingPaper;
      }
      try {
        const privateDirectory = `${FileSystem.documentDirectory}offline-materials/`;
        await FileSystem.makeDirectoryAsync(privateDirectory, { intermediates: true });
        const safeName = `${targetId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        const ttsLocalPath = `${privateDirectory}moi_material_${safeName}_lecture.txt`;
        const response = await fetch(paperInput.ttsTextUrl);
        if (!response.ok) throw new Error(`Lecture TXT request failed (${response.status})`);
        const personalizedText = await personalizeLectureText(await response.text());
        await FileSystem.writeAsStringAsync(ttsLocalPath, personalizedText);
        const updatedPaper = { ttsTextUrl: paperInput.ttsTextUrl, ttsLocalUri: ttsLocalPath, ttsPersonalized: true };
        await updatePaperDownloadState(targetId, updatedPaper);
        return { ...existingPaper, ...updatedPaper };
      } catch (ttsError) {
        console.warn('[Offline Download] Lecture TXT could not be saved:', ttsError);
        return existingPaper;
      }
    }
    if (Platform.OS === 'web' && existingPaper.localUri === `offline-web:${targetId}`) {
      await removeOfflineWebPdf(targetId).catch(() => undefined);
    } else if (Platform.OS !== 'web') {
      await FileSystem.deleteAsync(existingPaper.localUri, { idempotent: true }).catch(() => undefined);
    }
    existingPaper = undefined;
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
    ttsTextUrl: paperInput.ttsTextUrl || existingPaper?.ttsTextUrl,
    ttsLocalUri: existingPaper?.ttsLocalUri,
    ttsPersonalized: false,
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
    localUri: undefined,
    status: 'downloading',
    progress: 0,
    pinned: existingPaper?.pinned || false
  };

  if (existingIndex >= 0) papers[existingIndex] = { ...existingPaper, ...newPaperItem };
  else papers.unshift(newPaperItem);
  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  await notifyDownloadListeners();

  if (Platform.OS === 'web') {
    try {
      if (!newPaperItem.fileUrl) throw new Error('This material has no downloadable file URL.');
      const response = await fetch(newPaperItem.fileUrl);
      if (!response.ok) throw new Error(`PDF download failed (${response.status}).`);
      const blob = await response.blob();
      if (!blob.size) throw new Error('The downloaded PDF is empty.');
      if (newPaperItem.fileType === 'pdf' && (await blob.slice(0, 5).text()) !== '%PDF-') {
        throw new Error('The server response is not a valid PDF file.');
      }
      await saveOfflineWebPdf(targetId, blob);
      const localUri = `offline-web:${targetId}`;
      reportProgress(100);
      await updatePaperDownloadState(targetId, { status: 'completed', progress: 100, localUri });
      return { ...newPaperItem, status: 'completed', progress: 100, localUri };
    } catch (error) {
      await updatePaperDownloadState(targetId, { status: 'failed', progress: 0, localUri: undefined });
      throw error;
    }
  }

  try {
    if (!newPaperItem.fileUrl) throw new Error('This material has no downloadable file URL.');
    const safeName = `${targetId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = newPaperItem.fileType === 'pdf' ? 'pdf' : (newPaperItem.fileType || 'bin').replace(/[^a-zA-Z0-9]/g, '');
    const privateDirectory = `${FileSystem.documentDirectory}offline-materials/`;
    await FileSystem.makeDirectoryAsync(privateDirectory, { intermediates: true });
    const localUri = `${privateDirectory}moi_material_${safeName}.${extension}`;
    await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => undefined);
    let lastProgress = 0;
    let lastProgressAt = 0;
    const task = FileSystem.createDownloadResumable(
      newPaperItem.fileUrl,
      localUri,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        const progress = totalBytesExpectedToWrite > 0 ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100) : 0;
        const now = Date.now();
        if (progress === 100 || progress - lastProgress >= 5 || now - lastProgressAt >= 500) {
          lastProgress = progress;
          lastProgressAt = now;
          reportProgress(progress);
          void updatePaperDownloadState(targetId, { progress });
        }
      }
    );
    activeDownloadTasks[targetId] = task;
    const result = await task.downloadAsync();
    delete activeDownloadTasks[targetId];
    if (!result?.uri || result.status < 200 || result.status >= 300) {
      throw new Error(`PDF download did not complete successfully${result?.status ? ` (${result.status})` : ''}.`);
    }
    const downloadedFile = await FileSystem.getInfoAsync(result.uri);
    if (!downloadedFile.exists || !downloadedFile.size || downloadedFile.size <= 0) {
      throw new Error('The downloaded PDF file is missing or empty.');
    }
    const contentType = Object.entries(result.headers || {}).find(([key]) => key.toLowerCase() === 'content-type')?.[1]?.toLowerCase();
    if (newPaperItem.fileType === 'pdf' && contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      throw new Error('The server returned a non-PDF file instead of the requested material.');
    }
    let ttsLocalUri: string | undefined;
    let ttsPersonalized = false;
    if (newPaperItem.ttsTextUrl) {
      try {
        const ttsLocalPath = `${privateDirectory}moi_material_${safeName}_lecture.txt`;
        const response = await fetch(newPaperItem.ttsTextUrl);
        if (!response.ok) throw new Error(`Lecture TXT request failed (${response.status})`);
        const personalizedText = await personalizeLectureText(await response.text());
        await FileSystem.writeAsStringAsync(ttsLocalPath, personalizedText);
        ttsLocalUri = ttsLocalPath;
        ttsPersonalized = true;
      } catch (ttsError) {
        // The material remains usable offline even if its optional lecture recording fails.
        console.warn('[Offline Download] Lecture TXT could not be saved:', ttsError);
      }
    }
    await updatePaperDownloadState(targetId, { status: 'completed', progress: 100, localUri: result.uri, ttsLocalUri, ttsPersonalized } as any);
    reportProgress(100);
    return { ...newPaperItem, status: 'completed', progress: 100, localUri: result.uri, ttsLocalUri, ttsPersonalized };
  } catch (error) {
    delete activeDownloadTasks[targetId];
    const safeName = `${targetId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = newPaperItem.fileType === 'pdf' ? 'pdf' : (newPaperItem.fileType || 'bin').replace(/[^a-zA-Z0-9]/g, '');
    await FileSystem.deleteAsync(`${FileSystem.documentDirectory}offline-materials/moi_material_${safeName}.${extension}`, { idempotent: true }).catch(() => undefined);
    await updatePaperDownloadState(targetId, { status: 'failed', progress: 0, localUri: undefined });
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
  if (paper.ttsLocalUri && Platform.OS !== 'web') {
    await FileSystem.deleteAsync(paper.ttsLocalUri, { idempotent: true }).catch(() => undefined);
  }
  await savePaperForOffline({ ...paper, localUri: undefined, ttsLocalUri: undefined });
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

export const getDownloadedPapers = async (validateFiles = true): Promise<OfflinePaper[]> => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  let papers: OfflinePaper[] = existingStr ? JSON.parse(existingStr) : [];
  if (!existingStr || papers.length === 0) {
    papers = [];
  }
  let repairedMetadata = false;
  if (validateFiles && Platform.OS === 'web') {
    for (const paper of papers) {
      if (paper.status !== 'completed') continue;
      const valid = paper.localUri === `offline-web:${paper._id}` && Boolean(await getOfflineWebPdf(paper._id).catch(() => null));
      if (!valid) {
        paper.status = 'failed';
        paper.progress = 0;
        delete paper.localUri;
        repairedMetadata = true;
      }
    }
  } else if (validateFiles) {
    for (const paper of papers) {
      if (paper.status !== 'completed') continue;
      const fileInfo = paper.localUri ? await FileSystem.getInfoAsync(paper.localUri).catch(() => null) : null;
      if (!fileInfo?.exists || !fileInfo.size || fileInfo.size <= 0) {
        paper.status = 'failed';
        paper.progress = 0;
        delete paper.localUri;
        repairedMetadata = true;
      }
    }
  }
  if (repairedMetadata) await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  return papers.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
};

export const removeOfflinePaper = async (paperId: string) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  const activeTask = activeDownloadTasks[paperId];
  if (activeTask) {
    await activeTask.cancelAsync().catch(() => undefined);
    delete activeDownloadTasks[paperId];
  }
  if (!existingStr) return;

  const papers: OfflinePaper[] = JSON.parse(existingStr);
  const paper = papers.find((item) => item._id === paperId);
  if (Platform.OS === 'web') {
    if (paper?.localUri === `offline-web:${paperId}`) {
      await removeOfflineWebPdf(paperId).catch(() => undefined);
    }
  } else {
    const safeName = `${paperId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = paper?.fileType === 'pdf' ? 'pdf' : (paper?.fileType || 'bin').replace(/[^a-zA-Z0-9]/g, '');
    const privateDirectory = `${FileSystem.documentDirectory}offline-materials/`;
    const knownUris = [
      paper?.localUri,
      paper?.ttsLocalUri,
      `${privateDirectory}moi_material_${safeName}.${extension}`,
      `${privateDirectory}moi_material_${safeName}_lecture.txt`
    ].filter(Boolean) as string[];
    for (const uri of Array.from(new Set(knownUris))) {
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
    }
  }

  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers.filter((item) => item._id !== paperId)));
  await notifyDownloadListeners();
};
export const removeDownloadedPaper = removeOfflinePaper;

export const isPaperDownloaded = async (paperId: string): Promise<boolean> => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  if (!existingStr) return false;
  const papers: OfflinePaper[] = JSON.parse(existingStr);
  const paper = papers.find((item) =>
    (item._id === paperId || item._id === `note_${paperId}` || item._id === `paper_${paperId}`) && item.status === 'completed'
  );
  if (!paper?.localUri) return false;
  if (Platform.OS === 'web') {
    return paper.localUri === `offline-web:${paper._id}` && Boolean(await getOfflineWebPdf(paper._id).catch(() => null));
  }
  const fileInfo = await FileSystem.getInfoAsync(paper.localUri).catch(() => null);
  return Boolean(fileInfo?.exists && fileInfo.size && fileInfo.size > 0);
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
const MATERIAL_SEARCH_HISTORY_KEY = 'moi_material_search_history';

export const getMaterialSearchHistory = async (): Promise<string[]> => {
  try {
    const stored = await getItem(MATERIAL_SEARCH_HISTORY_KEY);
    const history = stored ? JSON.parse(stored) : [];
    return Array.isArray(history) ? history.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const saveMaterialSearchQuery = async (query: string): Promise<string[]> => {
  const cleanQuery = query.trim().replace(/\s+/g, ' ');
  if (!cleanQuery) return getMaterialSearchHistory();
  const existing = await getMaterialSearchHistory();
  const next = [cleanQuery, ...existing.filter((item) => item.toLowerCase() !== cleanQuery.toLowerCase())].slice(0, 12);
  await setItem(MATERIAL_SEARCH_HISTORY_KEY, JSON.stringify(next));
  return next;
};

export const clearMaterialSearchHistory = async (): Promise<void> => {
  await setItem(MATERIAL_SEARCH_HISTORY_KEY, JSON.stringify([]));
};

export interface StudentPersonalDetails {
  admissionNumber?: string;
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

export const personalizeLectureText = async (template: string): Promise<string> => {
  const details = await getStudentPersonalDetails().catch(() => null);
  let signedInName = '';
  try {
    const storedUser = await getStoredToken('moi_user_profile');
    signedInName = storedUser ? String(JSON.parse(storedUser)?.name || '').trim() : '';
  } catch (_) {
    signedInName = '';
  }

  const savedName = String(details?.fullName || '').trim();
  const nameParts = String(signedInName || savedName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const hour = new Date().getHours();
  const timeOfDay = hour >= 5 && hour < 12
    ? 'morning'
    : hour >= 12 && hour < 17
      ? 'afternoon'
      : 'evening';

  return template.replace(/\{\s*(firstname|lastname|nowtime)\s*\}/gi, (_match, field: string) => {
    switch (field.toLowerCase()) {
      case 'firstname':
        return firstName;
      case 'lastname':
        return lastName;
      default:
        return timeOfDay;
    }
  });
};

const COMMUNITY_MESSAGES_KEY = 'moi_community_messages_cache';
const COMMUNITY_MESSAGES_FILE = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}community-messages-cache.json`
  : null;
const LAST_READ_COMMUNITY_KEY = 'moi_community_last_read_id';
const COMMUNITY_SYNC_CURSOR_KEY = 'moi_community_sync_cursor';
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
  // Keep one canonical copy of every message. Socket delivery, delta sync, and
  // the offline queue can all briefly contain the same message under different
  // ids, which otherwise makes the unread badge grow inaccurately.
  const compacted = Array.from(
    new Map(
      messages.map((message) => {
        const normalized = compact(message);
        const key = normalized.clientMsgId || normalized.id || normalized._id || `${normalized.senderEmail || ''}:${normalized.isoDate || ''}:${normalized.text || ''}`;
        return [String(key), normalized] as const;
      })
    ).values()
  );
  const queued = compacted.filter((message) => message.deliveryStatus === 'queued' && message.pendingPayload);
  const history = compacted.filter((message) => !(message.deliveryStatus === 'queued' && message.pendingPayload));

  let persisted = false;
  communityCacheWrite = communityCacheWrite.catch(() => undefined).then(async () => {
    let lastError: unknown;
    const fallbackCounts = [MAX_CACHED_COMMUNITY_MESSAGES, 80, 40, 20, 0].filter((count) => count < history.length);
    for (const keepCount of [history.length, ...fallbackCounts]) {
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
        persisted = true;
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
  return persisted;
};

export const getCommunitySyncCursor = async (): Promise<string | null> => {
  const value = await getItem(COMMUNITY_SYNC_CURSOR_KEY);
  return value || null;
};

export const saveCommunitySyncCursor = async (cursor: string): Promise<void> => {
  if (!cursor) return;
  const current = await getItem(COMMUNITY_SYNC_CURSOR_KEY);
  const currentTime = current ? Date.parse(current) : NaN;
  const nextTime = Date.parse(cursor);
  // Multiple reconnect/background syncs can finish out of order. Never let
  // an older response move the durable cursor backwards and hide later posts.
  if (Number.isFinite(currentTime) && Number.isFinite(nextTime) && nextTime < currentTime) return;
  await setItem(COMMUNITY_SYNC_CURSOR_KEY, cursor);
};

let communityCursorInitialization: Promise<string> | null = null;

export const ensureCommunitySyncCursor = async (): Promise<string> => {
  const existing = await getCommunitySyncCursor();
  if (existing) return existing;
  if (!communityCursorInitialization) {
    communityCursorInitialization = (async () => {
      const current = await getCommunitySyncCursor();
      if (current) return current;
      const cachedMessages = await getStoredCommunityMessages();
      const latestCachedTimestamp = cachedMessages.reduce((latest: string, message: any) => {
        if (message.deliveryStatus === 'queued' || message.pendingPayload) return latest;
        const timestamp = message.updatedAt || message.isoDate || message.createdAt || '';
        return timestamp > latest ? timestamp : latest;
      }, '');
      if (latestCachedTimestamp) {
        await saveCommunitySyncCursor(latestCachedTimestamp);
        return latestCachedTimestamp;
      }

      const baseline = await apiRequest<any>('/community/messages?limit=1');
      const serverCursor = baseline?.success ? String((baseline as any).syncedAt || (baseline as any).data?.syncedAt || '') : '';
      if (serverCursor && !Number.isNaN(Date.parse(serverCursor))) {
        await saveCommunitySyncCursor(serverCursor);
        return serverCursor;
      }

      return '';
    })();
  }
  try {
    return await communityCursorInitialization;
  } finally {
    communityCursorInitialization = null;
  }
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

  if (!messages || messages.length === 0 || !lastReadId) return 0;

  const index = messages.findIndex((m: any) => (m.id || m._id) === lastReadId);
  // The cache is intentionally compacted. If the old read marker has already
  // fallen out of that compact window, do not treat every cached row as new.
  // That is the source of the badge jumping to a large number after relaunch.
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

  let unreadMessages: any[] = [];
  if (!lastReadId) {
    unreadMessages = messages;
  } else {
    const lastReadIndex = messages.findIndex((message: any) => (message.id || message._id) === lastReadId);
    if (lastReadIndex === -1) {
      unreadMessages = [];
    } else {
      unreadMessages = messages.slice(lastReadIndex + 1);
    }
  }

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

let backgroundSyncInFlight = false;

export const syncCommunityUnreadBackground = async (options: { notify?: boolean } = {}): Promise<void> => {
  if (backgroundSyncInFlight) return;
  backgroundSyncInFlight = true;
  try {
    let storedCursor = await ensureCommunitySyncCursor();
    if (!storedCursor) return;
    const cachedMsgs = await getStoredCommunityMessages();
    let updated = [...cachedMsgs];
    let changed = false;
    const existingIds = new Set(cachedMsgs.map((message: any) => String(message.id || message._id || message.clientMsgId || '')));
    const newServerMessages: any[] = [];
    let hasMore = true;
    let page = 0;
    let syncWatermark = '';
    let syncAfterId = '';

    // Consume every delta page before committing the final cursor. This prevents
    // a busy community from losing messages beyond the first 50 results.
    while (hasMore && page < 100) {
      const query = `?since=${encodeURIComponent(storedCursor)}&limit=50${syncWatermark ? `&until=${encodeURIComponent(syncWatermark)}` : ''}${syncAfterId ? `&sinceId=${encodeURIComponent(syncAfterId)}` : ''}`;
      const res = await apiRequest<any>(`/community/messages${query}`);
      const anyRes: any = res;
      syncWatermark = syncWatermark || anyRes.syncedAt || anyRes.data?.syncedAt || '';
      const responseMessages = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data : [];
      if (!res?.success || !Array.isArray(responseMessages)) break;

      for (const serverMsg of responseMessages) {
        const formattedId = serverMsg._id || serverMsg.id;
        const existingIdx = updated.findIndex((m: any) =>
          (serverMsg.clientMsgId && m.clientMsgId === serverMsg.clientMsgId) ||
          (serverMsg.clientMsgId && m.id === serverMsg.clientMsgId) ||
          (m.id || m._id) === formattedId
        );

        const formattedMsg = {
          id: formattedId,
          clientMsgId: serverMsg.clientMsgId,
          senderId: serverMsg.senderId,
          senderEmail: serverMsg.senderEmail,
          senderName: serverMsg.senderName || 'Moi Student',
          senderFaculty: serverMsg.senderFaculty || 'Main Campus',
          senderCourse: serverMsg.senderCourse,
          senderPhone: serverMsg.senderPhone,
          senderAvatarUrl: serverMsg.senderAvatarUrl,
          avatarBg: serverMsg.avatarBg || '#15803d',
          text: serverMsg.text || '',
          timestamp: new Date(serverMsg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isoDate: serverMsg.createdAt,
          updatedAt: serverMsg.updatedAt,
          fileAttachment: serverMsg.fileAttachment,
          stickerId: serverMsg.stickerId,
          replyTo: serverMsg.replyTo,
          reactions: serverMsg.reactions || {}
        };

        if (existingIdx !== -1) {
          updated[existingIdx] = { ...updated[existingIdx], ...formattedMsg };
          changed = true;
        } else {
          updated.push(formattedMsg);
          changed = true;
          if (!existingIds.has(String(formattedId))) {
            newServerMessages.push(serverMsg);
            existingIds.add(String(formattedId));
          }
        }
      }

      hasMore = anyRes.hasMore === true || anyRes.data?.hasMore === true;
      page += 1;
      const serverSyncedAt = syncWatermark || anyRes.syncedAt || anyRes.data?.syncedAt || storedCursor;
      if (responseMessages.length > 0) {
        const lastMessage = responseMessages[responseMessages.length - 1];
        if (hasMore) {
          storedCursor = lastMessage.updatedAt || lastMessage.createdAt || serverSyncedAt;
          syncAfterId = String(lastMessage._id || lastMessage.id || '');
        } else {
          storedCursor = serverSyncedAt;
        }
      } else {
        hasMore = false;
        storedCursor = serverSyncedAt;
      }
    }

    if (changed) {
      const saved = await saveCommunityMessages(updated);
      if (!saved) return;

        // Keep a compact device alert for community messages received while offline.
      const newMessagesFromOthers = newServerMessages;
      if (options.notify !== false && newMessagesFromOthers.length > 0) {
          try {
            if (newMessagesFromOthers.length === 1) {
              const single = newMessagesFromOthers[0];
              const text = single.text || (single.fileAttachment ? '📎 Sent a file' : 'Sent a message');
              void scheduleLocalMissedMessagesNotification(
                single.senderName || 'Moi Student',
                text,
                'community'
              );
            } else {
              const names = Array.from(new Set(newMessagesFromOthers.map((m: any) => m.senderName || 'Moi Student'))).slice(0, 3).join(', ');
              void scheduleLocalMissedMessagesNotification(
                'Missed Community Messages',
                `${newMessagesFromOthers.length} new messages from ${names} while offline.`,
                'community'
              );
            }
          } catch (e) {}
      }
    }
    if (hasMore) return;
    if (storedCursor) await saveCommunitySyncCursor(storedCursor);
  } catch {
    // Silent catch for background unread poll
  } finally {
    backgroundSyncInFlight = false;
  }
};

const READ_NOTIFICATIONS_KEY = 'moi_read_notification_ids';

export const getReadNotificationIds = async (): Promise<string[]> => {
  try {
    const raw = await getItem(READ_NOTIFICATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
};

export const saveReadNotificationId = async (id: string): Promise<void> => {
  try {
    const existing = await getReadNotificationIds();
    if (!existing.includes(id)) {
      existing.push(id);
      await setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(existing));
    }
  } catch (_) {}
};

export const saveReadNotificationIdsBatch = async (ids: string[]): Promise<void> => {
  try {
    const existing = await getReadNotificationIds();
    const set = new Set([...existing, ...ids]);
    await setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(set)));
  } catch (_) {}
};

const DELETED_FOR_ME_KEY = 'moi_community_deleted_for_me_ids';

export const getDeletedForMeMessageIds = async (): Promise<string[]> => {
  try {
    const raw = await getItem(DELETED_FOR_ME_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveDeletedForMeMessageId = async (id: string): Promise<void> => {
  try {
    const existing = await getDeletedForMeMessageIds();
    if (!existing.includes(id)) {
      existing.push(id);
      await setItem(DELETED_FOR_ME_KEY, JSON.stringify(existing));
    }
  } catch {}
};
