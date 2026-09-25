import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  PanResponder,
  Animated,
  Easing,
  Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../src/context/AuthContext';
import { useAppNavigation } from '../src/utils/navigation';
import {
  SendIcon,
  UsersIcon,
  CheckIcon,
  PaperclipIcon,
  SmileIcon,
  FileTextIcon,
  DownloadIcon,
  TrashIcon,
  ReplyIcon,
  FolderIcon,
  CloseIcon
} from '../src/components/Icons';
import { getSocket } from '../src/services/socket';
import { apiRequest } from '../src/services/api';
import {
  saveDownloadedPaper,
  getDownloadedPapers,
  getStoredCommunityMessages,
  saveCommunityMessages,
  getLastReadCommunityMsgId,
  saveLastReadCommunityMsgId,
  getStudentPersonalDetails,
  StudentPersonalDetails
} from '../src/services/offlineStorage';
import { setupNotificationResponseListener, sendWebBrowserNotification } from '../src/services/notificationService';

export interface FileAttachment {
  name: string;
  url: string;
  size: string;
  type: 'pdf' | 'doc' | 'image';
}

export interface CommunityMessage {
  id: string;
  clientMsgId?: string;
  senderId?: string;
  senderName: string;
  senderFaculty: string;
  avatarBg: string;
  text: string;
  timestamp: string;
  isoDate?: string;
  isMe: boolean;
  isSystemNotice?: boolean;
  eventType?: 'user_connected' | 'user_disconnected' | 'security' | string;
  fileAttachment?: FileAttachment;
  reactions?: Record<string, number>;
  myReaction?: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
    fileAttachment?: FileAttachment;
  };
}

const EMOJI_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];

function SwipeableMessageItem({
  children,
  onReply
}: {
  children: React.ReactNode;
  onReply: () => void;
}) {
  const panX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          const resistance = 1 + gestureState.dx / 140;
          const translated = Math.min(gestureState.dx / resistance, 70);
          panX.setValue(translated);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 45) {
          onReply();
        }
        Animated.spring(panX, {
          toValue: 0,
          friction: 7,
          tension: 90,
          useNativeDriver: Platform.OS !== 'web'
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web'
        }).start();
      }
    })
  ).current;

  const iconScale = panX.interpolate({
    inputRange: [0, 30, 60],
    outputRange: [0.4, 0.9, 1.15],
    extrapolate: 'clamp'
  });

  const iconOpacity = panX.interpolate({
    inputRange: [0, 15, 45],
    outputRange: [0, 0.6, 1],
    extrapolate: 'clamp'
  });

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      <Animated.View
        style={{
          position: 'absolute',
          left: 10,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
          opacity: iconOpacity,
          transform: [{ scale: iconScale }]
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#dcfce7',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: '#bbf7d0',
            shadowColor: '#15803d',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <ReplyIcon color="#15803d" size={16} />
        </View>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: panX }],
          width: '100%'
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

interface TypingUser {
  userId: string;
  userName: string;
}

function formatTypingText(users: TypingUser[]): string {
  if (users.length === 0) return '';
  if (users.length === 1) return `${users[0].userName} is typing...`;
  if (users.length === 2) return `${users[0].userName} & ${users[1].userName} are typing...`;
  return 'Several people are typing...';
}

export function formatStudentSubtitle(
  school?: string,
  course?: string,
  yearOfStudy?: string,
  facultyFallback?: string
): string {
  let programStr = course?.trim() || school?.trim() || facultyFallback?.trim() || '';

  let existingYearStr = '';
  const yearMatchInProg = programStr.match(/\s+Y[1-6]$/i);
  if (yearMatchInProg) {
    existingYearStr = yearMatchInProg[0].trim().toUpperCase();
    programStr = programStr.replace(/\s+Y[1-6]$/i, '').trim();
  }

  const lower = programStr.toLowerCase();
  if (
    !programStr ||
    lower === 'main campus' ||
    lower === 'main campus student' ||
    lower === 'moi student' ||
    lower === 'moi university student' ||
    lower === 'school of science & computing' ||
    lower === 'moi university'
  ) {
    programStr = '';
  }

  let yearStr = existingYearStr;
  if (!yearStr && yearOfStudy) {
    const yTrim = yearOfStudy.trim();
    if (/^Y[1-6]$/i.test(yTrim)) {
      yearStr = yTrim.toUpperCase();
    } else if (yTrim.toLowerCase().includes('year')) {
      const match = yTrim.match(/\d+/);
      if (match) {
        yearStr = `Y${match[0]}`;
      }
    } else if (/^[1-6]$/.test(yTrim)) {
      yearStr = `Y${yTrim}`;
    }
  }

  if (programStr && yearStr) {
    return `${programStr} ${yearStr}`;
  }
  if (programStr) {
    return programStr;
  }
  if (yearStr) {
    return `Moi University Student ${yearStr}`;
  }

  return 'Moi University Student';
}

const SAMPLE_ATTACHMENTS: FileAttachment[] = [
  {
    name: 'COM_310_CAT1_Timetable_2025.pdf',
    url: 'https://res.cloudinary.com/mconnect/docs/com310_cat1.pdf',
    size: '1.4 MB',
    type: 'pdf'
  },
  {
    name: 'Data_Structures_Trees_Notes.pdf',
    url: 'https://res.cloudinary.com/mconnect/docs/data_structures.pdf',
    size: '2.1 MB',
    type: 'pdf'
  },
  {
    name: 'Annex_Bus_Timetable_Sem2.jpg',
    url: 'https://res.cloudinary.com/mconnect/docs/bus_schedule.jpg',
    size: '480 KB',
    type: 'image'
  }
];

