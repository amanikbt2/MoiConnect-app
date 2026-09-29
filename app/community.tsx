import { showIceMessage } from '../src/components/IceMessageCard';
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
  Image,
  AppState
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../src/context/AuthContext';
import { useAppNavigation } from '../src/utils/navigation';
import {
  SendIcon,
  UsersIcon,
  OnlineStatusIcon,
  CheckIcon,
  PaperclipIcon,
  SmileIcon,
  FileTextIcon,
  DownloadIcon,
  TrashIcon,
  ReplyIcon,
  CameraIcon,
  CloseIcon,
  ImageIcon,
  VideoIcon,
  BotIcon
} from '../src/components/Icons';
import { getSocket } from '../src/services/socket';
import { apiRequest } from '../src/services/api';
import {

  getStoredCommunityMessages,
  getDownloadedPapers,
  saveDownloadedPaper,
  saveCommunityMessages,
  getCommunityReactorId,
  getLastReadCommunityMsgId,
  saveLastReadCommunityMsgId,
  getReadCommunityMentionIds,

  saveReadCommunityMentionIds,
  getStudentPersonalDetails,
  StudentPersonalDetails
} from '../src/services/offlineStorage';
import { setupNotificationResponseListener, sendWebBrowserNotification } from '../src/services/notificationService';
import { getShowDemoMaterialsSetting } from '../src/services/appSettingsService';
import { LinkifiedText } from '../src/components/LinkifiedText';
import { useLocalSearchParams } from 'expo-router';

export interface FileAttachment {
  name: string;
  url: string;
  size: string;
  type: 'pdf' | 'doc' | 'image' | 'video';
}

export interface CommunityMessage {
  id: string;
  clientMsgId?: string;
  deliveryStatus?: 'queued' | 'sent' | 'delivered';
  pendingPayload?: any;
  senderId?: string;
  senderEmail?: string;
  senderName: string;
  senderFaculty: string;
  senderCourse?: string;
  senderPhone?: string;
  senderAvatarUrl?: string;
  avatarBg: string;
  text: string;
  timestamp: string;
  isoDate?: string;
  updatedAt?: string;
  isMe: boolean;
  isSystemNotice?: boolean;
  eventType?: 'user_connected' | 'user_disconnected' | 'security' | string;
  fileAttachment?: FileAttachment;
  reactions?: Record<string, number>;
  myReaction?: string;
  isDemo?: boolean;
  stickerId?: string;
  replyTo?: {
    id: string;
    senderEmail?: string;
    senderName: string;
    text: string;
    fileAttachment?: FileAttachment;
  };
}

interface MentionUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

const EMOJI_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];
const CAMPUS_BOT_AVATAR = require('../assets/campus-bot-avatar.png');
const CAMPUS_AI_AVATAR = require('../assets/campus-ai-avatar.png');
const MENTION_DIRECTORY_KEY = 'moi_community_mention_directory_v1';
const MENTION_ASSISTANTS: Array<MentionUser & { avatar: any }> = [
  { id: 'campus-bot', name: 'Campus Bot', avatar: CAMPUS_BOT_AVATAR },
  { id: 'campus-ai', name: 'Campus AI', avatar: CAMPUS_AI_AVATAR }
];
const isCampusBotMessage = (message: CommunityMessage) =>
  message.senderEmail?.toLowerCase() === 'campusbot@moiconnect.app' ||
  message.senderName.toLowerCase().includes('campus bot');
const isCampusAIMessage = (message: CommunityMessage) =>
  message.senderEmail?.toLowerCase() === 'campusai@moiconnect.app' ||
  message.senderName.toLowerCase() === 'campus ai';
const isCampusAssistantMessage = (message: CommunityMessage) => isCampusBotMessage(message) || isCampusAIMessage(message);

const STICKERS = [
  { id: 'heart', label: 'Love', source: require('../assets/stickers/heart.png') },
  { id: 'thumbs-up', label: 'Nice', source: require('../assets/stickers/thumbs-up.png') },
  { id: 'party', label: 'Celebrate', source: require('../assets/stickers/party.png') },
  { id: 'laugh', label: 'Laugh', source: require('../assets/stickers/laugh.png') },
  { id: 'star', label: 'Great', source: require('../assets/stickers/star.png') }
] as const;
const STICKER_SOURCES: Record<string, any> = Object.fromEntries(STICKERS.map((sticker) => [sticker.id, sticker.source]));

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
    reactions: { '❤️': 4, '👍': 2 },
    isDemo: true
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
    reactions: { '👍': 9, '🔥': 5 },
    isDemo: true
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
    reactions: { '❤️': 15, '🙏': 3 },
    isDemo: true
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
    reactions: { '🔥': 22, '👍': 11 },
    isDemo: true
  }
];

const isHardcodedCommunityMessage = (message: CommunityMessage) => Boolean(message.isDemo) || INITIAL_COMMUNITY_MESSAGES.some((seed) => seed.id === message.id && seed.senderName === message.senderName);

