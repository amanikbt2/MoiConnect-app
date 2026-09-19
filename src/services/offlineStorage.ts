import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { IPaper, IHouse, IConversation, IMessage } from '@moi/shared';

const OFFLINE_PAPERS_KEY = 'moi_offline_papers';
const OFFLINE_HOUSES_KEY = 'moi_offline_houses';
const OFFLINE_MSG_QUEUE_KEY = 'moi_offline_msg_queue';

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

export const savePaperForOffline = async (paper: IPaper) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  let papers: IPaper[] = existingStr ? JSON.parse(existingStr) : [];
  if (!papers.some((p) => p._id === paper._id)) {
    papers.push(paper);
    await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
  }
};

export const getDownloadedPapers = async (): Promise<IPaper[]> => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  return existingStr ? JSON.parse(existingStr) : [];
};

export const removeOfflinePaper = async (paperId: string) => {
  const existingStr = await getItem(OFFLINE_PAPERS_KEY);
  if (!existingStr) return;
  let papers: IPaper[] = JSON.parse(existingStr);
  papers = papers.filter((p) => p._id !== paperId);
  await setItem(OFFLINE_PAPERS_KEY, JSON.stringify(papers));
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