const INITIAL_COMMUNITY_MESSAGES: CommunityMessage[] = [
  {
    id: '1',
    senderName: 'Mercy Chebet',
    senderFaculty: 'School of Information Sciences',
    avatarBg: '#3b82f6',
    text: 'Jambo everyone! 👋 Does anyone have the revised COM 310 CAT 1 timetable for this Friday?',
    timestamp: '09:42 AM',
    isoDate: new Date(Date.now() - 3600000 * 3).toISOString(),
    isMe: false,
    reactions: { '❤️': 4, '👍': 2 }
  },
  {
    id: '2',
    senderName: 'Brian Kipkurui',
    senderFaculty: 'Engineering Y4',
    avatarBg: '#10b981',
    text: 'Yes Mercy, it was shifted to 2:00 PM at Margaret Thatcher Library hall B. Here is the PDF document details attachment:',
    timestamp: '09:45 AM',
    isoDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    isMe: false,
    fileAttachment: {
      name: 'COM_310_CAT1_Revision_Notes.pdf',
      url: 'https://res.cloudinary.com/mconnect/docs/com310_notes.pdf',
      size: '1.8 MB',
      type: 'pdf'
    },
    reactions: { '👍': 9, '🔥': 5 }
  },
  {
    id: '3',
    senderName: 'Amina Hassan',
    senderFaculty: 'School of Law',
    avatarBg: '#ec4899',
    text: 'Quick notice: The Annex Hostel bus departs main campus at 1:15 PM today 🚌 Please don’t be late!',
    timestamp: '10:02 AM',
    isoDate: new Date(Date.now() - 3600000 * 1).toISOString(),
    isMe: false,
    reactions: { '❤️': 15, '🙏': 3 }
  },
  {
    id: '4',
    senderName: 'David Omondi',
    senderFaculty: 'Computer Science Y3',
    avatarBg: '#8b5cf6',
    text: 'We are hosting a React Native & Node.js tech workshop at the Innovation Hub tomorrow 4PM. Everyone is welcome! 🚀⚡',
    timestamp: '10:15 AM',
    isoDate: new Date(Date.now() - 1800000).toISOString(),
    isMe: false,
    reactions: { '🔥': 22, '👍': 11 }
  }
];