export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useAppNavigation();
  const { focusMention } = useLocalSearchParams<{ focusMention?: string }>();

  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const reactorIdRef = useRef('');
  const [showDemoMaterials, setShowDemoMaterials] = useState(false);
  const [inputText, setInputText] = useState('');
  const [mentionDirectory, setMentionDirectory] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionLoading, setMentionLoading] = useState(false);
  const mentionFetchInFlightRef = useRef(false);
  const mentionFetchedQueriesRef = useRef<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<FileAttachment[]>([]);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [myProfile, setMyProfile] = useState<StudentPersonalDetails | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CommunityMessage | null>(null);

  useEffect(() => {
    getCommunityReactorId().then((id) => { reactorIdRef.current = id; });
  }, []);

  useEffect(() => {
    getStudentPersonalDetails().then((details) => {
      if (details) setMyProfile(details);
    });
  }, []);

  // Smart Mention & Reply Tracking State
  const [unreadMentionIds, setUnreadMentionIds] = useState<string[]>([]);
  const readMentionIdsRef = useRef<Set<string>>(new Set());
  const [readMentionVersion, setReadMentionVersion] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const dismissedMentionIds = useRef<Set<string>>(new Set());
  const focusMentionHandledRef = useRef(false);

  useEffect(() => {
    getReadCommunityMentionIds().then((ids) => {
      readMentionIdsRef.current = new Set(ids);
      setReadMentionVersion((version) => version + 1);
    });
  }, []);
  const tempSentIdsRef = useRef<Set<string>>(new Set());
  const retryingMessageIdsRef = useRef<Set<string>>(new Set());

  // WhatsApp-style Unread Tracking & Auto-scroll State
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showUnreadBtn, setShowUnreadBtn] = useState<boolean>(false);

  // WhatsApp-Style Live Typing Indicator State & Animation
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [botTyping, setBotTyping] = useState(false);
  const [botTypingName, setBotTypingName] = useState('Campus Bot');
  const [onlineCount, setOnlineCount] = useState(0);
  const typingTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const myTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const typingDotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (typingUsers.length > 0 || botTyping) {
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
  }, [typingUsers.length, botTyping]);

  const flatListRef = useRef<FlatList>(null);
  const lastSyncedISO = useRef<string | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const initialScrollDoneRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const pendingScrollToEndRef = useRef<boolean>(false);

  const scrollToLatestWhenReady = (animated: boolean, force = false) => {
    if (force) pendingScrollToEndRef.current = true;

    const scrollToEnd = () => {
      if (force || pendingScrollToEndRef.current || (!isDraggingRef.current && isNearBottomRef.current)) {
        flatListRef.current?.scrollToEnd({ animated });
      }
    };

    setTimeout(scrollToEnd, 40);
    setTimeout(scrollToEnd, 140);
    setTimeout(scrollToEnd, 360);
    setTimeout(scrollToEnd, 700);
    setTimeout(() => {
      scrollToEnd();
      pendingScrollToEndRef.current = false;
    }, 1100);
  };

  const handleMessageListLayout = () => {
    if (pendingScrollToEndRef.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleMessageListContentSizeChange = () => {
    if (pendingScrollToEndRef.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  };
  const evalIsMe = (msgSenderId?: any, msgSenderEmail?: string, msgSenderName?: string, msgClientMsgId?: string): boolean => {
    if (msgClientMsgId && tempSentIdsRef.current.has(msgClientMsgId)) {
      return true;
    }

    if (user) {
      if (user._id && msgSenderId) {
        const sId = typeof msgSenderId === 'object' ? msgSenderId?._id?.toString() || msgSenderId?.toString() : msgSenderId?.toString();
        if (sId && sId === user._id.toString()) {
          return true;
        }
      }

      if (user.email && msgSenderEmail) {
        if (user.email.trim().toLowerCase() === msgSenderEmail.trim().toLowerCase()) {
          return true;
        }
      }
    }

    return false;
  };

  const checkIsMentionOrReply = (msg: CommunityMessage, currUser: any, allMsgs: CommunityMessage[]): boolean => {
    if (!currUser || msg.isMe) return false;

    // 1. Reply check: if someone replied to my text or email
    if (msg.replyTo) {
      if (msg.replyTo.senderEmail && currUser.email && msg.replyTo.senderEmail.toLowerCase().trim() === currUser.email.toLowerCase().trim()) {
        return true;
      }
      const parentMsg = allMsgs.find((p) => p.id === msg.replyTo?.id);
      if (parentMsg && parentMsg.isMe) return true;
      if (isCampusAssistantMessage(msg) && parentMsg?.replyTo) {
        const originalMessage = allMsgs.find((candidate) => candidate.id === parentMsg.replyTo?.id);
        if (originalMessage?.isMe) return true;
      }
    }

    // 2. Mention check: text contains @Email, @MyName, or @MyFirstName
    if (msg.text) {
      const textLower = msg.text.toLowerCase();
      if (currUser.email) {
        const userEmailLower = currUser.email.toLowerCase().trim();
        const emailPrefix = userEmailLower.split('@')[0];
        if (textLower.includes(`@${userEmailLower}`) || (emailPrefix && emailPrefix.length >= 3 && textLower.includes(`@${emailPrefix}`))) {
          return true;
        }
      }

      if (currUser.name) {
        const fullNameLower = currUser.name.toLowerCase().trim();
        const firstNameLower = currUser.name.split(' ')[0]?.toLowerCase().trim();
        const mentionSlug = fullNameLower.replace(/\s+/g, '_');
        if (textLower.includes(`@${fullNameLower}`) || textLower.includes(`@${mentionSlug}`) || (firstNameLower && firstNameLower.length >= 2 && textLower.includes(`@${firstNameLower}`))) {
          return true;
        }
      }
    }

    return false;
  };

  useEffect(() => {
    if (!user || messages.length === 0) return;

    const mentions = messages
      .filter((m) => checkIsMentionOrReply(m, user, messages) && !dismissedMentionIds.current.has(m.id) && !readMentionIdsRef.current.has(m.id))
      .map((m) => m.id);

    setUnreadMentionIds(mentions);
  }, [messages, user, readMentionVersion]);

  const scrollToMessage = (targetId: string): boolean => {
    const normalizedTargetId = String(targetId);
    const targetIndex = messages.findIndex((m) =>
      String(m.id) === normalizedTargetId ||
      String((m as any)._id || '') === normalizedTargetId ||
      String(m.clientMsgId || '') === normalizedTargetId
    );
    if (targetIndex === -1 || !flatListRef.current) return false;

    const canonicalId = messages[targetIndex].id;
    pendingScrollToEndRef.current = false;
    isNearBottomRef.current = false;
    setHighlightedMsgId(canonicalId);
    const jumpToTarget = (animated: boolean) => {
      flatListRef.current?.scrollToIndex({ index: targetIndex, animated, viewPosition: 0.5, viewOffset: 0 });
    };
    jumpToTarget(true);
    setTimeout(() => jumpToTarget(false), 180);
    setTimeout(() => jumpToTarget(true), 500);
    setTimeout(() => {
      setHighlightedMsgId((curr) => (curr === canonicalId ? null : curr));
    }, 3000);
    return true;
  };

  const handleJumpToNextMention = () => {
    if (unreadMentionIds.length === 0) return;

    const targetId = unreadMentionIds[0];
    if (!scrollToMessage(targetId)) return;
    dismissedMentionIds.current.add(targetId);
    readMentionIdsRef.current.add(targetId);
    void saveReadCommunityMentionIds(Array.from(readMentionIdsRef.current));
    setUnreadMentionIds((prev) => prev.filter((id) => id !== targetId));
  };

  useEffect(() => {
    if (String(focusMention) !== '1' || focusMentionHandledRef.current || unreadMentionIds.length === 0) return;
    focusMentionHandledRef.current = true;
    handleJumpToNextMention();
  }, [focusMention, unreadMentionIds.length]);

  const initReadStateAndScroll = async (currentMsgs: CommunityMessage[]) => {
    if (currentMsgs.length === 0) return;
    const lastReadId = await getLastReadCommunityMsgId();

    if (!lastReadId) {
      const latestId = currentMsgs[currentMsgs.length - 1].id;
      await saveLastReadCommunityMsgId(latestId);
      setUnreadCount(0);
      setFirstUnreadMsgId(null);
      setShowUnreadBtn(false);
      scrollToLatestWhenReady(false, true);
      initialScrollDoneRef.current = true;
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
        scrollToLatestWhenReady(false, true);
      }
    } else {
      setUnreadCount(0);
      setFirstUnreadMsgId(null);
      setShowUnreadBtn(false);
      if (!initialScrollDoneRef.current) {
        initialScrollDoneRef.current = true;
        scrollToLatestWhenReady(false, true);
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
    scrollToLatestWhenReady(true, true);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 48;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isNearBottomRef.current = isBottom;
    setShowUnreadBtn((visible) => visible === !isBottom ? visible : !isBottom);

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
    Promise.all([getStoredCommunityMessages(), getShowDemoMaterialsSetting()]).then(([cachedMsgs, demoSetting]) => {
      setShowDemoMaterials(demoSetting);
      const rawMsgs = cachedMsgs && cachedMsgs.length > 0 ? cachedMsgs : (demoSetting ? INITIAL_COMMUNITY_MESSAGES : []);
      const msgsToLoad = rawMsgs
        .filter((m) => demoSetting || !isHardcodedCommunityMessage(m))
        .map((m) => ({
          ...m,
          isMe: evalIsMe(m.senderId, m.senderEmail, m.senderName, m.clientMsgId)
        }));
      setMessages(msgsToLoad);
      const latestCachedTimestamp = msgsToLoad.reduce((latest, message) => {
        const timestamp = message.updatedAt || message.isoDate;
        return timestamp && timestamp > latest ? timestamp : latest;
      }, '');
      lastSyncedISO.current = latestCachedTimestamp || '';
      if ((!cachedMsgs || cachedMsgs.length === 0) && demoSetting) {
        saveCommunityMessages(INITIAL_COMMUNITY_MESSAGES);
      }
      initReadStateAndScroll(msgsToLoad);
    });

    // 3. Connect Real-time WebSocket Listeners
    let activeSocket: any = null;
    getSocket().then((socket) => {
      if (socket) {
        activeSocket = socket;
        socket.on('community:online_count', (stats: { totalOnline?: number }) => {
          setOnlineCount(Math.max(0, Number(stats?.totalOnline || 0)));
        });
        socket.emit('community:request_online_count');
        socket.emit('join_community');

        socket.on('community:receive_message', (serverMsg: any) => {
          const isMyMsg = evalIsMe(serverMsg.senderId, serverMsg.senderEmail, serverMsg.senderName, serverMsg.clientMsgId);

          const formattedMsg: CommunityMessage = {
            id: serverMsg._id || serverMsg.id || serverMsg.clientMsgId || Date.now().toString(),
            clientMsgId: serverMsg.clientMsgId,
            deliveryStatus: isMyMsg ? (serverMsg.waitForBot ? 'queued' : 'delivered') : undefined,
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
            isoDate: serverMsg.createdAt || new Date().toISOString(),
            isMe: isMyMsg,
            fileAttachment: serverMsg.fileAttachment,
            stickerId: serverMsg.stickerId,
            replyTo: serverMsg.replyTo,
            reactions: serverMsg.reactions || {}
          };
          if (isCampusAssistantMessage(formattedMsg)) {
            setBotTyping(false);
            if (formattedMsg.replyTo?.id) {
              updateMessageDelivery(formattedMsg.replyTo.id, 'sent');
            }
          }


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
              scrollToLatestWhenReady(true, formattedMsg.isMe);
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
          if (data.userId === 'campus-bot' || data.userId === 'campus-ai') setBotTyping(false);
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
          if (typingTimeoutsRef.current[data.userId]) {
            clearTimeout(typingTimeoutsRef.current[data.userId]);
            delete typingTimeoutsRef.current[data.userId];
          }
        });

        socket.on('community:reaction_updated', (data: { messageId: string; reactions: any; actorId?: string; myReaction?: string }) => {
          const isMine = !!data.actorId && (data.actorId === user?._id || data.actorId === reactorIdRef.current);
          setMessages((prev) => {
            const updated = prev.map((m) => m.id === data.messageId
              ? { ...m, reactions: data.reactions || {}, myReaction: isMine ? data.myReaction : m.myReaction, updatedAt: new Date().toISOString() }
              : m);
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
        activeSocket.off('community:online_count');
      }
    };
  }, [user]);

  const fetchDeltaSync = async () => {
    try {
      const sinceParam = lastSyncedISO.current ? `?since=${encodeURIComponent(lastSyncedISO.current)}` : '';
      const res = await apiRequest<{ success: boolean; data: any[]; syncedAt: string }>(`/community/messages${sinceParam}`);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const fetchedMsgs: CommunityMessage[] = res.data.map((serverMsg: any) => {
          const isMyMsg = evalIsMe(serverMsg.senderId, serverMsg.senderEmail, serverMsg.senderName, serverMsg.clientMsgId);
          return {
            id: serverMsg._id || serverMsg.id,
            clientMsgId: serverMsg.clientMsgId,
            deliveryStatus: isMyMsg ? 'delivered' : undefined,
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
            isMe: isMyMsg,
            fileAttachment: serverMsg.fileAttachment,
            stickerId: serverMsg.stickerId,
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

      }
      if ((res as any).syncedAt) {
        lastSyncedISO.current = (res as any).syncedAt;
      }
    } catch (err) {
      console.log('Delta sync fallback:', err);
    }
  };

  useEffect(() => {
    if (showFileModal) {
      loadFiles();
    }
  }, [showFileModal, showDemoMaterials]);

  const loadFiles = async () => {
    try {
      const downloaded = await getDownloadedPapers();
      const converted: FileAttachment[] = downloaded.map((p) => ({
        name: `${p.unitCode || 'NOTE'}_${(p.title || 'Material').replace(/[^a-zA-Z0-9_]/g, '_')}.pdf`,
        url: p.fileUrl || 'https://res.cloudinary.com/mconnect/docs/sample.pdf',
        size: '1.8 MB',
        type: 'pdf'
      }));
      const combined = showDemoMaterials ? [...converted, ...SAMPLE_ATTACHMENTS] : converted;
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
      setAvailableFiles(unique);
    } catch (e) {
      setAvailableFiles(showDemoMaterials ? SAMPLE_ATTACHMENTS : []);
    }
  };

  const readMentionDirectoryCache = async (): Promise<MentionUser[]> => {
    try {
      const stored = Platform.OS === 'web'
        ? localStorage.getItem(MENTION_DIRECTORY_KEY)
        : await SecureStore.getItemAsync(MENTION_DIRECTORY_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((entry) => entry?.id && entry?.name).map((entry) => ({
        id: String(entry.id),
        name: String(entry.name),
        avatarUrl: entry.avatarUrl ? String(entry.avatarUrl) : undefined
      }));
    } catch {
      return [];
    }
  };

  const writeMentionDirectoryCache = async (directory: MentionUser[]) => {
    try {
      const value = JSON.stringify(directory.slice(0, 5000));
      if (Platform.OS === 'web') localStorage.setItem(MENTION_DIRECTORY_KEY, value);
      else await SecureStore.setItemAsync(MENTION_DIRECTORY_KEY, value);
    } catch (error) {
      console.warn('[Mentions] Directory cache was not saved:', error);
    }
  };

  const fetchMentionDirectory = async (query = '') => {
    const normalizedQuery = query.trim().toLowerCase();
    if (mentionFetchInFlightRef.current || (normalizedQuery && mentionFetchedQueriesRef.current.has(normalizedQuery))) return;
    mentionFetchInFlightRef.current = true;
    setMentionLoading(true);
    try {
      const suffix = normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : '';
      const response = await apiRequest<{ success: boolean; data?: MentionUser[] }>(`/community/mention-users${suffix}`);
      const fetched = Array.isArray(response?.data) ? response.data.map((entry) => ({
        id: String(entry.id),
        name: String(entry.name),
        avatarUrl: entry.avatarUrl
      })) : [];
      if (normalizedQuery) mentionFetchedQueriesRef.current.add(normalizedQuery);
      if (fetched.length > 0) {
        setMentionDirectory((current) => {
          const byId = new Map([...current, ...fetched].map((entry) => [entry.id, entry]));
          const merged = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
          void writeMentionDirectoryCache(merged);
          return merged;
        });
      }
    } catch (error) {
      console.warn('[Mentions] Directory refresh skipped:', error);
    } finally {
      mentionFetchInFlightRef.current = false;
      setMentionLoading(false);
    }
  };

  useEffect(() => {
    void readMentionDirectoryCache().then((cached) => {
      if (cached.length > 0) setMentionDirectory(cached);
    });
  }, []);

  const selectMention = (entry: MentionUser) => {
    const mentionToken = entry.id === 'campus-bot' ? 'bot' : entry.id === 'campus-ai' ? 'ai' : entry.name.trim().replace(/\s+/g, '_');
    const nextText = inputText.replace(/(^|\s)@[^\s@]*$/, `$1@${mentionToken} `);
    setInputText(nextText);
    setMentionQuery('');
    setShowMentionSuggestions(false);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    const activeMention = text.match(/(^|\s)@([^\s@]*)$/);
    if (activeMention) {
      const query = activeMention[2] || '';
      setMentionQuery(query);
      setShowMentionSuggestions(true);
      if (mentionDirectory.length === 0) void fetchMentionDirectory();
      else {
        const localMatch = mentionDirectory.some((entry) => entry.name.toLowerCase().includes(query.toLowerCase()));
        if (!localMatch && query.trim().length >= 2) void fetchMentionDirectory(query);
      }
    } else {
      setMentionQuery('');
      setShowMentionSuggestions(false);
    }

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

  const updateMessageDelivery = (clientMsgId: string, deliveryStatus: CommunityMessage['deliveryStatus']) => {
    setMessages((prev) => {
      const updated = prev.map((message) =>
        message.clientMsgId === clientMsgId
          ? { ...message, deliveryStatus, pendingPayload: deliveryStatus === 'delivered' ? undefined : message.pendingPayload }
          : message
      );
      void saveCommunityMessages(updated);
      return updated;
    });
  };

  const transmitMessage = async (payload: any, clientMsgId: string) => {
    if (retryingMessageIdsRef.current.has(clientMsgId)) return;
    retryingMessageIdsRef.current.add(clientMsgId);
    try {
      const socket = await getSocket();
      if (socket?.connected) {
        socket.emit('community:send_message', payload, (ack: { success?: boolean }) => {
          if (ack?.success) updateMessageDelivery(clientMsgId, 'sent');
        });
      }

      const result = await apiRequest('/community/messages', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (result.success) {
        if (payload.waitForBot) {
          const persistedId = result.data?._id || result.data?.id;
          if (persistedId) {
            setMessages((prev) => prev.map((message) =>
              message.clientMsgId === clientMsgId ? { ...message, id: persistedId } : message
            ));
          }
        } else {
          updateMessageDelivery(clientMsgId, 'sent');
        }
      }
    } catch (error) {
      // Keep the message queued locally; retryQueuedMessages will resend it.
      console.log('[Community] Message queued while offline.');
    } finally {
      retryingMessageIdsRef.current.delete(clientMsgId);
    }
  };

  const retryQueuedMessages = () => {
    messages
      .filter((message) => message.isMe && message.deliveryStatus === 'queued' && message.pendingPayload)
      .forEach((message) => void transmitMessage(message.pendingPayload, message.clientMsgId || message.id));
  };

  useEffect(() => {
    void retryQueuedMessages();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void retryQueuedMessages();
    });
    const retryTimer = setInterval(retryQueuedMessages, 10000);
    return () => {
      appStateSubscription.remove();
      clearInterval(retryTimer);
    };
  }, [messages]);
  const handleSendMessage = (stickerId?: string) => {
    if (!inputText.trim() && !selectedFile && !stickerId) return;

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
    const isStopCommand = /^\s*@(bot|campusbot|campus\s+bot|ai|campusai|campus\s+ai)\s+stop\b/i.test(sentText);
    const mentionMatch = sentText.match(/(^|\s)@(bot|campusbot|campus\s+bot|ai|campusai|campus\s+ai)\b/i);
    const isDirectBotMention = !!mentionMatch && !isStopCommand;
    const isReplyToBot = Boolean(replyingTo && isCampusAssistantMessage(replyingTo) && !isStopCommand);
    const isBotMentioned = isDirectBotMention || isReplyToBot;

    // Start the bot indicator before any network work so it is visible immediately.
    if (isBotMentioned) {
      setBotTyping(true);
      const target = mentionMatch?.[2]?.toLowerCase() || '';
      setBotTypingName(target === 'ai' || target === 'campusai' || target.includes('ai') || (!!replyingTo && isCampusAIMessage(replyingTo)) ? 'Campus AI' : 'Campus Bot');
    } else if (isStopCommand) {
      setBotTyping(false);
    }

    const replyToData = replyingTo
      ? {
          id: replyingTo.id,
          senderEmail: replyingTo.senderEmail,
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
      senderEmail: user ? user.email : undefined,
      text: sentText,
      fileAttachment: selectedFile || undefined,
      stickerId,
      replyTo: replyToData,
      senderName: user ? user.name : 'Moi Student',
      senderFaculty: facultySubtitle,
      senderCourse: myProfile?.course,
      senderPhone: myProfile?.phone || user?.phone,
      senderAvatarUrl: myProfile?.avatarUri || user?.avatarUrl,
      waitForBot: isBotMentioned,
      avatarBg: '#15803d'
    };

    const newMessage: CommunityMessage = {
      id: tempId,
      clientMsgId: tempId,
      deliveryStatus: 'queued',
      pendingPayload: payload,
      senderId: user ? user._id : undefined,
      senderEmail: user ? user.email : undefined,
      senderName: payload.senderName,
      senderFaculty: payload.senderFaculty,
      senderCourse: payload.senderCourse,
      senderPhone: payload.senderPhone,
      senderAvatarUrl: payload.senderAvatarUrl,
      avatarBg: payload.avatarBg,
      text: sentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isoDate: new Date().toISOString(),
      isMe: true,
      fileAttachment: selectedFile || undefined,
      stickerId,
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
    setShowStickerPicker(false);
    setReplyingTo(null);

    scrollToLatestWhenReady(true, true);

    // Send immediately when online, otherwise retain the queued message locally.
    void transmitMessage(payload, tempId);


  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    const reactorId = reactorIdRef.current || await getCommunityReactorId();
    reactorIdRef.current = reactorId;
    setMessages((prev) => {
      const updated = prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        const currentReactions = { ...(msg.reactions || {}) };
        const myPrev = msg.myReaction;
        if (myPrev === emoji) {
          currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
          if (!currentReactions[emoji]) delete currentReactions[emoji];
          return { ...msg, reactions: currentReactions, myReaction: undefined, updatedAt: new Date().toISOString() };
        }
        if (myPrev && currentReactions[myPrev]) {
          currentReactions[myPrev] -= 1;
          if (currentReactions[myPrev] <= 0) delete currentReactions[myPrev];
        }
        currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
        return { ...msg, reactions: currentReactions, myReaction: emoji, updatedAt: new Date().toISOString() };
      });
      saveCommunityMessages(updated);
      return updated;
    });
    setActiveReactionMsgId(null);

    const res = await apiRequest<{ messageId: string; reactions: Record<string, number>; myReaction?: string }>(`/community/messages/${msgId}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ emoji, reactorId })
    });
    if (res.success && res.data) {
      setMessages((prev) => {
        const updated = prev.map((msg) => msg.id === msgId
          ? { ...msg, reactions: res.data!.reactions || {}, myReaction: res.data!.myReaction, updatedAt: new Date().toISOString() }
          : msg);
        saveCommunityMessages(updated);
        return updated;
      });
    }
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

      showIceMessage(
        'File Saved Offline',
        `"${file.name}" has been saved to your local offline Downloads tab!`,
        [
          { text: 'OK' },
          { text: 'View Downloads', onPress: () => router.push('/(tabs)/downloads') }
        ]
      );
    } catch (err) {
      showIceMessage('Save Error', 'Could not save file offline.');
    }
  };

  const handlePickMedia = async (kind: 'image' | 'video') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: kind === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.9
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setIsUploadingMedia(true);
        const formData = new FormData();
        formData.append('file', { uri: asset.uri, name: asset.fileName || `${kind}_${Date.now()}`, type: asset.mimeType || (kind === 'image' ? 'image/jpeg' : 'video/mp4') } as any);
        const res = await apiRequest('/community/upload-media', { method: 'POST', body: formData });
        setIsUploadingMedia(false);
        if (res.success && res.data?.url) {
          setSelectedFile({ name: res.data.name || `${kind} attachment`, url: res.data.url, size: res.data.size || 'Media file', type: kind });
          setShowFileModal(false);
        } else {
          showIceMessage('Upload Failed', res.error || 'Failed to upload media.');
        }
      }
    } catch (err) {
      setIsUploadingMedia(false);
      showIceMessage('Upload Error', 'Could not select or upload media.');
    }
  };
  const handleTakeMedia = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        videoMaxDuration: 120,
        quality: 0.9
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const type = asset.type === 'video' ? 'video' : 'image';
        setIsUploadingMedia(true);
        const formData = new FormData();
        formData.append('file', { uri: asset.uri, name: asset.fileName || `camera_${Date.now()}`, type: asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg') } as any);
        const res = await apiRequest('/community/upload-media', { method: 'POST', body: formData });
        setIsUploadingMedia(false);
        if (res.success && res.data?.url) {
          setSelectedFile({ name: res.data.name || `camera ${type}`, url: res.data.url, size: res.data.size || 'Media file', type });
          setShowFileModal(false);
        } else {
          showIceMessage('Upload Failed', res.error || 'Failed to upload camera media.');
        }
      }
    } catch (err) {
      setIsUploadingMedia(false);
      showIceMessage('Camera Error', 'Could not capture or upload media.');
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
          showIceMessage('Cloudinary Upload Complete ☁️', `"${asset.name}" uploaded to Cloudinary (folder: moiconnect/chat_media). Ready to share!`);
        } else {
          showIceMessage('Upload Failed', res.error || 'Failed to upload media to Cloudinary storage.');
        }
      }
    } catch (err: any) {
      setIsUploadingMedia(false);
      console.log('Document picker / Cloudinary upload error:', err);
      showIceMessage('Upload Error', 'Could not select or upload file.');
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
            <Text style={styles.headerTitle}>
              <Text style={{ color: '#ffffff' }}>Moi Campus </Text>
              <Text style={{ color: '#a7f3d0' }}>Community</Text>
            </Text>
            <View style={styles.onlineSubtitle}><OnlineStatusIcon color="#86efac" size={13} /><Text style={styles.headerSubtitle}>{onlineCount.toLocaleString()} students online • Open Forum</Text></View>
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
            onLayout={handleMessageListLayout}
            onContentSizeChange={handleMessageListContentSizeChange}
            onScrollBeginDrag={() => {
              isDraggingRef.current = true;
            }}
            onMomentumScrollEnd={() => {
              isDraggingRef.current = false;
            }}
            onScrollEndDrag={() => {
              isDraggingRef.current = false;
            }}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
              }, 120);
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
              }, 450);
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
                      <View style={[styles.systemNoticeDot, isSec ? styles.systemNoticeSecurity : (isConn ? styles.systemNoticeConnected : styles.systemNoticeDisconnected)]} />
                      <Text style={styles.systemNoticeText} numberOfLines={2}>{item.text}</Text>
                      {!!item.timestamp && <Text style={styles.systemNoticeTime}>{item.timestamp}</Text>}
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
                        <TouchableOpacity
                          style={[styles.senderAvatar, isCampusAssistantMessage(item) && styles.botAvatarRing, { backgroundColor: item.avatarBg }]}
                          onPress={() => setSelectedProfile(item)}
                          activeOpacity={0.8}
                          accessibilityLabel={`View ${item.senderName}'s profile`}
                        >
                          {isCampusBotMessage(item) ? (
                            <Image source={CAMPUS_BOT_AVATAR} style={styles.botAvatarImage} />
                          ) : isCampusAIMessage(item) ? (
                            <Image source={CAMPUS_AI_AVATAR} style={styles.botAvatarImage} />
                          ) : item.senderAvatarUrl ? (
                            <Image source={{ uri: item.senderAvatarUrl }} style={styles.botAvatarImage} />
                          ) : (
                            <Text style={styles.avatarLetter}>{item.senderName[0]?.toUpperCase()}</Text>
                          )}
                        </TouchableOpacity>
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
                              <View style={styles.senderNameRow}>
                                <Text style={[styles.senderName, { color: item.avatarBg }]}>{item.senderName}</Text>
                              </View>
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

                          {item.stickerId && STICKER_SOURCES[item.stickerId] && (
                            <Image source={STICKER_SOURCES[item.stickerId]} style={styles.sentStickerImage} />
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
                            <LinkifiedText style={[styles.messageText, item.isMe ? styles.myText : styles.otherText]}>
                              {item.text}
                            </LinkifiedText>
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
                              item.deliveryStatus === 'queued' ? (
                                <Text style={styles.queuedClock}>◷</Text>
                              ) : (
                                <View style={styles.ticksWrapper}>
                                  <CheckIcon color={item.deliveryStatus === 'delivered' ? '#38bdf8' : '#94a3b8'} size={14} />
                                  {item.deliveryStatus === 'delivered' && (
                                    <CheckIcon color="#38bdf8" size={14} style={styles.secondTick} />
                                  )}
                                </View>
                              )
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
          {showUnreadBtn && (
            <TouchableOpacity
              style={styles.floatingUnreadBtn}
              onPress={scrollToBottomAndMarkRead}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Scroll to latest messages"
            >
              <Text style={styles.floatingUnreadArrow}>↓</Text>
              {unreadCount > 0 && (
                <View style={styles.floatingUnreadBadge}>
                  <Text style={styles.floatingUnreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
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
          {(typingUsers.length > 0 || botTyping) && (
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
              <View style={styles.typingIndicatorContent}>
                {botTyping && typingUsers.length === 0 ? (
                  <View style={styles.typingBotLabel}>
                    <BotIcon color="#6366f1" size={14} />
                    <Text style={styles.typingIndicatorText} numberOfLines={1}>{botTypingName} is typing...</Text>
                  </View>
                ) : (
                  <Text style={styles.typingIndicatorText} numberOfLines={1}>
                    {formatTypingText(typingUsers)}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* WhatsApp Style Bottom Input Bar */}
          {showStickerPicker && (
            <View style={styles.stickerPicker}>
              {STICKERS.map((sticker) => (
                <TouchableOpacity key={sticker.id} style={styles.stickerOption} onPress={() => handleSendMessage(sticker.id)} activeOpacity={0.8}>
                  <Image source={sticker.source} style={styles.stickerOptionImage} />
                  <Text style={styles.stickerOptionLabel}>{sticker.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {showMentionSuggestions && (
            <View style={styles.mentionSuggestions}>
              <View style={styles.mentionSuggestionsHeader}>
                <Text style={styles.mentionSuggestionsTitle}>Mention someone</Text>
                {mentionLoading && <Text style={styles.mentionSuggestionsLoading}>Updating…</Text>}
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.mentionSuggestionsList}>
                {MENTION_ASSISTANTS
                  .filter((entry) => entry.name.toLowerCase().includes(mentionQuery.toLowerCase()) || (mentionQuery.toLowerCase() === 'bot' && entry.id === 'campus-bot') || (mentionQuery.toLowerCase() === 'ai' && entry.id === 'campus-ai'))
                  .map((entry) => (
                    <TouchableOpacity key={entry.id} style={styles.mentionRow} onPress={() => selectMention(entry)} activeOpacity={0.75}>
                      <Image source={entry.avatar} style={styles.mentionAvatar} />
                      <View style={styles.mentionUserText}>
                        <Text style={styles.mentionUserName} numberOfLines={1}>{entry.name}</Text>
                        <Text style={styles.mentionUserSubtitle}>Assistant</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                {mentionDirectory
                  .filter((entry) => entry.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                  .slice(0, 8)
                  .map((entry) => (
                    <TouchableOpacity key={entry.id} style={styles.mentionRow} onPress={() => selectMention(entry)} activeOpacity={0.75}>
                      {entry.avatarUrl ? <Image source={{ uri: entry.avatarUrl }} style={styles.mentionAvatar} /> : <View style={styles.mentionAvatarFallback}><Text style={styles.mentionAvatarFallbackText}>{entry.name[0]?.toUpperCase()}</Text></View>}
                      <View style={styles.mentionUserText}>
                        <Text style={styles.mentionUserName} numberOfLines={1}>{entry.name}</Text>
                        <Text style={styles.mentionUserSubtitle}>MoiConnect user</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                {!mentionLoading && MENTION_ASSISTANTS.every((entry) => !entry.name.toLowerCase().includes(mentionQuery.toLowerCase())) && mentionDirectory.filter((entry) => entry.name.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
                  <Text style={styles.mentionEmptyText}>No matching users yet</Text>
                )}
              </ScrollView>
            </View>
          )}
          <View style={styles.inputContainer}>
            <View style={styles.inputPill}>




              <TouchableOpacity
                style={styles.pillIconBtn}
                onPress={() => setShowStickerPicker((visible) => !visible)}
                activeOpacity={0.7}
              >
                <SmileIcon color="#8696a0" size={21} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="@bot or @ai • @bot stop to cancel"
                placeholderTextColor="#8696a0"
                value={inputText}
                onChangeText={handleInputChange}
                returnKeyType="send"
                onSubmitEditing={() => handleSendMessage()}
                blurOnSubmit={false}
                onKeyPress={(e: any) => {
                  if (Platform.OS === 'web' && e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              <TouchableOpacity
                style={styles.pillIconBtn}
                onPress={() => setShowFileModal(true)}
                activeOpacity={0.7}
              >
                <PaperclipIcon color="#8696a0" size={22} />
              </TouchableOpacity>


            </View>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() && !selectedFile) && styles.sendBtnDisabled
              ]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() && !selectedFile}
              activeOpacity={0.8}
            >
              <SendIcon color="#ffffff" size={19} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact community profile preview */}
        <Modal visible={!!selectedProfile} transparent animationType="fade" onRequestClose={() => setSelectedProfile(null)}>
          <Pressable style={styles.profileModalOverlay} onPress={() => setSelectedProfile(null)}>
            <Pressable style={styles.profileModalCard} onPress={(event) => event.stopPropagation()}>
              {selectedProfile && (
                <>
                  <TouchableOpacity style={styles.profileModalClose} onPress={() => setSelectedProfile(null)}>
                    <CloseIcon color="#64748b" size={16} />
                  </TouchableOpacity>
                  <View style={[styles.profileModalAvatar, { backgroundColor: selectedProfile.avatarBg }]}>
                    {isCampusBotMessage(selectedProfile) ? (
                      <Image source={CAMPUS_BOT_AVATAR} style={styles.profileModalAvatarImage} />
                    ) : isCampusAIMessage(selectedProfile) ? (
                      <Image source={CAMPUS_AI_AVATAR} style={styles.profileModalAvatarImage} />
                    ) : selectedProfile.senderAvatarUrl ? (
                      <Image source={{ uri: selectedProfile.senderAvatarUrl }} style={styles.profileModalAvatarImage} />
                    ) : (
                      <Text style={styles.profileModalAvatarText}>{selectedProfile.senderName[0]?.toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={styles.profileModalName}>{selectedProfile.senderName}</Text>
                  <Text style={styles.profileModalRole}>MoiConnect community member</Text>
                  <View style={styles.profileInfoList}>
                    <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Faculty</Text><Text style={styles.profileInfoValue}>{selectedProfile.senderFaculty || 'Not provided'}</Text></View>
                    <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Course</Text><Text style={styles.profileInfoValue}>{selectedProfile.senderCourse || 'Not provided'}</Text></View>
                    <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Phone</Text><Text style={styles.profileInfoValue}>{selectedProfile.senderPhone || 'Not provided'}</Text></View>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

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

              <View style={styles.mediaOptionsRow}>
                <TouchableOpacity style={styles.mediaOption} onPress={() => handlePickMedia('image')}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#eff6ff' }]}><ImageIcon color="#2563eb" size={21} /></View>
                  <Text style={styles.mediaOptionLabel}>Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaOption} onPress={() => handlePickMedia('video')}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#fff7ed' }]}><VideoIcon color="#f97316" size={21} /></View>
                  <Text style={styles.mediaOptionLabel}>Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaOption} onPress={handlePickFromPhone}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#f0fdf4' }]}><FileTextIcon color="#15803d" size={21} /></View>
                  <Text style={styles.mediaOptionLabel}>Document</Text>
                </TouchableOpacity>
              <TouchableOpacity style={styles.mediaOption} onPress={handleTakeMedia}>
                <View style={[styles.mediaOptionIcon, { backgroundColor: '#fdf2f8' }]}><CameraIcon color="#db2777" size={21} /></View>
                <Text style={styles.mediaOptionLabel}>Camera</Text>
              </TouchableOpacity>
            </View>
              <Text style={styles.downloadedSectionTitle}>Downloaded materials</Text>
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
    fontSize: 19,
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
  onlineSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
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
  botAvatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#f4c542',
    padding: 2,
    backgroundColor: '#fff8dc',
    shadowColor: '#c58b00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3
  },
  botAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  bubbleContainer: {
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: '100%',
    position: 'relative'
  },
  bubble: {
    maxWidth: '100%',
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
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
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
    wordBreak: Platform.OS === 'web' ? 'break-word' : undefined
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
    marginLeft: 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  secondTick: {
    marginLeft: -9
  },
  queuedClock: {
    marginLeft: 3,
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 14
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
  stickerPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  stickerOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64
  },
  stickerOptionImage: {
    width: 48,
    height: 48
  },
  stickerOptionLabel: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2
  },
  mentionSuggestions: {
    marginHorizontal: 8,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe4ea',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden'
  },
  mentionSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f5'
  },
  mentionSuggestionsTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800'
  },
  mentionSuggestionsLoading: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '700'
  },
  mentionSuggestionsList: {
    maxHeight: 220
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10
  },
  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0'
  },
  mentionAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d'
  },
  mentionAvatarFallbackText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  mentionUserText: {
    flex: 1,
    minWidth: 0
  },
  mentionUserName: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800'
  },
  mentionUserSubtitle: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 1
  },
  mentionEmptyText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    padding: 14
  },
  sentStickerImage: {
    width: 132,
    height: 132,
    alignSelf: 'flex-start',
    marginBottom: 4
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
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  profileModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8
  },
  profileModalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileModalAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12
  },
  profileModalAvatarImage: {
    width: '100%',
    height: '100%'
  },
  profileModalAvatarText: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800'
  },
  profileModalName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  profileModalRole: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 3,
    marginBottom: 16
  },
  profileInfoList: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  profileInfoLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700'
  },
  profileInfoValue: {
    flex: 1,
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right'
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
  mediaOptionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  mediaOption: { alignItems: 'center', width: '23%' },
  mediaOptionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  mediaOptionLabel: { fontSize: 12, color: '#334155', fontWeight: '700' },
  downloadedSectionTitle: { fontSize: 12, color: '#64748b', fontWeight: '800', marginBottom: 8 },  sampleFileOption: {
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
    marginVertical: 3,
    paddingHorizontal: 10
  },
  systemNoticePill: {
    maxWidth: '94%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1
  },
  systemNoticeDot: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  systemNoticeConnected: { backgroundColor: '#22c55e' },
  systemNoticeDisconnected: { backgroundColor: '#c4b5fd' },
  systemNoticeSecurity: { backgroundColor: '#f59e0b' },
  systemNoticeText: {
    flexShrink: 1,
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '600',
    color: '#475569'
  },
  systemNoticeTime: {
    flexShrink: 0,
    fontSize: 9,
    fontWeight: '500',
    color: '#94a3b8'
  },  /* WhatsApp-style Live Typing Indicator Banner */
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
  },
  typingIndicatorContent: {
    flex: 1,
    minWidth: 0
  },
  typingBotLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  }
});