export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useAppNavigation();

  const [messages, setMessages] = useState<CommunityMessage[]>(INITIAL_COMMUNITY_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<FileAttachment[]>(SAMPLE_ATTACHMENTS);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [myProfile, setMyProfile] = useState<StudentPersonalDetails | null>(null);

  useEffect(() => {
    getStudentPersonalDetails().then((details) => {
      if (details) setMyProfile(details);
    });
  }, []);

  // Smart Mention & Reply Tracking State
  const [unreadMentionIds, setUnreadMentionIds] = useState<string[]>([]);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const dismissedMentionIds = useRef<Set<string>>(new Set());
  const tempSentIdsRef = useRef<Set<string>>(new Set());

  // WhatsApp-style Unread Tracking & Auto-scroll State
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showUnreadBtn, setShowUnreadBtn] = useState<boolean>(false);

  // WhatsApp-Style Live Typing Indicator State & Animation
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const myTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const typingDotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (typingUsers.length > 0) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(typingDotAnim, { toValue: 1, duration: 400, easing: Easing.ease, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(typingDotAnim, { toValue: 0, duration: 400, easing: Easing.ease, useNativeDriver: Platform.OS !== 'web' })
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      typingDotAnim.setValue(0);
    }
  }, [typingUsers.length]);

  const flatListRef = useRef<FlatList>(null);
  const lastSyncedISO = useRef<string | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const initialScrollDoneRef = useRef<boolean>(false);
  const evalIsMe = (msgSenderId: any, msgSenderName?: string, msgClientMsgId?: string): boolean => {
    if (msgClientMsgId && tempSentIdsRef.current.has(msgClientMsgId)) {
      return true;
    }

    if (user && user._id) {
      const sId = typeof msgSenderId === 'object' ? msgSenderId?._id?.toString() || msgSenderId?.toString() : msgSenderId?.toString();
      if (sId && sId === user._id.toString()) {
        return true;
      }
    }

    if (user && user.name && msgSenderName) {
      const trimmedUserName = user.name.trim().toLowerCase();
      const isGeneric = trimmedUserName === 'moi student' || trimmedUserName === 'student' || trimmedUserName === '';
      if (!isGeneric && msgSenderName.trim().toLowerCase() === trimmedUserName) {
        return true;
      }
    }

    return false;
  };

  const checkIsMentionOrReply = (msg: CommunityMessage, currUser: any, allMsgs: CommunityMessage[]): boolean => {
    if (!currUser || msg.isMe) return false;

    // 1. Reply check: if someone replied to my text
    if (msg.replyTo) {
      if (msg.replyTo.senderName && currUser.name && msg.replyTo.senderName.toLowerCase().trim() === currUser.name.toLowerCase().trim()) {
        return true;
      }
      const parentMsg = allMsgs.find((p) => p.id === msg.replyTo?.id);
      if (parentMsg && parentMsg.isMe) return true;
    }

    // 2. Mention check: text contains @MyName or @MyFirstName
    if (currUser.name && msg.text) {
      const textLower = msg.text.toLowerCase();
      const fullNameLower = currUser.name.toLowerCase().trim();
      const firstNameLower = currUser.name.split(' ')[0]?.toLowerCase().trim();

      if (textLower.includes(`@${fullNameLower}`) || (firstNameLower && firstNameLower.length >= 2 && textLower.includes(`@${firstNameLower}`))) {
        return true;
      }
    }

    return false;
  };

  useEffect(() => {
    if (!user || messages.length === 0) return;

    const mentions = messages
      .filter((m) => checkIsMentionOrReply(m, user, messages) && !dismissedMentionIds.current.has(m.id))
      .map((m) => m.id);

    setUnreadMentionIds(mentions);
  }, [messages, user]);

  const scrollToMessage = (targetId: string) => {
    const targetIndex = messages.findIndex((m) => m.id === targetId);
    if (targetIndex !== -1 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.5
        });
      } catch (e) {
        try {
          flatListRef.current.scrollToItem({ item: messages[targetIndex], animated: true });
        } catch (err) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }

      setHighlightedMsgId(targetId);
      setTimeout(() => {
        setHighlightedMsgId((curr) => (curr === targetId ? null : curr));
      }, 2500);
    }
  };

  const handleJumpToNextMention = () => {
    if (unreadMentionIds.length === 0) return;

    const targetId = unreadMentionIds[0];
    dismissedMentionIds.current.add(targetId);
    scrollToMessage(targetId);

    setUnreadMentionIds((prev) => prev.filter((id) => id !== targetId));
  };

  const initReadStateAndScroll = async (currentMsgs: CommunityMessage[]) => {
    if (currentMsgs.length === 0) return;
    const lastReadId = await getLastReadCommunityMsgId();

    if (!lastReadId) {
      const latestId = currentMsgs[currentMsgs.length - 1].id;
      await saveLastReadCommunityMsgId(latestId);
      setUnreadCount(0);
      setFirstUnreadMsgId(null);
      setShowUnreadBtn(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        initialScrollDoneRef.current = true;
      }, 150);
      return;
    }

    const lastReadIndex = currentMsgs.findIndex((m) => m.id === lastReadId);
    if (lastReadIndex !== -1 && lastReadIndex < currentMsgs.length - 1) {
      const firstUnreadIndex = lastReadIndex + 1;
      const firstUnreadId = currentMsgs[firstUnreadIndex].id;
      const count = currentMsgs.length - firstUnreadIndex;
      setFirstUnreadMsgId(firstUnreadId);
      setUnreadCount(count);
      setShowUnreadBtn(true);

      if (!initialScrollDoneRef.current) {
        initialScrollDoneRef.current = true;
        setTimeout(() => {
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToIndex({
                index: firstUnreadIndex,
                animated: false,
                viewPosition: 0.1
              });
            } catch (e) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }
        }, 200);
      }
    } else {
      setUnreadCount(0);
      setFirstUnreadMsgId(null);
      setShowUnreadBtn(false);
      if (!initialScrollDoneRef.current) {
        initialScrollDoneRef.current = true;
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 150);
      }
    }
  };

  const markAsRead = async (latestId: string) => {
    await saveLastReadCommunityMsgId(latestId);
    setUnreadCount(0);
    setFirstUnreadMsgId(null);
    setShowUnreadBtn(false);
  };

  const scrollToBottomAndMarkRead = () => {
    if (messages.length > 0) {
      const latestId = messages[messages.length - 1].id;
      markAsRead(latestId);
    }
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 120;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isNearBottomRef.current = isBottom;

    if (isBottom && messages.length > 0) {
      const latestId = messages[messages.length - 1].id;
      saveLastReadCommunityMsgId(latestId);
      if (unreadCount > 0 || showUnreadBtn || firstUnreadMsgId) {
        setUnreadCount(0);
        setShowUnreadBtn(false);
        setFirstUnreadMsgId(null);
      }
    }
  };

  useEffect(() => {
    // 1. Register push notification click tap listener for automatic navigation
    const cleanupNotif = setupNotificationResponseListener((screenPath) => {
      router.push(screenPath as any);
    });

    // 2. Instant Load from Phone Storage (0ms UI latency)
    getStoredCommunityMessages().then((cachedMsgs) => {
      const rawMsgs = cachedMsgs && cachedMsgs.length > 0 ? cachedMsgs : INITIAL_COMMUNITY_MESSAGES;
      const msgsToLoad = rawMsgs.map((m) => ({
        ...m,
        isMe: evalIsMe(m.senderId, m.senderName, m.clientMsgId)
      }));
      setMessages(msgsToLoad);
      lastSyncedISO.current = msgsToLoad[msgsToLoad.length - 1]?.isoDate || new Date().toISOString();
      if (!cachedMsgs || cachedMsgs.length === 0) {
        saveCommunityMessages(INITIAL_COMMUNITY_MESSAGES);
      }
      initReadStateAndScroll(msgsToLoad);
    });

    // 3. Connect Real-time WebSocket Listeners
    let activeSocket: any = null;
    getSocket().then((socket) => {
      if (socket) {
        activeSocket = socket;
        socket.emit('join_community');

        socket.on('community:receive_message', (serverMsg: any) => {
          const isMyMsg = evalIsMe(serverMsg.senderId, serverMsg.senderName, serverMsg.clientMsgId);

          const formattedMsg: CommunityMessage = {
            id: serverMsg._id || serverMsg.id || serverMsg.clientMsgId || Date.now().toString(),
            clientMsgId: serverMsg.clientMsgId,
            senderId: serverMsg.senderId,
            senderName: serverMsg.senderName || 'Moi Student',
            senderFaculty: serverMsg.senderFaculty || 'Main Campus',
            avatarBg: serverMsg.avatarBg || '#15803d',
            text: serverMsg.text || '',
            timestamp: new Date(serverMsg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isoDate: serverMsg.createdAt || new Date().toISOString(),
            isMe: isMyMsg,
            fileAttachment: serverMsg.fileAttachment,
            replyTo: serverMsg.replyTo,
            reactions: serverMsg.reactions || {}
          };

          setMessages((prev) => {
            const existingIdx = prev.findIndex((m) =>
              (serverMsg.clientMsgId && m.clientMsgId === serverMsg.clientMsgId) ||
              (serverMsg.clientMsgId && m.id === serverMsg.clientMsgId) ||
              m.id === formattedMsg.id ||
              m.id === serverMsg._id ||
              (m.isMe && isMyMsg && m.text.trim() === formattedMsg.text.trim() && Math.abs(new Date(m.isoDate || 0).getTime() - new Date(formattedMsg.isoDate || 0).getTime()) < 40000)
            );

            let updated: CommunityMessage[];
            if (existingIdx !== -1) {
              updated = [...prev];
              const wasMe = (serverMsg.clientMsgId && tempSentIdsRef.current.has(serverMsg.clientMsgId)) || isMyMsg;
              updated[existingIdx] = {
                ...updated[existingIdx],
                ...formattedMsg,
                id: serverMsg._id || serverMsg.id || updated[existingIdx].id,
                isMe: wasMe
              };
            } else {
              updated = [...prev, formattedMsg];
            }
            saveCommunityMessages(updated);

            if (formattedMsg.isMe || isNearBottomRef.current) {
              markAsRead(formattedMsg.id);
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 80);
            } else {
              setUnreadCount((c) => c + 1);
              setShowUnreadBtn(true);
              setFirstUnreadMsgId((prevUnread) => prevUnread || formattedMsg.id);
            }

            return updated;
          });

          if (serverMsg.senderId) {
            const sId = typeof serverMsg.senderId === 'object' ? serverMsg.senderId._id : serverMsg.senderId;
            setTypingUsers((prev) => prev.filter((u) => u.userId !== sId));
          }

          if (!formattedMsg.isMe && Platform.OS === 'web') {
            sendWebBrowserNotification(
              `💬 ${formattedMsg.senderName}`,
              formattedMsg.text || `📎 Sent a file: ${formattedMsg.fileAttachment?.name || 'Attachment'}`,
              () => router.push('/(tabs)/messages')
            );
          }
        });

        socket.on('community:user_typing', (data: { userId: string; userName: string }) => {
          if (!data || !data.userId) return;
          if (user && (user._id === data.userId || (user.name && user.name.toLowerCase().trim() === data.userName?.toLowerCase().trim()))) {
            return;
          }

          setTypingUsers((prev) => {
            if (prev.some((u) => u.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, userName: data.userName || 'Moi Student' }];
          });

          if (typingTimeoutsRef.current[data.userId]) {
            clearTimeout(typingTimeoutsRef.current[data.userId]);
          }
          typingTimeoutsRef.current[data.userId] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            delete typingTimeoutsRef.current[data.userId];
          }, 3500);
        });

        socket.on('community:user_stop_typing', (data: { userId: string }) => {
          if (!data || !data.userId) return;
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
          if (typingTimeoutsRef.current[data.userId]) {
            clearTimeout(typingTimeoutsRef.current[data.userId]);
            delete typingTimeoutsRef.current[data.userId];
          }
        });

        socket.on('community:reaction_updated', (data: { messageId: string; reactions: any }) => {
          setMessages((prev) => {
            const updated = prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
            saveCommunityMessages(updated);
            return updated;
          });
        });

        socket.on('community:system_event', (eventData: any) => {
          const sysMsg: CommunityMessage = {
            id: eventData.id || `sys_${Date.now()}`,
            senderName: 'System',
            senderFaculty: '',
            avatarBg: '#64748b',
            text: eventData.text || `${eventData.userName || 'Student'} ${eventData.event === 'user_connected' ? 'logged into MoiConnect' : 'went offline'}`,
            timestamp: new Date(eventData.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isoDate: eventData.timestamp || new Date().toISOString(),
            isMe: false,
            isSystemNotice: true,
            eventType: eventData.event || 'user_connected'
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === sysMsg.id)) return prev;
            const updated = [...prev, sysMsg];
            return updated;
          });
        });
      }
    });

    // 4. Trigger Incremental Delta Sync (Fetch new un-synced messages since timestamp)
    fetchDeltaSync();

    return () => {
      cleanupNotif();
      if (activeSocket) {
        activeSocket.off('community:receive_message');
        activeSocket.off('community:user_typing');
        activeSocket.off('community:user_stop_typing');
        activeSocket.off('community:reaction_updated');
        activeSocket.off('community:system_event');
      }
    };
  }, [user]);

  const fetchDeltaSync = async () => {
    try {
      const sinceParam = lastSyncedISO.current ? `?since=${encodeURIComponent(lastSyncedISO.current)}` : '';
      const res = await apiRequest<{ success: boolean; data: any[]; syncedAt: string }>(`/community/messages${sinceParam}`);
      if (res && res.success && res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const fetchedMsgs: CommunityMessage[] = res.data.data.map((serverMsg: any) => {
          const isMyMsg = evalIsMe(serverMsg.senderId, serverMsg.senderName, serverMsg.clientMsgId);
          return {
            id: serverMsg._id || serverMsg.id,
            clientMsgId: serverMsg.clientMsgId,
            senderId: serverMsg.senderId,
            senderName: serverMsg.senderName || 'Moi Student',
            senderFaculty: serverMsg.senderFaculty || 'Main Campus',
            avatarBg: serverMsg.avatarBg || '#15803d',
            text: serverMsg.text || '',
            timestamp: new Date(serverMsg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isoDate: serverMsg.createdAt,
            isMe: isMyMsg,
            fileAttachment: serverMsg.fileAttachment,
            replyTo: serverMsg.replyTo,
            reactions: serverMsg.reactions || {}
          };
        });

        setMessages((prev) => {
          let updated = [...prev];
          let changed = false;

          for (const msg of fetchedMsgs) {
            const existingIdx = updated.findIndex((m) =>
              (msg.clientMsgId && m.clientMsgId === msg.clientMsgId) ||
              (msg.clientMsgId && m.id === msg.clientMsgId) ||
              m.id === msg.id ||
              (m.isMe && msg.isMe && m.text.trim() === msg.text.trim() && Math.abs(new Date(m.isoDate || 0).getTime() - new Date(msg.isoDate || 0).getTime()) < 40000)
            );

            if (existingIdx !== -1) {
              const wasMe = (msg.clientMsgId && tempSentIdsRef.current.has(msg.clientMsgId)) || msg.isMe;
              updated[existingIdx] = { ...updated[existingIdx], ...msg, isMe: wasMe };
              changed = true;
            } else {
              updated.push(msg);
              changed = true;
            }
          }

          if (!changed) return prev;
          saveCommunityMessages(updated);
          return updated;
        });

        if (res.data.syncedAt) {
          lastSyncedISO.current = res.data.syncedAt;
        }
      }
    } catch (err) {
      console.log('Delta sync fallback:', err);
    }
  };

  useEffect(() => {
    if (showFileModal) {
      loadFiles();
    }
  }, [showFileModal]);

  const loadFiles = async () => {
    try {
      const downloaded = await getDownloadedPapers();
      const converted: FileAttachment[] = downloaded.map((p) => ({
        name: `${p.unitCode || 'NOTE'}_${(p.title || 'Material').replace(/[^a-zA-Z0-9_]/g, '_')}.pdf`,
        url: p.fileUrl || 'https://res.cloudinary.com/mconnect/docs/sample.pdf',
        size: '1.8 MB',
        type: 'pdf'
      }));
      const combined = [...converted, ...SAMPLE_ATTACHMENTS];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
      setAvailableFiles(unique);
    } catch (e) {
      setAvailableFiles(SAMPLE_ATTACHMENTS);
    }
  };
  const handleInputChange = (text: string) => {
    setInputText(text);

    if (text.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        getSocket().then((s) => {
          if (s) {
            s.emit('community:start_typing', {
              userName: user?.name || 'Moi Student',
              userId: user?._id
            });
          }
        });
      }

      if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
      myTypingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        getSocket().then((s) => {
          if (s) {
            s.emit('community:stop_typing', {
              userName: user?.name || 'Moi Student',
              userId: user?._id
            });
          }
        });
      }, 2500);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
        getSocket().then((s) => {
          if (s) {
            s.emit('community:stop_typing', {
              userName: user?.name || 'Moi Student',
              userId: user?._id
            });
          }
        });
      }
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() && !selectedFile) return;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
      getSocket().then((s) => {
        if (s) {
          s.emit('community:stop_typing', {
            userName: user?.name || 'Moi Student',
            userId: user?._id
          });
        }
      });
    }

    const sentText = inputText.trim();
    const isBotMentioned = sentText.toLowerCase().includes('@bot');

    const replyToData = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          text: replyingTo.text,
          fileAttachment: replyingTo.fileAttachment
        }
      : undefined;

    const tempId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    tempSentIdsRef.current.add(tempId);

    const facultySubtitle = formatStudentSubtitle(
      myProfile?.school,
      myProfile?.course,
      myProfile?.yearOfStudy,
      (user as any)?.department
    );

    const payload = {
      clientMsgId: tempId,
      senderId: user ? user._id : undefined,
      text: sentText,
      fileAttachment: selectedFile || undefined,
      replyTo: replyToData,
      senderName: user ? user.name : 'Moi Student',
      senderFaculty: facultySubtitle,
      avatarBg: '#15803d'
    };

    const newMessage: CommunityMessage = {
      id: tempId,
      clientMsgId: tempId,
      senderId: user ? user._id : undefined,
      senderName: payload.senderName,
      senderFaculty: payload.senderFaculty,
      avatarBg: payload.avatarBg,
      text: sentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isoDate: new Date().toISOString(),
      isMe: true,
      fileAttachment: selectedFile || undefined,
      replyTo: replyToData,
      reactions: {}
    };

    // 1. Instant Optimistic Render & Save to Local Phone Storage
    setMessages((prev) => {
      const updated = [...prev, newMessage];
      saveCommunityMessages(updated);
      markAsRead(newMessage.id);
      return updated;
    });

    setInputText('');
    setSelectedFile(null);
    setReplyingTo(null);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);

    // 2. Emit Real-time via WebSocket (Sub-10ms delivery to connected users)
    getSocket().then((socket) => {
      if (socket) {
        socket.emit('community:send_message', payload);
      }
    });

    // 3. HTTP Fallback to guarantee MongoDB persistence & trigger Push Notifications
    apiRequest('/community/messages', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch((e) => console.log('HTTP post fallback:', e));

    // Auto Bot Response
    if (isBotMentioned) {
      setTimeout(() => {
        const botMessage: CommunityMessage = {
          id: (Date.now() + 1).toString(),
          senderName: 'Campus Bot 🤖',
          senderFaculty: 'Moi Uni AI Assistant',
          avatarBg: '#6366f1',
          text: 'Hello! 🤖 I am Campus Bot. How can I help you today? You can ask me about past papers, rental hostels, or campus announcements!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isoDate: new Date().toISOString(),
          isMe: false,
          reactions: { '🤖': 1, '❤️': 1 }
        };

        setMessages((prev) => {
          const updated = [...prev, botMessage];
          saveCommunityMessages(updated);
          return updated;
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 1000);
    }
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;

        const currentReactions = { ...(msg.reactions || {}) };
        const myPrev = msg.myReaction;

        if (myPrev === emoji) {
          currentReactions[emoji] = (currentReactions[emoji] || 1) - 1;
          if (currentReactions[emoji] <= 0) delete currentReactions[emoji];
          return { ...msg, reactions: currentReactions, myReaction: undefined };
        } else {
          if (myPrev && currentReactions[myPrev]) {
            currentReactions[myPrev] -= 1;
            if (currentReactions[myPrev] <= 0) delete currentReactions[myPrev];
          }
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          return { ...msg, reactions: currentReactions, myReaction: emoji };
        }
      })
    );
    setActiveReactionMsgId(null);

    // Call API reaction update
    apiRequest(`/community/messages/${msgId}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }).catch(() => {});
  };

  const handleDownloadFileAttachment = async (file: FileAttachment) => {
    try {
      await saveDownloadedPaper({
        _id: `file_${Date.now()}`,
        title: file.name,
        school: 'Moi Campus Community',
        department: 'General Revision',
        courseCode: 'COMMUNICATION',
        unitCode: 'COMM 100',
        unitName: file.name,
        type: file.type === 'pdf' ? 'past_paper' : 'lecture_notes',
        examYear: 2025,
        fileUrl: file.url,
        fileType: file.type === 'pdf' ? 'pdf' : 'other',
        uploadedBy: { _id: 'comm', name: 'Community Member' } as any,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      Alert.alert(
        'File Saved Offline',
        `"${file.name}" has been saved to your local offline Downloads tab!`,
        [
          { text: 'OK' },
          { text: 'View Downloads', onPress: () => router.push('/(tabs)/downloads') }
        ]
      );
    } catch (err) {
      Alert.alert('Save Error', 'Could not save file offline.');
    }
  };

  const handlePickFromPhone = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploadingMedia(true);

        const formData = new FormData();
        const fileObj: any = {
          uri: asset.uri,
          name: asset.name || 'chat_attachment',
          type: asset.mimeType || 'application/octet-stream'
        };
        formData.append('file', fileObj);

        const res = await apiRequest('/community/upload-media', {
          method: 'POST',
          body: formData
        });

        setIsUploadingMedia(false);

        if (res.success && res.data?.url) {
          setSelectedFile({
            name: res.data.name || asset.name,
            url: res.data.url,
            size: res.data.size || '1.2 MB',
            type: res.data.type || 'pdf'
          });
          setShowFileModal(false);
          Alert.alert('Cloudinary Upload Complete ☁️', `"${asset.name}" uploaded to Cloudinary (folder: moiconnect/chat_media). Ready to share!`);
        } else {
          Alert.alert('Upload Failed', res.error || 'Failed to upload media to Cloudinary storage.');
        }
      }
    } catch (err: any) {
      setIsUploadingMedia(false);
      console.log('Document picker / Cloudinary upload error:', err);
      Alert.alert('Upload Error', 'Could not select or upload file.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Top Header Banner */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerAvatarContainer}>
            <View style={styles.headerAvatar}>
              <Image
                source={require('../assets/moi-uni-logo.png')}
                style={styles.headerAvatarImg}
                resizeMode="contain"
              />
            </View>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Moi Campus Community</Text>
            <Text style={styles.headerSubtitle}>🟢 1,420 students online • Open Forum</Text>
          </View>
        </View>

        {/* WhatsApp-Style Chat Wallpaper */}
        <View style={styles.chatBackground}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
              }, 100);
            }}
            ListHeaderComponent={
              <View style={styles.dateDivider}>
                <Text style={styles.dateDividerText}>TODAY • CAMPUS DISCUSSION</Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.isSystemNotice) {
                const isConn = item.eventType === 'user_connected';
                const isSec = item.eventType === 'security';
                return (
                  <View style={styles.systemNoticeContainer}>
                    <View style={styles.systemNoticePill}>
                      <Text style={styles.systemNoticeDot}>{isSec ? '🔒' : isConn ? '🟢' : '⚪'}</Text>
                      <Text style={styles.systemNoticeText}>{item.text}</Text>
                      {!!item.timestamp && <Text style={styles.systemNoticeTime}>• {item.timestamp}</Text>}
                    </View>
                  </View>
                );
              }

              const isPickerOpen = activeReactionMsgId === item.id;
              const hasReactions = item.reactions && Object.keys(item.reactions).length > 0;
              const isFirstUnread = item.id === firstUnreadMsgId;

              return (
                <View style={{ width: '100%' }}>
                  {/* WhatsApp-Style Unread Divider Line */}
                  {isFirstUnread && unreadCount > 0 && (
                    <View style={styles.unreadDividerContainer}>
                      <View style={styles.unreadDividerLine} />
                      <View style={styles.unreadDividerPill}>
                        <Text style={styles.unreadDividerText}>
                          {unreadCount} UNREAD {unreadCount === 1 ? 'MESSAGE' : 'MESSAGES'}
                        </Text>
                      </View>
                      <View style={styles.unreadDividerLine} />
                    </View>
                  )}

                  <SwipeableMessageItem onReply={() => setReplyingTo(item)}>
                    <View style={[styles.messageBubbleWrapper, item.isMe ? styles.myWrapper : styles.otherWrapper]}>
                      {!item.isMe && (
                        <View style={[styles.senderAvatar, { backgroundColor: item.avatarBg }]}>
                          <Text style={styles.avatarLetter}>{item.senderName[0]?.toUpperCase()}</Text>
                        </View>
                      )}

                      <View style={styles.bubbleContainer}>
                        {/* Floating Reaction Bar */}
                        {isPickerOpen && (
                          <View style={[styles.reactionPickerBar, item.isMe ? { right: 0 } : { left: 0 }]}>
                            {EMOJI_OPTIONS.map((emoji) => (
                              <TouchableOpacity
                                key={emoji}
                                style={[
                                  styles.emojiPickBtn,
                                  item.myReaction === emoji && styles.emojiPickBtnActive
                                ]}
                                onPress={() => handleToggleReaction(item.id, emoji)}
                              >
                                <Text style={{ fontSize: 18 }}>{emoji}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        <TouchableOpacity
                          activeOpacity={0.9}
                          onLongPress={() => setActiveReactionMsgId(isPickerOpen ? null : item.id)}
                          onPress={() => {
                            if (isPickerOpen) setActiveReactionMsgId(null);
                          }}
                          style={[
                            styles.bubble,
                            item.isMe ? styles.myBubble : styles.otherBubble,
                            highlightedMsgId === item.id && styles.highlightedBubble
                          ]}
                        >
                          {!item.isMe && (
                            <View style={styles.senderHeader}>
                              <Text style={[styles.senderName, { color: item.avatarBg }]}>{item.senderName}</Text>
                              <Text style={styles.senderFaculty}>{formatStudentSubtitle(undefined, undefined, undefined, item.senderFaculty)}</Text>
                            </View>
                          )}

                          {/* Engulfed Quoted Reply Box */}
                          {item.replyTo && (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              style={[styles.engulfedQuoteBox, item.isMe ? styles.engulfedQuoteBoxMe : styles.engulfedQuoteBoxOther]}
                              onPress={() => scrollToMessage(item.replyTo!.id)}
                            >
                              <View style={[styles.engulfedAccentBar, item.isMe ? styles.engulfedAccentBarMe : styles.engulfedAccentBarOther]} />
                              <View style={styles.engulfedContent}>
                                <Text style={[styles.engulfedSender, item.isMe ? styles.engulfedSenderMe : styles.engulfedSenderOther]} numberOfLines={1}>
                                  {item.replyTo.senderName || 'User'}
                                </Text>
                                <Text style={[styles.engulfedText, item.isMe ? styles.engulfedTextMe : styles.engulfedTextOther]} numberOfLines={2}>
                                  {item.replyTo.text || (item.replyTo.fileAttachment ? `📎 ${item.replyTo.fileAttachment.name}` : 'Attachment')}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          )}

                          {/* File Attachment Card */}
                          {item.fileAttachment && (
                            <View style={styles.fileCard}>
                              <View style={styles.fileIconBox}>
                                <FileTextIcon color="#15803d" size={24} />
                              </View>
                              <View style={styles.fileInfo}>
                                <Text style={styles.fileName} numberOfLines={1}>
                                  {item.fileAttachment.name}
                                </Text>
                                <Text style={styles.fileMeta}>
                                  {item.fileAttachment.size} • {item.fileAttachment.type.toUpperCase()}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.fileDownloadBtn}
                                onPress={() => handleDownloadFileAttachment(item.fileAttachment!)}
                              >
                                <DownloadIcon color="#ffffff" size={14} />
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* Text content with clean wrapping */}
                          {!!item.text && (
                            <Text style={[styles.messageText, item.isMe ? styles.myText : styles.otherText]}>
                              {item.text}
                            </Text>
                          )}

                          {/* Timestamp & Ticks */}
                          <View style={styles.metaRow}>
                            <TouchableOpacity
                              style={styles.reactionTriggerBtn}
                              onPress={() => setActiveReactionMsgId(isPickerOpen ? null : item.id)}
                            >
                              <SmileIcon color={item.isMe ? '#854d0e' : '#94a3b8'} size={12} />
                            </TouchableOpacity>

                            <Text style={[styles.timestamp, item.isMe ? styles.myTimestamp : styles.otherTimestamp]}>
                              {item.timestamp}
                            </Text>
                            {item.isMe && (
                              <View style={styles.ticksWrapper}>
                                <CheckIcon color="#38bdf8" size={14} />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Emoji Reaction Badges at bottom right */}
                        {hasReactions && (
                          <View style={[styles.reactionBadgeContainer, item.isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                            {Object.entries(item.reactions!).map(([emoji, count]) => (
                              <TouchableOpacity
                                key={emoji}
                                style={[
                                  styles.reactionBadge,
                                  item.myReaction === emoji && styles.reactionBadgeActive
                                ]}
                                onPress={() => handleToggleReaction(item.id, emoji)}
                              >
                                <Text style={styles.reactionBadgeText}>{emoji} {String(count)}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </SwipeableMessageItem>
                </View>
              );
            }}
          />

          {/* WhatsApp Style Floating Unread / Scroll to Bottom Button */}
          {showUnreadBtn && unreadCount > 0 && (
            <TouchableOpacity
              style={styles.floatingUnreadBtn}
              onPress={scrollToBottomAndMarkRead}
              activeOpacity={0.85}
            >
              <Text style={styles.floatingUnreadArrow}>↓</Text>
              <View style={styles.floatingUnreadBadge}>
                <Text style={styles.floatingUnreadBadgeText}>{unreadCount}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Smart Mention & Reply Jump Button (Floating Left Side) */}
          {unreadMentionIds.length > 0 && (
            <TouchableOpacity
              style={styles.floatingMentionBtn}
              onPress={handleJumpToNextMention}
              activeOpacity={0.85}
            >
              <Text style={styles.floatingMentionAtText}>@</Text>
              <View style={styles.floatingMentionBadge}>
                <Text style={styles.floatingMentionBadgeText}>{unreadMentionIds.length}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Replying Preview Banner */}
          {replyingTo && (
            <View style={styles.replyPreviewBanner}>
              <View style={styles.replyPreviewAccentBar} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ReplyIcon color="#15803d" size={13} />
                  <Text style={styles.replyPreviewTitle}>
                    Replying to <Text style={styles.replyPreviewName}>{replyingTo.senderName}</Text>
                  </Text>
                </View>
                <Text style={styles.replyPreviewSnippet} numberOfLines={1}>
                  {replyingTo.text || (replyingTo.fileAttachment ? `📎 ${replyingTo.fileAttachment.name}` : 'Attachment')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cancelReplyBtn}
                onPress={() => setReplyingTo(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelReplyText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Attached File Preview Bar before sending */}
          {selectedFile && (
            <View style={styles.filePreviewBanner}>
              <View style={styles.filePreviewLeft}>
                <FileTextIcon color="#15803d" size={20} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.filePreviewName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.filePreviewMeta}>
                    {selectedFile.size} • Attached File
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.removeFileBtn}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* WhatsApp Style Live Typing Indicator Banner */}
          {typingUsers.length > 0 && (
            <View style={styles.typingIndicatorBanner}>
              <View style={styles.typingDotsContainer}>
                <Animated.View style={[styles.typingDot, { opacity: typingDotAnim }]} />
                <Animated.View
                  style={[
                    styles.typingDot,
                    {
                      opacity: typingDotAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 1, 0.3]
                      })
                    }
                  ]}
                />
                <Animated.View style={[styles.typingDot, { opacity: typingDotAnim }]} />
              </View>
              <Text style={styles.typingIndicatorText} numberOfLines={1}>
                💬 {formatTypingText(typingUsers)}
              </Text>
            </View>
          )}

          {/* WhatsApp Style Bottom Input Bar */}
          <View style={styles.inputContainer}>
            <View style={styles.inputPill}>
              <TouchableOpacity
                style={styles.pillIconBtn}
                onPress={() => setShowFileModal(true)}
                activeOpacity={0.7}
              >
                <PaperclipIcon color="#8696a0" size={22} />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="@bot to mention campus bot"
                placeholderTextColor="#8696a0"
                value={inputText}
                onChangeText={handleInputChange}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
                onKeyPress={(e: any) => {
                  if (Platform.OS === 'web' && e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() && !selectedFile) && styles.sendBtnDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() && !selectedFile}
              activeOpacity={0.8}
            >
              <SendIcon color="#ffffff" size={19} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* File Selection Modal */}
        <Modal visible={showFileModal} transparent animationType="fade" onRequestClose={() => setShowFileModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFileModal(false)}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Campus File & Document</Text>
                <TouchableOpacity
                  onPress={() => setShowFileModal(false)}
                  style={styles.closeIconBtn}
                  activeOpacity={0.7}
                >
                  <CloseIcon color="#0f172a" size={16} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Select materials from your downloads or phone's storage:</Text>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {availableFiles.map((file, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.sampleFileOption}
                    onPress={() => {
                      setSelectedFile(file);
                      setShowFileModal(false);
                    }}
                  >
                    <View style={styles.sampleFileIcon}>
                      <FileTextIcon color="#15803d" size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sampleFileName}>{file.name}</Text>
                      <Text style={styles.sampleFileMeta}>{file.size} • Ready to share</Text>
                    </View>
                    <Text style={styles.attachLabel}>+ Attach</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.customFileBtn, isUploadingMedia && { opacity: 0.6 }]}
                onPress={handlePickFromPhone}
                disabled={isUploadingMedia}
                activeOpacity={0.8}
              >
                <FolderIcon color="#ffffff" size={18} />
                <Text style={styles.customFileBtnText}>
                  {isUploadingMedia ? 'Uploading to Cloudinary...' : 'Pick from phone'}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#efeae2'
  },
  container: {
    flex: 1,
    backgroundColor: '#e2e8f0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    paddingBottom: 12,
    gap: 10
  },
  backBtn: {
    padding: 6
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800'
  },
  headerAvatarContainer: {
    position: 'relative'
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 2
  },
  headerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#15803d'
  },
  headerInfo: {
    flex: 1
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dcfce7',
    fontWeight: '500'
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#efeae2'
  },
  messageList: {
    padding: 12,
    paddingBottom: 20
  },
  dateDivider: {
    alignSelf: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 10
  },
  dateDividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '85%'
  },
  myWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end'
  },
  otherWrapper: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    gap: 8
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  bubbleContainer: {
    flex: 1,
    flexShrink: 1,
    position: 'relative'
  },
  bubble: {
    borderRadius: 14,
    padding: 10,
    paddingHorizontal: 14,
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  },
  myBubble: {
    backgroundColor: '#dcf8c6',
    borderTopRightRadius: 2
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 2
  },
  senderHeader: {
    marginBottom: 4
  },
  senderName: {
    fontSize: 12,
    fontWeight: '800'
  },
  senderFaculty: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500'
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
    flexShrink: 1,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' ? { wordBreak: 'break-word' } : {})
  } as any,
  myText: {
    color: '#0f172a'
  },
  otherText: {
    color: '#0f172a'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6
  },
  reactionTriggerBtn: {
    padding: 2
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '600'
  },
  myTimestamp: {
    color: '#65a30d'
  },
  otherTimestamp: {
    color: '#94a3b8'
  },
  ticksWrapper: {
    marginLeft: 2
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 128, 61, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(21, 128, 61, 0.2)'
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileInfo: {
    flex: 1
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  fileMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  fileDownloadBtn: {
    backgroundColor: '#15803d',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reactionPickerBar: {
    position: 'absolute',
    top: -42,
    zIndex: 99,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  emojiPickBtn: {
    padding: 4,
    borderRadius: 12
  },
  emojiPickBtnActive: {
    backgroundColor: '#fef08a'
  },
  reactionBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2
  },
  reactionBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  reactionBadgeActive: {
    backgroundColor: '#fef08a',
    borderColor: '#eab308'
  },
  reactionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a'
  },
  filePreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  filePreviewLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  filePreviewName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  filePreviewMeta: {
    fontSize: 11,
    color: '#64748b'
  },
  removeFileBtn: {
    padding: 6
  },
  removeFileText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#efeae2',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9edef'
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 8,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9edef'
  },
  pillIconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: '#111b21',
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 6,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : {})
  } as any,
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  sendBtnDisabled: {
    backgroundColor: '#15803d',
    opacity: 0.55
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  closeIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14
  },
  sampleFileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10
  },
  sampleFileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sampleFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  sampleFileMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  attachLabel: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12
  },
  customFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    backgroundColor: '#15803d',
    paddingVertical: 12,
    borderRadius: 12
  },
  customFileBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  /* Engulfed Quoted Reply Box Styles */
  engulfedQuoteBox: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    overflow: 'hidden'
  },
  engulfedQuoteBoxMe: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  engulfedQuoteBoxOther: {
    backgroundColor: 'rgba(21, 128, 61, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(21, 128, 61, 0.15)'
  },
  engulfedAccentBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 8
  },
  engulfedAccentBarMe: {
    backgroundColor: '#86efac'
  },
  engulfedAccentBarOther: {
    backgroundColor: '#15803d'
  },
  engulfedContent: {
    flex: 1
  },
  engulfedSender: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2
  },
  engulfedSenderMe: {
    color: '#dcfce7'
  },
  engulfedSenderOther: {
    color: '#15803d'
  },
  engulfedText: {
    fontSize: 12,
    lineHeight: 16
  },
  engulfedTextMe: {
    color: 'rgba(255, 255, 255, 0.9)'
  },
  engulfedTextOther: {
    color: '#334155'
  },
  /* Replying Preview Banner Styles */
  replyPreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  replyPreviewAccentBar: {
    width: 4,
    height: '100%',
    minHeight: 30,
    backgroundColor: '#15803d',
    borderRadius: 2
  },
  replyPreviewTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  replyPreviewName: {
    color: '#15803d',
    fontWeight: '800'
  },
  replyPreviewSnippet: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2
  },
  cancelReplyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  cancelReplyText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800'
  },
  /* WhatsApp-style Unread Divider Line */
  unreadDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 8,
    width: '100%'
  },
  unreadDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1'
  },
  unreadDividerPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  unreadDividerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  /* WhatsApp-style Floating Unread Button at Bottom Right */
  floatingUnreadBtn: {
    position: 'absolute',
    bottom: 72,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    zIndex: 99
  },
  floatingUnreadArrow: {
    color: '#15803d',
    fontSize: 18,
    fontWeight: '900'
  },
  floatingUnreadBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  floatingUnreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  highlightedBubble: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  /* Smart Mention Floating Button (Left Side) */
  floatingMentionBtn: {
    position: 'absolute',
    bottom: 72,
    left: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    zIndex: 99
  },
  floatingMentionAtText: {
    color: '#f59e0b',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 6
  },
  floatingMentionBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  floatingMentionBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  /* WhatsApp-style System Notice Pills */
  systemNoticeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    paddingHorizontal: 16
  },
  systemNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  systemNoticeDot: {
    fontSize: 9
  },
  systemNoticeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.2
  },
  systemNoticeTime: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#94a3b8',
    marginLeft: 2
  },
  /* WhatsApp-style Live Typing Indicator Banner */
  typingIndicatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#15803d'
  },
  typingIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d'
  }
});
