import { showIceMessage } from '../src/components/IceMessageCard';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
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
  Linking,
  PanResponder,
  Animated,
  Easing,
  Image,
  ImageBackground,
  AppState,
  useWindowDimensions,
  Keyboard,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as ExpoFileSystem from 'expo-file-system/legacy';
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../src/context/AuthContext';
import { useUniversity } from '../src/context/UniversityContext';
import { STICKERS } from '../src/data/stickers';
import { GIFS, getLocalGifSource } from '../src/data/gifs';
import { extractImageOrGifUrl, isGifUrl } from '../src/utils/mediaUrlUtils';
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
  BotIcon,
  TransmitterIcon,
  WifiOffIcon,
  LockIcon,
} from '../src/components/Icons';
import { getSocket, ensureConnectedSocket } from '../src/services/socket';
import { apiRequest } from '../src/services/api';
import {

  getStoredCommunityMessages,
  getDownloadedPapers,
  saveDownloadedPaper,
  saveCommunityMessages,
  flushCommunityMessagesSync,
  getCommunityReactorId,
  getCommunitySyncCursor,
  saveCommunitySyncCursor,
  ensureCommunitySyncCursor,
  getLastReadCommunityMsgId,
  saveLastReadCommunityMsgId,
  getReadCommunityMentionIds,
  getDeletedForMeMessageIds,
  saveDeletedForMeMessageId,

  saveReadCommunityMentionIds,
  getStudentPersonalDetails,
  StudentPersonalDetails
} from '../src/services/offlineStorage';
import { setupNotificationResponseListener, sendWebBrowserNotification } from '../src/services/notificationService';
import { mediaDownloadManager, ActiveMediaDownload } from '../src/services/mediaDownloadManager';
import { getAllowCommunityChatSetting, getForumParticipationSetting, getShowDemoMaterialsSetting } from '../src/services/appSettingsService';
import { LinkifiedText } from '../src/components/LinkifiedText';
import { useLocalSearchParams } from 'expo-router';
import { PDFViewerModal, PDFDocumentItem } from '../src/components/PDFViewerModal';
import { UserBadge } from '../src/components/UserBadge';
import { useNetwork } from '../src/context/NetworkContext';
import { getSmartReplySnippet, getReplyAttachmentThumbnail } from '../src/utils/chatReplyUtils';
import { SmartMediaThumbnail, getCloudinaryVideoPreviewUrl } from '../src/components/SmartMediaThumbnail';
import { CommunityLiveRoom } from '../src/components/CommunityLiveRoom';

export interface FileAttachment {
  name: string;
  url: string;
  publicId?: string;
  size: string;
  type: 'pdf' | 'doc' | 'image' | 'video';
  paperId?: string;
  title?: string;
  unitCode?: string;
  unitName?: string;
  school?: string;
  pages?: string;
  author?: string;
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
  senderYear?: string;
  senderPhone?: string;
  senderAvatarUrl?: string;
  senderBadge?: 'blue' | 'red' | 'green';
  avatarBg: string;
  text: string;
  isPrivate?: boolean;
  privateNotice?: boolean;
  recipientId?: string;
  recipientName?: string;
  timestamp: string;
  isoDate?: string;
  updatedAt?: string;
  isMe: boolean;
  isSystemNotice?: boolean;
  isLiveNotice?: boolean;
  liveHostName?: string;
  eventType?: 'user_connected' | 'user_disconnected' | 'security' | string;
  fileAttachment?: FileAttachment;
  mentions?: string[];
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

interface SelectedMentionTarget {
  userId: string;
  token: string;
  start: number;
  end: number;
}

const EMOJI_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];
const CAMPUS_BOT_AVATAR = require('../assets/campus-bot-avatar.png');
const CAMPUS_AI_AVATAR = require('../assets/campus-ai-avatar.png');
const MENTION_DIRECTORY_KEY = 'moi_community_mention_directory_v1';
const COMMUNITY_MESSAGE_PAGE_SIZE = 30;
const MENTION_ASSISTANTS: Array<MentionUser & { avatar: any }> = [
  { id: 'campus-bot', name: 'Campus Bot', avatar: CAMPUS_BOT_AVATAR },
  { id: 'campus-ai', name: 'Campus AI', avatar: CAMPUS_AI_AVATAR }
];
const matchesMentionEntry = (entry: MentionUser, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase().replace(/[\s_]+/g, ' ');
  const normalizedName = entry.name.trim().toLowerCase().replace(/[\s_]+/g, ' ');
  return normalizedName.includes(normalizedQuery) ||
    (normalizedQuery === 'bot' && entry.id === 'campus-bot') ||
    (normalizedQuery === 'ai' && entry.id === 'campus-ai');
};

const updateMentionRangesForTextChange = (
  previousText: string,
  nextText: string,
  selectedMentions: SelectedMentionTarget[]
): SelectedMentionTarget[] => {
  let prefixLength = 0;
  while (prefixLength < previousText.length && prefixLength < nextText.length && previousText[prefixLength] === nextText[prefixLength]) {
    prefixLength += 1;
  }

  let previousEnd = previousText.length;
  let nextEnd = nextText.length;
  while (previousEnd > prefixLength && nextEnd > prefixLength && previousText[previousEnd - 1] === nextText[nextEnd - 1]) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  const delta = (nextEnd - prefixLength) - (previousEnd - prefixLength);
  return selectedMentions.flatMap((mention) => {
    const isInsertion = prefixLength === previousEnd;
    const overlapsMention = isInsertion
      ? prefixLength > mention.start && prefixLength < mention.end
      : prefixLength < mention.end && previousEnd > mention.start;
    if (overlapsMention) return [];

    const shift = previousEnd <= mention.start ? delta : 0;
    const adjusted = { ...mention, start: mention.start + shift, end: mention.end + shift };
    return nextText.slice(adjusted.start, adjusted.end) === adjusted.token ? [adjusted] : [];
  });
};
const isVideoAttachment = (file?: { type?: string; url?: string; name?: string } | null): boolean => {
  if (!file) return false;
  if (file.type === 'video') return true;
  const name = (file.name || '').toLowerCase();
  const url = (file.url || '').toLowerCase();
  return Boolean(name.match(/\.(mp4|mov|m4v|webm|mkv|avi|3gp|flv|wmv)$/i)) ||
    Boolean(url.match(/\.(mp4|mov|m4v|webm|mkv|avi|3gp|flv|wmv)(\?.*)?$/i)) ||
    url.includes('/video/upload/');
};

const isImageAttachment = (file?: { type?: string; url?: string; name?: string } | null): boolean => {
  if (!file) return false;
  if (file.type === 'image') return true;
  const name = (file.name || '').toLowerCase();
  const url = (file.url || '').toLowerCase();
  return Boolean(name.match(/\.(jpg|jpeg|png|gif|webp|bmp|heic|svg)$/i)) ||
    Boolean(url.match(/\.(jpg|jpeg|png|gif|webp|bmp|heic|svg)(\?.*)?$/i)) ||
    Boolean(getLocalGifSource(file.url)) ||
    url.includes('/image/upload/') ||
    url.includes('giphy.com') ||
    url.includes('tenor.com') ||
    url.startsWith('data:image/');
};

const isMediaAttachment = (file?: { type?: string; url?: string; name?: string } | null): boolean => {
  return isImageAttachment(file) || isVideoAttachment(file);
};
const getVideoPlayerHtml = (url: string): string => {
  const safeUrl = (url || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" /><style>html,body{margin:0;padding:0;width:100%;height:100%;background:#020617;overflow:hidden;display:flex;align-items:center;justify-content:center}video{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;background:#020617;outline:none}</style></head><body><video controls autoplay playsinline webkit-playsinline src="${safeUrl}"></video></body></html>`;
};
const isCampusBotMessage = (message: CommunityMessage) =>
  message.senderEmail?.toLowerCase() === 'campusbot@moiconnect.app' ||
  message.senderEmail?.toLowerCase().includes('campusbot') ||
  message.senderName?.toLowerCase().includes('campus bot') ||
  message.senderName?.toLowerCase().trim() === 'campus bot' ||
  message.senderName?.toLowerCase().trim() === 'bot' ||
  message.senderId === 'campus-bot' ||
  String(message.senderId) === '000000000000000000000001';
const isCampusAIMessage = (message: CommunityMessage) =>
  message.senderEmail?.toLowerCase() === 'campusai@moiconnect.app' ||
  message.senderEmail?.toLowerCase().includes('campusai') ||
  message.senderName?.toLowerCase().includes('campus ai') ||
  message.senderName?.toLowerCase().trim() === 'campus ai' ||
  message.senderName?.toLowerCase().trim() === 'ai' ||
  message.senderId === 'campus-ai' ||
  String(message.senderId) === '000000000000000000000002';
const isCampusAssistantMessage = (message: CommunityMessage) => isCampusBotMessage(message) || isCampusAIMessage(message);
const isUnsetCommunityValue = (val?: string) => !val || val.trim() === '' || val.trim().toLowerCase() === 'unset';

const getCommunitySenderSubtitle = (
  message: CommunityMessage,
  currentUser?: any,
  currentProfile?: StudentPersonalDetails | null
): string => {
  if (isCampusAssistantMessage(message)) {
    return 'AI Assistant';
  }
  if (message.isMe && currentUser) {
    const course = !isUnsetCommunityValue(currentUser.course) ? currentUser.course : (!isUnsetCommunityValue(currentProfile?.course) ? currentProfile?.course : undefined);
    const year = !isUnsetCommunityValue(currentUser.yearOfStudy) ? currentUser.yearOfStudy : (!isUnsetCommunityValue(currentProfile?.yearOfStudy) ? currentProfile?.yearOfStudy : undefined);
    const school = !isUnsetCommunityValue(currentUser.school) ? currentUser.school : (!isUnsetCommunityValue(currentProfile?.school) ? currentProfile?.school : undefined);
    return formatStudentSubtitle(school, course, year, message.senderFaculty);
  }
  return formatStudentSubtitle(undefined, message.senderCourse, message.senderYear, message.senderFaculty);
};

const getReplySenderLabel = (replyTo: NonNullable<CommunityMessage['replyTo']>, currentUser?: any): string => {
  const replyEmail = replyTo.senderEmail?.trim().toLowerCase();
  const currentEmail = currentUser?.email?.trim().toLowerCase();
  return replyEmail && currentEmail && replyEmail === currentEmail ? 'You' : replyTo.senderName || 'User';
};

const STICKER_SOURCES: Record<string, any> = Object.fromEntries(STICKERS.map((sticker) => [sticker.id, sticker.source]));

function ExpandableMessageText({ text, style, onPressVideo }: { text: string; style: any; onPressVideo: (url: string) => void }) {
  const { width } = useWindowDimensions();
  const estimateCharsPerLine = Math.max(24, Math.floor((width * 0.85 - 76) / 7.2));
  const estimatedLines = text.split('\n').reduce((total, line) => total + Math.max(1, Math.ceil(line.length / estimateCharsPerLine)), 0);
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(estimatedLines > 10);

  useEffect(() => {
    setExpanded(false);
    setHasMore(estimatedLines > 10);
  }, [text, estimatedLines]);

  return (
    <View style={styles.expandableMessage}>
      <LinkifiedText
        style={style}
        numberOfLines={expanded ? undefined : 10}
        onTextLayout={(event) => {
          if (event?.nativeEvent?.lines?.length > 10) setHasMore(true);
        }}
        onPressVideo={onPressVideo}
      >
        {text}
      </LinkifiedText>
      {hasMore && (
        <TouchableOpacity onPress={() => setExpanded((value) => !value)} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={expanded ? 'Read less' : 'Read more'}>
          <Text style={styles.readMoreText}>{expanded ? 'Read less' : 'Read more'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SwipeableMessageItem({
  children,
  onReply,
  isPickerOpen
}: {
  children: React.ReactNode;
  onReply: () => void;
  isPickerOpen?: boolean;
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
    <View style={[{ position: 'relative', width: '100%' }, isPickerOpen && { zIndex: 999999, elevation: 99999 }]}>
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
        style={[
          {
            transform: [{ translateX: panX }],
            width: '100%'
          },
          isPickerOpen && { zIndex: 999999, elevation: 99999 }
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const SmartGifCardItem = React.memo(function SmartGifCardItem({
  gif,
  onPress,
  shouldLoad
}: {
  gif: any;
  onPress: () => void;
  shouldLoad: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loaded && !hasError && shouldLoad) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [loaded, hasError, shouldLoad]);

  const handleImageLoad = () => {
    setLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true
    }).start();
  };

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85]
  });

  return (
    <TouchableOpacity
      style={styles.gifCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Smart Shimmer Skeleton (shown while image is loading or before reached) */}
      {(!loaded || !shouldLoad) && (
        <View style={styles.gifShimmerContainer}>
          <Animated.View style={[styles.gifShimmerPulse, { opacity: shimmerOpacity }]} />
          <View style={styles.gifShimmerCenterBadge}>
            <Text style={styles.gifShimmerCenterText}>GIF</Text>
          </View>
        </View>
      )}

      {/* Only start fetching online GIF image when GIFs tab is active and visible */}
      {shouldLoad && !hasError && (
        <Animated.Image
          source={{ uri: gif.previewUrl || gif.url }}
          style={[styles.gifCardImage, { opacity: fadeAnim }]}
          resizeMode="cover"
          onLoad={handleImageLoad}
          onError={() => setHasError(true)}
        />
      )}

      {/* Fallback if network fails */}
      {hasError && (
        <View style={styles.gifFallbackContainer}>
          <Text style={styles.gifFallbackText}>GIF</Text>
        </View>
      )}

      {/* WhatsApp-style bottom badge */}
      {loaded && (
        <View style={styles.gifCardBadge}>
          <Text style={styles.gifCardBadgeText}>GIF</Text>
        </View>
      )}

      {/* Title */}
      <Text style={styles.gifCardTitle} numberOfLines={1}>
        {gif.title}
      </Text>
    </TouchableOpacity>
  );
});

interface TypingUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  avatarBg?: string;
}

function getPresenceFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'Someone';
}

function formatTypingText(users: TypingUser[]): string {
  if (users.length === 0) return '';
  if (users.length === 1) return `${getPresenceFirstName(users[0].userName)} is typing...`;
  return `${getPresenceFirstName(users[0].userName)} & ${users.length - 1} ${users.length - 1 === 1 ? 'other' : 'others'} are typing...`;
}

function formatDeletingText(users: TypingUser[]): string {
  if (users.length === 0) return '';
  if (users.length === 1) return `${getPresenceFirstName(users[0].userName)} is deleting...`;
  return `${getPresenceFirstName(users[0].userName)} & ${users.length - 1} ${users.length - 1 === 1 ? 'other' : 'others'} are deleting...`;
}

export function formatYearShort(year?: string): string {
  if (!year || isUnsetCommunityValue(year)) return '';
  const yTrim = year.trim();
  if (/^Y[1-6]$/i.test(yTrim)) return yTrim.toUpperCase();
  const digitMatch = yTrim.match(/\b([1-6])\b/) || yTrim.match(/(\d+)/);
  if (digitMatch) return `Y${digitMatch[1]}`;
  if (/postgrad|master|phd/i.test(yTrim)) return 'PG';
  return yTrim;
}

export function formatStudentSubtitle(
  school?: string,
  course?: string,
  yearOfStudy?: string,
  facultyFallback?: string
): string {
  let programStr = !isUnsetCommunityValue(course) ? course!.trim() : '';
  let yearStr = !isUnsetCommunityValue(yearOfStudy) ? yearOfStudy!.trim() : '';

  // If course or year missing, try parsing facultyFallback which may already contain combined info
  if ((!programStr || !yearStr) && facultyFallback && !isUnsetCommunityValue(facultyFallback)) {
    const fallback = facultyFallback.trim();
    const lower = fallback.toLowerCase();
    if (
      lower !== 'main campus' &&
      lower !== 'main campus student' &&
      lower !== 'moi student' &&
      lower !== 'moi university student' &&
      lower !== 'school of science & computing' &&
      lower !== 'moi university' &&
      lower !== 'unset'
    ) {
      // Check for bullet or dot separator e.g. "Computer Science • Y2" or "Computer Science . Y2"
      const parts = fallback.split(/\s*[•·.]\s*(Y[1-6]|PG)\b/i);
      if (parts.length >= 2) {
        if (!programStr) programStr = parts[0].trim();
        if (!yearStr) yearStr = parts[1].trim();
      } else {
        const yearMatch = fallback.match(/\s+(Y[1-6]|PG)$/i);
        if (yearMatch) {
          if (!programStr) programStr = fallback.replace(/\s+(Y[1-6]|PG)$/i, '').trim();
          if (!yearStr) yearStr = yearMatch[1].trim();
        } else if (!programStr) {
          programStr = fallback;
        }
      }
    }
  }

  // Clean course prefix if overly verbose (e.g., "BSc. Computer Science" -> "Computer Science")
  if (programStr) {
    programStr = programStr
      .replace(/^(bachelor\s+of\s+(science|arts|education|commerce|business)?(\s+in)?\s*)/i, '')
      .replace(/^b\.?sc\.?\s*(in\s*)?/i, '')
      .trim();
  }

  if (
    isUnsetCommunityValue(programStr) ||
    programStr.toLowerCase() === 'moi student' ||
    programStr.toLowerCase() === 'moi university student' ||
    programStr.toLowerCase() === 'school of science & computing'
  ) {
    programStr = '';
  }

  // If unset then just show default Moi Student
  if (!programStr) {
    return 'Moi Student';
  }

  const shortYear = formatYearShort(yearStr);
  if (shortYear) {
    return `${programStr} • ${shortYear}`;
  }

  return programStr;
}

const SAMPLE_ATTACHMENTS: FileAttachment[] = [];

const FORUM_WALLPAPERS = [
  require('../assets/uni-space-wallpaper.png'),
  require('../assets/uni-wallpaper-a1.jpg'),
  require('../assets/uni-wallpaper-a2.jpg'),
  require('../assets/uni-wallpaper-a3.jpg'),
  require('../assets/uni-wallpaper-a4.jpg'),
];

let lastWallpaperIndex = -1;

function getSmartRandomWallpaperIndex(): number {
  if (lastWallpaperIndex === -1) {
    const idx = Math.floor(Math.random() * FORUM_WALLPAPERS.length);
    lastWallpaperIndex = idx;
    return idx;
  }
  const offset = Math.floor(Math.random() * (FORUM_WALLPAPERS.length - 1)) + 1;
  const nextIdx = (lastWallpaperIndex + offset) % FORUM_WALLPAPERS.length;
  lastWallpaperIndex = nextIdx;
  return nextIdx;
}

const INITIAL_COMMUNITY_MESSAGES: CommunityMessage[] = [];

const isHardcodedCommunityMessage = (message: CommunityMessage) => Boolean(message.isDemo) || INITIAL_COMMUNITY_MESSAGES.some((seed) => seed.id === message.id && seed.senderName === message.senderName);

export default function CommunityScreen() {
  const { user, loading: authLoading } = useAuth();
  const { selectedUniversity } = useUniversity();
  const campusName = selectedUniversity?.shortName || 'Campus';
  const router = useAppNavigation();
  const isForumFocused = useIsFocused();
  const { isOnline: networkOnline } = useNetwork();
  const { focusMention } = useLocalSearchParams<{ focusMention?: string }>();

  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    insets = useSafeAreaInsets();
  } catch {}

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      'keyboardWillShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      'keyboardWillHide',
      () => setIsKeyboardVisible(false)
    );
    const didShowSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const didHideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      didShowSub.remove();
      didHideSub.remove();
      hideSub.remove();
    };
  }, []);

  const composerPaddingBottom = (
    !isKeyboardVisible && Platform.OS === 'android' && insets.bottom > 0
      ? insets.bottom + 8
      : 8
  );

  const floatingBottomOffset = (
    !isKeyboardVisible && Platform.OS === 'android' && insets.bottom > 0
      ? insets.bottom + 72
      : 72
  );

  const [wallpaperSource, setWallpaperSource] = useState(() => FORUM_WALLPAPERS[getSmartRandomWallpaperIndex()]);
  const prevFocusedRef = useRef(true);

  useEffect(() => {
    if (!isForumFocused) {
      prevFocusedRef.current = false;
      setIsForumLayoutReady(false);
      return;
    }

    if (isForumFocused && !prevFocusedRef.current) {
      setWallpaperSource(FORUM_WALLPAPERS[getSmartRandomWallpaperIndex()]);
      setHasLoadedForumWallpaper(false);
      setIsForumLayoutReady(false);
    }
    prevFocusedRef.current = true;
  }, [isForumFocused]);

  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const livePulseAnim = useRef(new Animated.Value(0)).current;
  const [liveBroadcast, setLiveBroadcast] = useState<{ hostName: string; hostId?: string } | null>(null);
  const liveBroadcastKey = liveBroadcast ? `${liveBroadcast.hostId || ''}:${liveBroadcast.hostName}` : null;
  const [dismissedLiveBannerKey, setDismissedLiveBannerKey] = useState<string | null>(null);
  const [isForumLoading, setIsForumLoading] = useState(true);
  const [forumHeaderHeight, setForumHeaderHeight] = useState(0);
  const [hasForumListLayout, setHasForumListLayout] = useState(false);
  const [hasForumContentLayout, setHasForumContentLayout] = useState(false);
  const [hasRenderedForumMessage, setHasRenderedForumMessage] = useState(false);
  const [hasLoadedForumWallpaper, setHasLoadedForumWallpaper] = useState(false);
  const [hasComposerLayout, setHasComposerLayout] = useState(false);
  const [isForumLayoutReady, setIsForumLayoutReady] = useState(false);
  const displayMessages = React.useMemo(() => {
    // Smart Presence Collapse:
    // Filter out consecutive system presence notices so back-to-back
    // online/offline oscillations collapse into a single clean presence notice.
    const sourceMessages = messages;
    const collapsed: CommunityMessage[] = [];
    for (let i = 0; i < sourceMessages.length; i++) {
      const current = sourceMessages[i];
      if (current.isSystemNotice) {
        const next = sourceMessages[i + 1];
        if (next && next.isSystemNotice) {
          continue;
        }
      }
      collapsed.push(current);
    }
    return collapsed.reverse();
  }, [messages]);
  const showForumLoading = isForumLoading || !isForumLayoutReady || !hasLoadedForumWallpaper || !hasForumListLayout || !hasForumContentLayout || !hasComposerLayout || (displayMessages.length > 0 && !hasRenderedForumMessage);
  const forumViewabilityCallback = useRef(({ viewableItems }: { viewableItems: unknown[] }) => {
    if (viewableItems.length > 0) setHasRenderedForumMessage(true);
  }).current;
  const reactorIdRef = useRef('');
  const [showDemoMaterials, setShowDemoMaterials] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [selectedMentionTargets, setSelectedMentionTargets] = useState<SelectedMentionTarget[]>([]);
  const [mentionDirectory, setMentionDirectory] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [sendButtonBusy, setSendButtonBusy] = useState(false);
  const sendButtonBusyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mentionFetchInFlightRef = useRef(false);
  const mentionFetchedQueriesRef = useRef<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showPrivateMessageModal, setShowPrivateMessageModal] = useState(false);
  const [privateRecipient, setPrivateRecipient] = useState<MentionUser | null>(null);
  const [privateSearchQuery, setPrivateSearchQuery] = useState('');
  const [privateSuggestions, setPrivateSuggestions] = useState<MentionUser[]>([]);
  const [privateSuggestionsLoading, setPrivateSuggestionsLoading] = useState(false);
  const [privateMessageText, setPrivateMessageText] = useState('');
  const [privateMessageSending, setPrivateMessageSending] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<FileAttachment | null>(null);
  const [activeMediaDownloads, setActiveMediaDownloads] = useState<Record<string, ActiveMediaDownload>>({});

  useEffect(() => {
    return mediaDownloadManager.subscribe((downloads) => {
      setActiveMediaDownloads(downloads);
    });
  }, []);

  const [downloadingAttachmentKey, setDownloadingAttachmentKey] = useState<string | null>(null);
  const [downloadAttachmentProgress, setDownloadAttachmentProgress] = useState(0);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'stickers' | 'gifs'>('stickers');
  const [gifCategory, setGifCategory] = useState<string>('All');
  const [availableFiles, setAvailableFiles] = useState<FileAttachment[]>([]);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [downloadAttachmentBytesText, setDownloadAttachmentBytesText] = useState<string>('');
  const [downloadAttachmentFailedKey, setDownloadAttachmentFailedKey] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [sendPendingAfterUpload, setSendPendingAfterUpload] = useState(false);
  const sendPendingAfterUploadRef = useRef(false);
  const [pendingUploadItem, setPendingUploadItem] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    kind: 'image' | 'video' | 'pdf' | 'doc';
    rawFile?: any;
  } | null>(null);
  const [pickingMediaKind, setPickingMediaKind] = useState<'image' | 'video' | 'doc' | 'camera' | null>(null);
  const [myProfile, setMyProfile] = useState<StudentPersonalDetails | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CommunityMessage | null>(null);
  const [showGuestSignInPrompt, setShowGuestSignInPrompt] = useState(false);

  const stickerPickerRef = useRef<View>(null);
  const smileButtonRef = useRef<TouchableOpacity>(null);

  useEffect(() => {
    if (!showStickerPicker || Platform.OS !== 'web') return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (stickerPickerRef.current) {
        const pickerNode = (stickerPickerRef.current as any)?._nativeNode || (stickerPickerRef.current as any);
        if (pickerNode && typeof pickerNode.contains === 'function' && pickerNode.contains(target)) {
          return;
        }
      }

      if (smileButtonRef.current) {
        const smileNode = (smileButtonRef.current as any)?._nativeNode || (smileButtonRef.current as any);
        if (smileNode && typeof smileNode.contains === 'function' && smileNode.contains(target)) {
          return;
        }
      }

      if (typeof target.closest === 'function' && target.closest('[data-sticker-picker], [data-sticker-toggle]')) {
        return;
      }

      setShowStickerPicker(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowStickerPicker(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showStickerPicker]);

  useEffect(() => {
    if (!authLoading && isForumFocused) setShowGuestSignInPrompt(!user);
    if (user) setShowGuestSignInPrompt(false);
  }, [authLoading, user, isForumFocused]);

  useEffect(() => {
    getCommunityReactorId().then((id) => { reactorIdRef.current = id; });
  }, []);
  const lastSendTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (
      isForumLoading ||
      !hasLoadedForumWallpaper ||
      !hasForumListLayout ||
      !hasForumContentLayout ||
      !hasComposerLayout ||
      (displayMessages.length > 0 && !hasRenderedForumMessage)
    ) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setIsForumLayoutReady(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [
    isForumLoading,
    hasLoadedForumWallpaper,
    hasForumListLayout,
    hasForumContentLayout,
    hasComposerLayout,
    displayMessages.length,
    hasRenderedForumMessage,
  ]);

  useEffect(() => {
    getStudentPersonalDetails(user?._id).then((details) => {
      if (details) setMyProfile(details);
    });
  }, [user?._id]);

  // Smart Mention & Reply Tracking State
  const [unreadMentionIds, setUnreadMentionIds] = useState<string[]>([]);
  const readMentionIdsRef = useRef<Set<string>>(new Set());
  const [readMentionVersion, setReadMentionVersion] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const dismissedMentionIds = useRef<Set<string>>(new Set());
  const focusMentionHandledRef = useRef(false);
  const deletedForMeIdsRef = useRef<Set<string>>(new Set());
  const lastReadCommunityIdRef = useRef<string | null>(null);
  const initialMentionBaselineDoneRef = useRef(false);

  // Options & Report Modal State
  const [selectedMsgForOptions, setSelectedMsgForOptions] = useState<CommunityMessage | null>(null);
  const [selectedMsgForReport, setSelectedMsgForReport] = useState<CommunityMessage | null>(null);
  const [reportReason, setReportReason] = useState<string>('inappropriate_content');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

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
  const [allowCommunityChat, setAllowCommunityChat] = useState<boolean>(true);
  const [forumParticipationAllowed, setForumParticipationAllowed] = useState<boolean>(true);

  // WhatsApp-Style Live Typing Indicator State & Animation
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [deletingUsers, setDeletingUsers] = useState<TypingUser[]>([]);
  const [botTyping, setBotTyping] = useState(false);
  const [botTypingName, setBotTypingName] = useState('Campus Bot');
  const [onlineCount, setOnlineCount] = useState(0);
  const [socketOnline, setSocketOnline] = useState(false);
  const [liveSession, setLiveSession] = useState<{ serverUrl: string; token: string; isHost: boolean } | null>(null);
  const [liveEnded, setLiveEnded] = useState(false);
  useEffect(() => {
    setDismissedLiveBannerKey(null);
  }, [liveBroadcastKey]);
  const liveSessionRef = useRef<typeof liveSession>(null);
  liveSessionRef.current = liveSession;
  useEffect(() => {
    if (!liveBroadcast) {
      livePulseAnim.setValue(0);
      return;
    }
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(livePulseAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(livePulseAnim, { toValue: 0, duration: 800, easing: Easing.in(Easing.ease), useNativeDriver: Platform.OS !== 'web' })
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [liveBroadcast?.hostId, liveBroadcast?.hostName, livePulseAnim]);
  const [liveLoading, setLiveLoading] = useState(false);
  const typingTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const deletingTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const myTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const myDeletingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const prevInputTextLengthRef = useRef<number>(0);
  const lastTypingHeartbeatRef = useRef<number>(0);
  const socketInstanceRef = useRef<any>(null);
  const typingDotAnim = useRef(new Animated.Value(0)).current;

  const clearTypingIndicators = () => {
    setBotTyping(false);
    setTypingUsers([]);
    setDeletingUsers([]);
    Object.values(typingTimeoutsRef.current).forEach((timeout) => clearTimeout(timeout));
    Object.values(deletingTimeoutsRef.current).forEach((timeout) => clearTimeout(timeout));
    typingTimeoutsRef.current = {};
    deletingTimeoutsRef.current = {};
  };

  useEffect(() => {
    if (typingUsers.length > 0 || deletingUsers.length > 0 || botTyping) {
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
  }, [typingUsers.length, deletingUsers.length, botTyping]);

  const handleGoLivePress = async () => {
    if (!user) {
      showIceMessage('Sign in required', 'Please sign in before requesting access to Go Live.');
      return;
    }

    if (liveLoading || liveSession) return;
    setLiveEnded(false);
    setLiveLoading(true);
    try {
      const isHost = !liveBroadcast || Boolean(liveBroadcast.hostId && user?._id && String(liveBroadcast.hostId) === String(user._id));
      const response = await apiRequest<{ url: string; token: string; isConfigured?: boolean }>(
        `/community/live/token?role=${isHost ? 'host' : 'viewer'}`
      );
      if (!response.success) {
        const message = response.error || 'The live streaming service is not configured on the server yet.';
        const isSetupIssue = message.toLowerCase().includes('not configured');
        showIceMessage(!networkOnline ? 'You’re offline' : isSetupIssue ? 'Live setup required' : 'Could not join live', !networkOnline ? 'An internet connection is needed to connect your live video to other people. Reconnect and try again.' : message);
        return;
      }
      if (!response.data?.url || !response.data?.token || response.data.token === 'socket_fallback_mode') {
        showIceMessage('Live setup required', 'The server did not return live streaming credentials. An administrator needs to finish the LiveKit setup.');
        return;
      }
      setLiveSession({ serverUrl: response.data.url, token: response.data.token, isHost });
    } catch (error: any) {
      const message = error?.message || 'Check your connection and try again.';
      showIceMessage(!networkOnline ? 'You’re offline' : message.includes('Go Live is not enabled') ? 'Go Live access' : 'Could not join live', !networkOnline ? 'An internet connection is needed to connect your live video to other people. Reconnect and try again.' : message);
    } finally {
      setLiveLoading(false);
    }
  };

  const handleLiveRoomReady = () => {
    const socket = socketInstanceRef.current;
    if (!socket?.connected || !liveSession) return;
    if (liveSession.isHost) {
      socket.emit('community:live_start', {
        hostName: user?.name || 'Moi Student',
        hostAvatar: user?.avatarUrl,
        hostId: user?._id
      });
    } else {
      socket.emit('community:live_join', {
        id: socket.id,
        name: user?.name || 'Moi Student',
        avatar: user?.avatarUrl
      });
    }
  };

  const closeLiveRoom = () => {
    const socket = socketInstanceRef.current;
    if (socket?.connected && liveSession) {
      if (liveSession.isHost) socket.emit('community:live_end');
      else socket.emit('community:live_leave', { id: socket.id });
    }
    setLiveSession(null);
    setLiveEnded(false);
  };

  const flatListRef = useRef<FlatList>(null);
  const lastSyncedISO = useRef<string | null>(null);
  const deltaSyncInFlightRef = useRef(false);
  const isNearBottomRef = useRef<boolean>(true);
  const isForumFocusedRef = useRef<boolean>(isForumFocused);
  const appStateRef = useRef<string | null | undefined>(AppState.currentState);
  const initialScrollDoneRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const userScrolledRef = useRef<boolean>(false);
  const scrollLatestAfterLayoutRef = useRef<boolean>(false);
  const socketPresenceRef = useRef(false);

  const addLocalPresenceNotice = (event: 'user_connected' | 'user_disconnected') => {
    const isConnected = event === 'user_connected';
    const nowTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowISO = new Date().toISOString();

    setMessages((previous) => {
      // Remove any prior local presence notices to ensure unique React keys and avoid render loop warnings
      const filtered = previous.filter((m: any) => !String(m?.id || '').startsWith('local_presence_'));
      return [
        ...filtered,
        {
          id: `local_presence_${event}_${Date.now()}`,
          senderName: 'System',
          senderFaculty: '',
          avatarBg: '#64748b',
          text: isConnected ? 'You came online' : 'You went offline',
          timestamp: nowTimestamp,
          isoDate: nowISO,
          isMe: false,
          isSystemNotice: true,
          eventType: event
        }
      ];
    });
  };

  useEffect(() => {
    isForumFocusedRef.current = isForumFocused;
    if (isForumFocused) {
      // Clear the numeric badge when the forum is opened. Keep the divider
      // until the user reaches the latest message.
      setUnreadCount(0);
    }
  }, [isForumFocused]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      appStateRef.current = state;
      if (state !== 'active') {
        clearTypingIndicators();
      }
    });
    return () => subscription.remove();
  }, []);

  const isChatVisible = () => isForumFocusedRef.current && appStateRef.current === 'active';
  const activePresenceUser = deletingUsers[0] || typingUsers[0];
  const activePresenceUsers = deletingUsers.length > 0 ? deletingUsers : typingUsers;
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
    if (Array.isArray(msg.mentions)) {
      const currentUserId = String(currUser._id || '');
      return Boolean(currentUserId && msg.mentions.some((mentionId) => String(mentionId) === currentUserId));
    }

    // Older saved messages do not have structured mention IDs, so keep their legacy name matching.
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

  const isMentionRead = useCallback((m: CommunityMessage): boolean => {
    const ids = [m.id, (m as any)._id, m.clientMsgId].filter(Boolean).map(String);
    return ids.some((id) => dismissedMentionIds.current.has(id) || readMentionIdsRef.current.has(id));
  }, []);

  const markMentionRead = useCallback((target: CommunityMessage | string) => {
    const idsToAdd: string[] = [];
    if (typeof target === 'string') {
      const targetStr = String(target);
      idsToAdd.push(targetStr);
      const found = messages.find((m) =>
        String(m.id) === targetStr ||
        String((m as any)._id || '') === targetStr ||
        String(m.clientMsgId || '') === targetStr
      );
      if (found) {
        if (found.id) idsToAdd.push(String(found.id));
        if ((found as any)._id) idsToAdd.push(String((found as any)._id));
        if (found.clientMsgId) idsToAdd.push(String(found.clientMsgId));
      }
    } else {
      if (target.id) idsToAdd.push(String(target.id));
      if ((target as any)._id) idsToAdd.push(String((target as any)._id));
      if (target.clientMsgId) idsToAdd.push(String(target.clientMsgId));
    }
    for (const id of idsToAdd) {
      dismissedMentionIds.current.add(id);
      readMentionIdsRef.current.add(id);
    }
    // Asynchronous background persistence - keeps app fast and never blocks JS thread
    void saveReadCommunityMentionIds(Array.from(readMentionIdsRef.current)).catch(() => {});
  }, [messages]);

  useEffect(() => {
    if (!user || messages.length === 0) return;

    // Only count new mentions that arrived after the established read baseline
    const lastReadId = lastReadCommunityIdRef.current;
    let candidateMessages = messages;
    if (lastReadId) {
      const lastReadIndex = messages.findIndex((m) =>
        String(m.id) === String(lastReadId) ||
        String((m as any)._id || '') === String(lastReadId) ||
        String(m.clientMsgId || '') === String(lastReadId)
      );
      if (lastReadIndex !== -1) {
        candidateMessages = messages.slice(lastReadIndex + 1);
      } else {
        // If the marker has fallen out of the compact window, don't re-count past history
        candidateMessages = [];
      }
    } else if (!initialMentionBaselineDoneRef.current) {
      return;
    }

    const mentions = candidateMessages
      .filter((m) => checkIsMentionOrReply(m, user, messages) && !isMentionRead(m))
      .map((m) => String(m.id))
      .reverse(); // Newest mention first

    setUnreadMentionIds(mentions);
  }, [messages, user, readMentionVersion, isMentionRead]);

  function scrollToLatestWhenReady(animated = true) {
    try {
      if (flatListRef.current) {
        if (typeof (flatListRef.current as any).scrollToOffset === 'function') {
          (flatListRef.current as any).scrollToOffset({ offset: 0, animated });
        } else if (typeof (flatListRef.current as any).scrollToIndex === 'function') {
          (flatListRef.current as any).scrollToIndex({ index: 0, animated });
        }
      }
    } catch (err) {
      console.warn('[CommunityChat] Safe scroll notice:', err);
    }
  }

  const scrollToMessage = (targetId: string): boolean => {
    const normalizedTargetId = String(targetId);
    const targetIndex = displayMessages.findIndex((m) =>
      String(m.id) === normalizedTargetId ||
      String((m as any)._id || '') === normalizedTargetId ||
      String(m.clientMsgId || '') === normalizedTargetId
    );
    if (targetIndex === -1 || !flatListRef.current) return false;

    const canonicalId = displayMessages[targetIndex].id;
    isNearBottomRef.current = targetIndex === 0;
    setHighlightedMsgId(canonicalId);
    try {
      flatListRef.current.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.5 });
    } catch (err) {
      try {
        (flatListRef.current as any).scrollToOffset?.({ offset: targetIndex * 70, animated: true });
      } catch {}
    }
    setTimeout(() => {
      setHighlightedMsgId((curr) => (curr === canonicalId ? null : curr));
    }, 3000);
    return true;
  };

  const handleJumpToNextMention = () => {
    if (unreadMentionIds.length === 0) return;

    const targetId = unreadMentionIds[0];

    // 1. Immediately decrement in-memory state (0ms lag: counter decreases instantly)
    setUnreadMentionIds((prev) => prev.filter((id) => id !== targetId));

    // 2. Mark mention as read and persist locally in background asynchronously
    markMentionRead(targetId);

    // 3. Smoothly scroll to the target message
    scrollToMessage(targetId);
  };

  useEffect(() => {
    if (String(focusMention) !== '1' || focusMentionHandledRef.current || unreadMentionIds.length === 0) return;
    focusMentionHandledRef.current = true;
    handleJumpToNextMention();
  }, [focusMention, unreadMentionIds.length]);

  const initReadStateAndScroll = async (currentMsgs: CommunityMessage[]) => {
    if (currentMsgs.length === 0) return;
    const lastReadId = await getLastReadCommunityMsgId();
    lastReadCommunityIdRef.current = lastReadId;

    if (!lastReadId) {
      const latestId = currentMsgs[currentMsgs.length - 1].id;
      await saveLastReadCommunityMsgId(latestId);
      lastReadCommunityIdRef.current = latestId;
      // Mark all pre-existing historical messages as read so the user never starts with a count of old mentions
      for (let i = 0; i < currentMsgs.length; i++) {
        markMentionRead(currentMsgs[i]);
      }
      setUnreadMentionIds([]);
      setUnreadCount(0);
      setFirstUnreadMsgId(null);
      setShowUnreadBtn(false);
      initialScrollDoneRef.current = true;
      initialMentionBaselineDoneRef.current = true;
      return;
    }

    const lastReadIndex = currentMsgs.findIndex((m) =>
      String(m.id) === String(lastReadId) ||
      String((m as any)._id || '') === String(lastReadId) ||
      String(m.clientMsgId || '') === String(lastReadId)
    );

    if (lastReadIndex !== -1) {
      // Mark all past messages up to and including lastReadIndex as read
      for (let i = 0; i <= lastReadIndex; i++) {
        markMentionRead(currentMsgs[i]);
      }
      if (lastReadIndex < currentMsgs.length - 1) {
        const firstUnreadIndex = lastReadIndex + 1;
        const firstUnreadId = currentMsgs[firstUnreadIndex].id;
        const count = currentMsgs.length - firstUnreadIndex;
        setFirstUnreadMsgId(firstUnreadId);
        setUnreadCount(count);
        setShowUnreadBtn(true);
      } else {
        setUnreadCount(0);
        setFirstUnreadMsgId(null);
        setShowUnreadBtn(false);
      }
    } else {
      // The compact window has moved past the old read marker; baseline gracefully
      const latestMsg = currentMsgs[currentMsgs.length - 1];
      if (latestMsg?.id) {
        lastReadCommunityIdRef.current = String(latestMsg.id);
        void saveLastReadCommunityMsgId(String(latestMsg.id));
      }
      for (let i = 0; i < currentMsgs.length; i++) {
        markMentionRead(currentMsgs[i]);
      }
      setUnreadCount(0);
      setFirstUnreadMsgId(null);
      setShowUnreadBtn(false);
    }
    initialScrollDoneRef.current = true;
    initialMentionBaselineDoneRef.current = true;
  };

  const markAsRead = async (latestId: string) => {
    lastReadCommunityIdRef.current = latestId;
    await saveLastReadCommunityMsgId(latestId);
    setUnreadCount(0);
    setFirstUnreadMsgId(null);
    setShowUnreadBtn(false);
  };

  const scrollToBottomAndMarkRead = () => {
    if (messages.length > 0) {
      const latestId = messages[messages.length - 1].id;
      markAsRead(latestId);
      setUnreadMentionIds([]);
    }
    scrollToLatestWhenReady(true);
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const isBottom = contentOffset.y <= 60;
    isNearBottomRef.current = isBottom;
    setShowUnreadBtn(!isBottom);

    if (isBottom && userScrolledRef.current && messages.length > 0) {
      const latestId = messages[messages.length - 1].id;
      void markAsRead(latestId);
      setUnreadMentionIds([]);
    }
  };

  useEffect(() => {
    // 1. Register push notification click tap listener for automatic navigation
    const cleanupNotif = setupNotificationResponseListener((screenPath) => {
      router.push(screenPath as any);
    });

    // 2. Instant Load from Phone Storage (0ms UI latency)
    const cacheReady = Promise.all([getStoredCommunityMessages(), getShowDemoMaterialsSetting(), getAllowCommunityChatSetting(), getForumParticipationSetting(), getCommunitySyncCursor(), getDeletedForMeMessageIds()]).then(async ([cachedMsgs, demoSetting, allowChat, forumAccess, storedCursor, deletedForMeIds]) => {
      deletedForMeIdsRef.current = new Set(deletedForMeIds);
      setShowDemoMaterials(demoSetting);
      setAllowCommunityChat(allowChat);
      setForumParticipationAllowed(forumAccess);
      const rawMsgs = (cachedMsgs && cachedMsgs.length > 0 ? cachedMsgs : (demoSetting ? INITIAL_COMMUNITY_MESSAGES : []))
        .filter((m: any) => !m?.isSystemNotice && !String(m?.id || '').startsWith('local_presence_') && !String(m?.id || '').startsWith('sys_'));
      const msgsToLoad = rawMsgs
        .filter((m) => !deletedForMeIdsRef.current.has(m.id) && !deletedForMeIdsRef.current.has((m as any)._id))
        .filter((m) => demoSetting || !isHardcodedCommunityMessage(m))
        .map((m) => ({
          ...m,
          isMe: evalIsMe(m.senderId, m.senderEmail, m.senderName, m.clientMsgId)
        }));
      if (cachedMsgs && cachedMsgs.length !== rawMsgs.length) {
        void saveCommunityMessages(rawMsgs);
      }
      const initialMessages = msgsToLoad;
      setMessages(initialMessages);
      const initialCursor = storedCursor || await ensureCommunitySyncCursor();
      lastSyncedISO.current = initialCursor;
      if ((!cachedMsgs || cachedMsgs.length === 0) && demoSetting) {
        saveCommunityMessages(INITIAL_COMMUNITY_MESSAGES);
      }
      initReadStateAndScroll(initialMessages);
      return initialMessages;
    }).catch((error) => {
      console.warn('[Community] Forum initialization failed:', error);
    });

    // 3. Connect Real-time WebSocket Listeners
    let activeSocket: any = null;
    getSocket().then((socket) => {
      if (socket) {
        activeSocket = socket;
        socketInstanceRef.current = socket;
        const handleSocketConnect = async () => {
          setSocketOnline(true);
          if (socketPresenceRef.current) addLocalPresenceNotice('user_connected');
          socketPresenceRef.current = true;
          socket.emit('community:request_online_count');
          socket.emit('community:request_live_status');
          if (liveSessionRef.current?.isHost) {
            socket.emit('community:live_start');
          } else if (liveSessionRef.current) {
            socket.emit('community:live_join', {
              id: socket.id,
              name: user?.name || 'Moi Student',
              avatar: user?.avatarUrl
            });
          }
          socket.emit('join_community');
          try {
            await fetchDeltaSync();
          } catch (syncErr) {
            console.warn('[Community] Reconnect delta sync error:', syncErr);
          }
          retryQueuedMessages();
        };
        const handleSocketReconnectError = (error: any) => {
          console.warn('[Community] Socket reconnect pending:', error?.message || error);
        };
        const handleSocketDisconnect = () => {
          setSocketOnline(false);
          if (socketPresenceRef.current) addLocalPresenceNotice('user_disconnected');
          socketPresenceRef.current = false;
          clearTypingIndicators();
        };
        socket.on('connect', handleSocketConnect);
        socket.on('connect_error', handleSocketReconnectError);
        socket.on('disconnect', handleSocketDisconnect);
        socket.on('community:online_count', (stats: { totalOnline?: number }) => {
          setOnlineCount(Math.max(0, Number(stats?.totalOnline || 0)));
        });
        socket.on('community:forum_access', (status: { allowed?: boolean }) => {
          if (typeof status?.allowed === 'boolean') setForumParticipationAllowed(status.allowed);
        });
        socket.on('community:live_start', (broadcast: { hostName?: string; hostId?: string }) => {
          const hostName = broadcast?.hostName || 'A student';
          const isMe = user?._id && broadcast?.hostId && String(user._id) === String(broadcast.hostId);
          setLiveBroadcast({ hostName, hostId: broadcast?.hostId });

          const now = new Date();
          const liveStartMsg: CommunityMessage = {
            id: `sys_live_start_${broadcast?.hostId || ''}_${Date.now()}`,
            senderName: 'System',
            senderFaculty: '',
            avatarBg: '#ef4444',
            text: isMe ? 'You went live' : `${hostName} went live`,
            timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isoDate: now.toISOString(),
            isMe: false,
            isSystemNotice: true,
            eventType: 'live_start'
          };

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.isSystemNotice && last.text === liveStartMsg.text) return prev;
            return [...prev, liveStartMsg];
          });
        });
        socket.on('community:live_status', (status: { active?: boolean; hostName?: string; hostId?: string }) => {
          setLiveBroadcast(status?.active
            ? { hostName: status.hostName || 'A student', hostId: status.hostId }
            : null);
        });
        socket.on('community:live_end', (data?: { hostName?: string }) => {
          const currentHost = data?.hostName || liveBroadcast?.hostName || 'Host';
          const wasHost = liveSessionRef.current?.isHost;
          setLiveBroadcast(null);
          if (liveSessionRef.current) setLiveEnded(true);

          const now = new Date();
          const liveEndMsg: CommunityMessage = {
            id: `sys_live_end_${Date.now()}`,
            senderName: 'System',
            senderFaculty: '',
            avatarBg: '#64748b',
            text: wasHost ? 'You ended the live session' : `${currentHost} ended live`,
            timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isoDate: now.toISOString(),
            isMe: false,
            isSystemNotice: true,
            eventType: 'live_end'
          };

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.isSystemNotice && last.text === liveEndMsg.text) return prev;
            return [...prev, liveEndMsg];
          });
        });
        if (socket.connected) {
          handleSocketConnect();
        } else {
          socket.connect();
        }

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
            senderYear: serverMsg.senderYear,
            senderPhone: serverMsg.senderPhone,
            senderAvatarUrl: serverMsg.senderAvatarUrl,
            senderBadge: serverMsg.senderBadge,
            avatarBg: serverMsg.avatarBg || '#15803d',
            text: serverMsg.text || '',
            mentions: Array.isArray(serverMsg.mentions) ? serverMsg.mentions.map((id: any) => String(id?._id || id)) : undefined,
            isPrivate: Boolean(serverMsg.isPrivate),
            privateNotice: Boolean(serverMsg.privateNotice),
            recipientId: serverMsg.recipientId ? String(serverMsg.recipientId?._id || serverMsg.recipientId) : undefined,
            recipientName: serverMsg.recipientName,
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
            const existingIdx = prev.findIndex((m) => {
              if (serverMsg.clientMsgId && (m.clientMsgId === serverMsg.clientMsgId || m.id === serverMsg.clientMsgId)) {
                return true;
              }
              if (m.id === formattedMsg.id || m.id === serverMsg._id) {
                return true;
              }
              if (m.isMe && isMyMsg) {
                const timeDiff = Math.abs(new Date(m.isoDate || 0).getTime() - new Date(formattedMsg.isoDate || 0).getTime());
                const textMatches = Boolean(m.text?.trim()) && Boolean(formattedMsg.text?.trim()) && m.text.trim() === formattedMsg.text.trim() && timeDiff < 40000;
                const stickerMatches = Boolean(m.stickerId) && Boolean(formattedMsg.stickerId) && m.stickerId === formattedMsg.stickerId && timeDiff < 40000;
                const fileMatches = Boolean(m.fileAttachment?.url) && m.fileAttachment?.url === formattedMsg.fileAttachment?.url && timeDiff < 40000;
                return textMatches || stickerMatches || fileMatches;
              }
              return false;
            });

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

            if (formattedMsg.isMe || (isChatVisible() && isNearBottomRef.current)) {
              if (!formattedMsg.privateNotice) markAsRead(formattedMsg.id);
              if (formattedMsg.isMe || isNearBottomRef.current) {
                scrollToLatestWhenReady(true);
              }
            } else {
              if (!isChatVisible()) {
                setUnreadCount((c) => c + 1);
              }
              setShowUnreadBtn(true);
              setFirstUnreadMsgId((prevUnread) => prevUnread || formattedMsg.id);
            }

            return updated;
          });

          if (serverMsg.senderId) {
            const sId = typeof serverMsg.senderId === 'object' ? serverMsg.senderId._id : serverMsg.senderId;
            setTypingUsers((prev) => prev.filter((u) => u.userId !== sId));
            setDeletingUsers((prev) => prev.filter((u) => u.userId !== sId));
          }

          if (!formattedMsg.isMe && !formattedMsg.isPrivate && Platform.OS === 'web') {
            sendWebBrowserNotification(
              `💬 ${formattedMsg.senderName}`,
              formattedMsg.text || `📎 Sent a file: ${formattedMsg.fileAttachment?.name || 'Attachment'}`,
              () => router.push('/(tabs)/messages')
            );
          }

        });

        socket.on('community:private_message', (serverMsg: any) => {
          const isMyMsg = evalIsMe(serverMsg.senderId, serverMsg.senderEmail, serverMsg.senderName, serverMsg.clientMsgId);
          const sentAt = serverMsg.createdAt || new Date().toISOString();
          const formattedMsg: CommunityMessage = {
            id: String(serverMsg._id || serverMsg.id || serverMsg.clientMsgId || Date.now()),
            senderId: String(serverMsg.senderId?._id || serverMsg.senderId || ''),
            senderEmail: serverMsg.senderEmail,
            senderName: serverMsg.senderName || 'Moi Student',
            senderFaculty: serverMsg.senderFaculty || 'Moi Student',
            senderCourse: serverMsg.senderCourse,
            senderYear: serverMsg.senderYear,
            senderAvatarUrl: serverMsg.senderAvatarUrl,
            senderBadge: serverMsg.senderBadge,
            avatarBg: serverMsg.avatarBg || '#15803d',
            text: serverMsg.text || '',
            timestamp: new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isoDate: sentAt,
            updatedAt: serverMsg.updatedAt || sentAt,
            isMe: isMyMsg,
            isPrivate: true,
            privateNotice: false,
            recipientId: String(serverMsg.recipientId?._id || serverMsg.recipientId || ''),
            recipientName: serverMsg.recipientName,
            reactions: serverMsg.reactions || {}
          };
          setMessages((previous) => {
            const existing = previous.findIndex((message) => message.id === formattedMsg.id);
            const updated = existing >= 0
              ? previous.map((message, index) => index === existing ? { ...message, ...formattedMsg } : message)
              : [...previous, formattedMsg];
            void saveCommunityMessages(updated);
            return updated;
          });
          if (!isMyMsg) {
            if (isChatVisible() && isNearBottomRef.current) {
              markAsRead(formattedMsg.id);
            } else {
              setUnreadCount((count) => count + 1);
              setShowUnreadBtn(true);
              setFirstUnreadMsgId((current) => current || formattedMsg.id);
            }
          }
          if (!isMyMsg && Platform.OS === 'web') {
            sendWebBrowserNotification(
              'Private message',
              'You received a private message.',
              () => router.push('/community')
            );
          }
        });

        socket.on('community:user_typing', (data: { userId: string; userName: string; avatarUrl?: string; avatarBg?: string; socketId?: string }) => {
          if (!data || !data.userId) return;

          // Never show the current user's own indicator on this socket instance
          if (socket?.id && data.socketId && socket.id === data.socketId) return;

          setTypingUsers((prev) => {
            const incomingUserId = String(data.userId);
            if (prev.some((u) => u.userId === incomingUserId)) {
              return prev.map((u) => u.userId === incomingUserId
                ? { ...u, userName: data.userName || u.userName, avatarUrl: data.avatarUrl || u.avatarUrl, avatarBg: data.avatarBg || u.avatarBg }
                : u);
            }
            return [...prev, { userId: incomingUserId, userName: data.userName || 'Moi Student', avatarUrl: data.avatarUrl, avatarBg: data.avatarBg }];
          });

          const incomingUserId = String(data.userId);
          setDeletingUsers((prev) => prev.filter((u) => u.userId !== incomingUserId));
          if (typingTimeoutsRef.current[incomingUserId]) {
            clearTimeout(typingTimeoutsRef.current[incomingUserId]);
          }
          typingTimeoutsRef.current[incomingUserId] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== incomingUserId));
            delete typingTimeoutsRef.current[incomingUserId];
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

        socket.on('community:user_deleting', (data: { userId: string; userName: string; avatarUrl?: string; avatarBg?: string; socketId?: string }) => {
          if (!data || !data.userId) return;
          if (socket?.id && data.socketId && socket.id === data.socketId) return;
          const incomingUserId = String(data.userId);

          setTypingUsers((prev) => prev.filter((u) => u.userId !== incomingUserId));
          setDeletingUsers((prev) => prev.some((u) => u.userId === incomingUserId)
            ? prev.map((u) => u.userId === incomingUserId ? { ...u, userName: data.userName || u.userName, avatarUrl: data.avatarUrl || u.avatarUrl, avatarBg: data.avatarBg || u.avatarBg } : u)
            : [...prev, { userId: incomingUserId, userName: data.userName || 'Moi Student', avatarUrl: data.avatarUrl, avatarBg: data.avatarBg }]);

          if (deletingTimeoutsRef.current[incomingUserId]) clearTimeout(deletingTimeoutsRef.current[incomingUserId]);
          deletingTimeoutsRef.current[incomingUserId] = setTimeout(() => {
            setDeletingUsers((prev) => prev.filter((u) => u.userId !== incomingUserId));
            delete deletingTimeoutsRef.current[incomingUserId];
          }, 3500);
        });

        socket.on('community:user_stop_deleting', (data: { userId: string }) => {
          if (!data || !data.userId) return;
          const incomingUserId = String(data.userId);
          setDeletingUsers((prev) => prev.filter((u) => u.userId !== incomingUserId));
          if (deletingTimeoutsRef.current[incomingUserId]) {
            clearTimeout(deletingTimeoutsRef.current[incomingUserId]);
            delete deletingTimeoutsRef.current[incomingUserId];
          }
        });

        socket.on('community:user_updated', (data: { userId?: string; email?: string; name?: string; avatarUrl?: string; badge?: 'blue' | 'red' | 'green' | null }) => {
          if (!data?.userId && !data?.email) return;
          const normalizedId = data.userId ? String(data.userId) : '';
          const normalizedEmail = data.email?.trim().toLowerCase() || '';
          setMessages((prev) => {
            const updated = prev.map((message) => {
              const sameId = normalizedId && String(message.senderId || '') === normalizedId;
              const sameEmail = normalizedEmail && message.senderEmail?.trim().toLowerCase() === normalizedEmail;
              const replyMatches = normalizedEmail && message.replyTo?.senderEmail?.trim().toLowerCase() === normalizedEmail;
              if (!sameId && !sameEmail && !replyMatches) return message;
              return {
                ...message,
                ...(sameId || sameEmail ? {
                  senderName: data.name || message.senderName,
                  senderAvatarUrl: data.avatarUrl || message.senderAvatarUrl,
                  senderBadge: data.badge || undefined
                } : {}),
                ...(replyMatches ? {
                  replyTo: message.replyTo
                    ? { ...message.replyTo, senderName: data.name || message.replyTo.senderName }
                    : message.replyTo
                } : {})
              };
            });
            if (JSON.stringify(updated) === JSON.stringify(prev)) return prev;
            saveCommunityMessages(updated);
            return updated;
          });
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
          // If this event is for the current user, local presence notice already handled it cleanly
          if (eventData?.userId && user?._id && String(eventData.userId) === String(user._id)) return;

          const sysMsg: CommunityMessage = {
            id: eventData.id || `sys_${Date.now()}`,
            senderName: 'System',
            senderFaculty: '',
            avatarBg: '#64748b',
            text: eventData.text || `${eventData.userName || 'Student'} ${eventData.event === 'user_connected' ? 'logged into MConnect' : 'went offline'}`,
            timestamp: new Date(eventData.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isoDate: eventData.timestamp || new Date().toISOString(),
            isMe: false,
            isSystemNotice: true,
            eventType: eventData.event || 'user_connected'
          };

          setMessages((prev) => {
            if (prev.length === 0) return [sysMsg];
            const lastIdx = prev.length - 1;
            const lastMsg = prev[lastIdx];

            // If the last message is already a system notice with the same text, update in place
            if (lastMsg.isSystemNotice && lastMsg.text === sysMsg.text) {
              const updated = [...prev];
              updated[lastIdx] = { ...sysMsg, id: lastMsg.id };
              return updated;
            }

            return [...prev, sysMsg];
          });
        });

        socket.on('community:message_deleted', (data: { messageId: string }) => {
          if (!data || !data.messageId) return;
          setMessages((prev) => {
            const updated = prev.filter((m) => m.id !== data.messageId && (m as any)._id !== data.messageId);
            saveCommunityMessages(updated);
            return updated;
          });
        });
      }
    });

    // 4. Trigger Incremental Delta Sync & set forum loading ready
    cacheReady
      .then(async () => {
        if (!cancelled) {
          await fetchDeltaSync();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsForumLoading(false);
        }
      });

    let cancelled = false;
    return () => {
      cancelled = true;
      cleanupNotif();
      clearTypingIndicators();
      if (activeSocket) {
        activeSocket.off('community:receive_message');
        activeSocket.off('community:private_message');
        activeSocket.off('community:user_typing');
        activeSocket.off('community:user_stop_typing');
        activeSocket.off('community:user_deleting');
        activeSocket.off('community:user_stop_deleting');
        activeSocket.off('community:user_updated');
        activeSocket.off('community:reaction_updated');
        activeSocket.off('community:message_deleted');
        activeSocket.off('community:system_event');
        activeSocket.off('community:online_count');
        activeSocket.off('community:live_start');
        activeSocket.off('community:live_status');
        activeSocket.off('community:live_end');
        activeSocket.off('connect');
        activeSocket.off('connect_error');
        activeSocket.off('disconnect');
      }
      socketInstanceRef.current = null;
      setSocketOnline(false);
    };
  }, [user]);

  const fetchDeltaSync = async () => {
    if (deltaSyncInFlightRef.current) return;
    deltaSyncInFlightRef.current = true;
    try {
      let syncCursor: string = lastSyncedISO.current || '';
      if (!syncCursor && messages.length > 0) {
        const latestTimestamp = messages.reduce((latest: string, message: any) => {
          const timestamp = message.updatedAt || message.isoDate || message.createdAt || '';
          return timestamp > latest ? timestamp : latest;
        }, '');
        if (latestTimestamp) syncCursor = latestTimestamp;
      }
      if (!syncCursor) {
        syncCursor = await ensureCommunitySyncCursor();
      }
      if (!syncCursor) return;
      let responseMessages: any[] = [];
      let allowCommunityChat: boolean | undefined;
      let forumAccessAllowed: boolean | undefined;
      let hasMore = true;
      let page = 0;
      let syncWatermark = '';
      let syncAfterId = '';

      while (hasMore && page < 100) {
        const sinceParam = `?since=${encodeURIComponent(syncCursor)}&limit=${COMMUNITY_MESSAGE_PAGE_SIZE}${syncWatermark ? `&until=${encodeURIComponent(syncWatermark)}` : ''}${syncAfterId ? `&sinceId=${encodeURIComponent(syncAfterId)}` : ''}`;
        const res = await apiRequest<any>(`/community/messages${sinceParam}`);
        if (!res || !res.success) break;
        const anyRes: any = res;
        syncWatermark = syncWatermark || anyRes.syncedAt || anyRes.data?.syncedAt || '';
        const pageMessages = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        responseMessages = [...responseMessages, ...pageMessages];
        allowCommunityChat = anyRes.allowCommunityChat ?? anyRes.data?.allowCommunityChat ?? allowCommunityChat;
        forumAccessAllowed = anyRes.forumAccessAllowed ?? anyRes.data?.forumAccessAllowed ?? forumAccessAllowed;
        hasMore = (anyRes.hasMore ?? anyRes.data?.hasMore) === true;
        page += 1;
        const serverSyncedAt = syncWatermark || anyRes.syncedAt || anyRes.data?.syncedAt || syncCursor;
        if (pageMessages.length > 0) {
          const lastMessage = pageMessages[pageMessages.length - 1];
          if (hasMore) {
            syncCursor = lastMessage.updatedAt || lastMessage.createdAt || serverSyncedAt;
            syncAfterId = String(lastMessage._id || lastMessage.id || '');
          } else {
            syncCursor = serverSyncedAt;
          }
        } else {
          hasMore = false;
          syncCursor = serverSyncedAt;
        }
      }

      if (allowCommunityChat !== undefined) {
        setAllowCommunityChat(allowCommunityChat);
      }
      if (forumAccessAllowed !== undefined) {
        setForumParticipationAllowed(forumAccessAllowed);
      }
      if (responseMessages.length > 0) {
        const fetchedMsgs: CommunityMessage[] = responseMessages.map((serverMsg: any) => {
          const isMyMsg = evalIsMe(serverMsg.senderId, serverMsg.senderEmail, serverMsg.senderName, serverMsg.clientMsgId);
          return {
            id: serverMsg._id || serverMsg.id || serverMsg._doc?._id || serverMsg._doc?.id,
            clientMsgId: serverMsg.clientMsgId,
            deliveryStatus: isMyMsg ? 'delivered' : undefined,
            senderId: serverMsg.senderId,
            senderEmail: serverMsg.senderEmail,
            senderName: serverMsg.senderName || serverMsg._doc?.senderName || 'Moi Student',
            senderFaculty: serverMsg.senderFaculty || 'Main Campus',
            senderCourse: serverMsg.senderCourse,
            senderYear: serverMsg.senderYear,
            senderPhone: serverMsg.senderPhone,
            senderAvatarUrl: serverMsg.senderAvatarUrl,
            senderBadge: serverMsg.senderBadge,
            avatarBg: serverMsg.avatarBg || '#15803d',
            text: serverMsg.text ?? serverMsg._doc?.text ?? '',
            mentions: Array.isArray(serverMsg.mentions ?? serverMsg._doc?.mentions)
              ? (serverMsg.mentions ?? serverMsg._doc?.mentions).map((id: any) => String(id?._id || id))
              : undefined,
            isPrivate: Boolean(serverMsg.isPrivate ?? serverMsg._doc?.isPrivate),
            privateNotice: Boolean(serverMsg.privateNotice ?? serverMsg._doc?.privateNotice),
            recipientId: serverMsg.recipientId
              ? String(serverMsg.recipientId?._id || serverMsg.recipientId)
              : (serverMsg._doc?.recipientId ? String(serverMsg._doc.recipientId) : undefined),
            recipientName: serverMsg.recipientName || serverMsg._doc?.recipientName,
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

        const mergeFetchedMessages = (baseMessages: CommunityMessage[]) => {
          const updated = [...baseMessages];
          let changed = false;
          for (const msg of fetchedMsgs) {
            const existingIdx = updated.findIndex((m) => {
              if (msg.clientMsgId && (m.clientMsgId === msg.clientMsgId || m.id === msg.clientMsgId)) {
                return true;
              }
              if (m.id === msg.id) {
                return true;
              }
              if (m.isMe && msg.isMe) {
                const timeDiff = Math.abs(new Date(m.isoDate || 0).getTime() - new Date(msg.isoDate || 0).getTime());
                const textMatches = Boolean(m.text?.trim()) && Boolean(msg.text?.trim()) && m.text.trim() === msg.text.trim() && timeDiff < 40000;
                const stickerMatches = Boolean(m.stickerId) && Boolean(msg.stickerId) && m.stickerId === msg.stickerId && timeDiff < 40000;
                const fileMatches = Boolean(m.fileAttachment?.url) && m.fileAttachment?.url === msg.fileAttachment?.url && timeDiff < 40000;
                return textMatches || stickerMatches || fileMatches;
              }
              return false;
            });

            if (existingIdx !== -1) {
              const wasMe = (msg.clientMsgId && tempSentIdsRef.current.has(msg.clientMsgId)) || msg.isMe;
              updated[existingIdx] = { ...updated[existingIdx], ...msg, isMe: wasMe };
              changed = true;
            } else {
              updated.push(msg);
              changed = true;
            }
          }
          return { updated, changed };
        };
        // Read the latest persisted cache before writing. Socket messages can
        // arrive while this HTTP sync is in flight; using the render's older
        // `messages` snapshot could otherwise overwrite those messages and
        // advance the cursor past them.
        const persistedMessages = await getStoredCommunityMessages();
        const mergedForStorage = mergeFetchedMessages(
          persistedMessages.length > 0 ? persistedMessages : messages
        );
        if (mergedForStorage.changed) {
          setMessages((previous) => mergeFetchedMessages(previous).updated);
          const saved = await saveCommunityMessages(mergedForStorage.updated);
          if (!saved) return;
        }
      }
      if (hasMore) return;
      if (syncCursor) {
        lastSyncedISO.current = syncCursor;
        await saveCommunitySyncCursor(syncCursor);
      }
    } catch (err) {
      console.log('Delta sync fallback:', err);
    } finally {
      deltaSyncInFlightRef.current = false;
    }
  };

  const reconcileRecentCommunityHistory = async (baseMessages: CommunityMessage[]) => {
    try {
      let res: any = null;
      let serverMessages: any[] = [];
      for (let attempt = 0; attempt < 2; attempt += 1) {
        res = await apiRequest<any>(`/community/messages?limit=50&historyRefresh=${Date.now()}_${attempt}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        serverMessages = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data) ? res.data.data : [];
        if (res?.success && serverMessages.length > 0) break;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 600));
      }
      if (!res?.success) return baseMessages;
      if (serverMessages.length === 0) return baseMessages;

      const recentMessages: CommunityMessage[] = serverMessages.map((serverMsg: any) => {
        const isMyMsg = evalIsMe(serverMsg.senderId, serverMsg.senderEmail, serverMsg.senderName, serverMsg.clientMsgId);
        return {
          id: serverMsg._id || serverMsg.id || serverMsg._doc?._id || serverMsg._doc?.id,
          clientMsgId: serverMsg.clientMsgId,
          deliveryStatus: isMyMsg ? 'delivered' : undefined,
          senderId: serverMsg.senderId,
          senderEmail: serverMsg.senderEmail,
          senderName: serverMsg.senderName || 'Moi Student',
          senderFaculty: serverMsg.senderFaculty || 'Main Campus',
          senderCourse: serverMsg.senderCourse,
          senderYear: serverMsg.senderYear,
          senderPhone: serverMsg.senderPhone,
          senderAvatarUrl: serverMsg.senderAvatarUrl,
          senderBadge: serverMsg.senderBadge,
          avatarBg: serverMsg.avatarBg || '#15803d',
          text: serverMsg.text ?? serverMsg._doc?.text ?? '',
          mentions: Array.isArray(serverMsg.mentions ?? serverMsg._doc?.mentions)
            ? (serverMsg.mentions ?? serverMsg._doc?.mentions).map((id: any) => String(id?._id || id))
            : undefined,
          isPrivate: Boolean(serverMsg.isPrivate ?? serverMsg._doc?.isPrivate),
          privateNotice: Boolean(serverMsg.privateNotice ?? serverMsg._doc?.privateNotice),
          recipientId: serverMsg.recipientId
            ? String(serverMsg.recipientId?._id || serverMsg.recipientId)
            : (serverMsg._doc?.recipientId ? String(serverMsg._doc.recipientId) : undefined),
          recipientName: serverMsg.recipientName || serverMsg._doc?.recipientName,
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

      const deduplicated: CommunityMessage[] = [];
      const addOrMerge = (msg: CommunityMessage) => {
        const id = String(msg.id || (msg as any)._id || '');
        const clientMsgId = String(msg.clientMsgId || '');
        const existingIdx = deduplicated.findIndex((existing) =>
          (id && (existing.id === id || (existing as any)._id === id || existing.clientMsgId === id)) ||
          (clientMsgId && (existing.clientMsgId === clientMsgId || existing.id === clientMsgId))
        );
        if (existingIdx !== -1) {
          deduplicated[existingIdx] = { ...deduplicated[existingIdx], ...msg };
        } else {
          deduplicated.push(msg);
        }
      };

      for (const message of baseMessages) addOrMerge(message);
      for (const message of recentMessages) addOrMerge(message);

      const persistedMessages = await getStoredCommunityMessages();
      for (const message of persistedMessages) addOrMerge(message);

      const merged = deduplicated.sort((a, b) =>
        String(a.isoDate || '').localeCompare(String(b.isoDate || ''))
      );

      setMessages((current) => {
        const result = [...current];
        for (const item of merged) {
          const itemId = String(item.id || (item as any)._id || '');
          const itemClientId = String(item.clientMsgId || '');
          const idx = result.findIndex((c) =>
            (itemId && (c.id === itemId || (c as any)._id === itemId || c.clientMsgId === itemId)) ||
            (itemClientId && (c.clientMsgId === itemClientId || c.id === itemClientId))
          );
          if (idx !== -1) {
            result[idx] = { ...result[idx], ...item };
          } else {
            result.push(item);
          }
        }
        return result.sort((a, b) =>
          String(a.isoDate || '').localeCompare(String(b.isoDate || ''))
        );
      });
      await saveCommunityMessages(merged);
      return merged;
    } catch (error) {
      console.warn('[Community] Recent history reconciliation failed:', error);
      return baseMessages;
    }
  };

  useEffect(() => {
    if (!isForumFocused || !user) return;
    let cancelled = false;

    const refreshForumFromOfflineCache = async () => {
      const [cachedMessages, storedCursor] = await Promise.all([
        getStoredCommunityMessages(),
        getCommunitySyncCursor()
      ]);
      if (cancelled) return;

      if (storedCursor) lastSyncedISO.current = storedCursor;
      if (cachedMessages.length > 0) {
        setMessages((current) => {
          const result = [...current];
          for (const cached of cachedMessages) {
            const cachedId = String(cached.id || cached._id || '');
            const cachedClientId = String(cached.clientMsgId || '');
            const enriched = { ...cached, isMe: evalIsMe(cached.senderId, cached.senderEmail, cached.senderName, cached.clientMsgId) };
            const idx = result.findIndex((c) =>
              (cachedId && (c.id === cachedId || (c as any)._id === cachedId || c.clientMsgId === cachedId)) ||
              (cachedClientId && (c.clientMsgId === cachedClientId || c.id === cachedClientId))
            );
            if (idx !== -1) {
              result[idx] = { ...result[idx], ...enriched };
            } else {
              result.push(enriched);
            }
          }
          return result.sort((a, b) =>
            String(a.isoDate || '').localeCompare(String(b.isoDate || ''))
          );
        });
      }

      const reconciledMessages = await reconcileRecentCommunityHistory(cachedMessages);
      await fetchDeltaSync();
      if (reconciledMessages.length > 0) {
        await initReadStateAndScroll(reconciledMessages);
      }
    };

    void refreshForumFromOfflineCache().catch((error) => {
      console.warn('[Community] Could not refresh forum from offline cache:', error);
    });
    return () => { cancelled = true; };
  }, [isForumFocused, user?._id]);

  useEffect(() => {
    if (showFileModal) {
      loadFiles();
    }
  }, [showFileModal, showDemoMaterials]);

  const loadFiles = async () => {
    try {
      const downloaded = await getDownloadedPapers();
      const converted: FileAttachment[] = downloaded.map((p) => {
        const savedTitle = (p.title || '').trim();
        const cleanTitle = !savedTitle || /^untitled(?: material)?$/i.test(savedTitle)
          ? p.unitName || p.department || 'Academic Material'
          : savedTitle;
        const cleanCode = p.unitCode || p.courseCode || 'MOI';
        return {
          // Keep the human-readable material title as the attachment name.
          // The attachment type already identifies it as a PDF, so exposing
          // the generated storage filename here only makes the picker noisy.
          name: cleanTitle,
          url: p.fileUrl || '',
          size: '1.8 MB',
          type: 'pdf',
          paperId: p._id,
          title: cleanTitle,
          unitCode: cleanCode,
          unitName: p.unitName || p.department || cleanTitle,
          school: p.school || 'Moi University',
          author: typeof p.uploadedBy === 'object' && p.uploadedBy ? (p.uploadedBy as any).name || 'Moi Student' : 'Moi Student'
        };
      });
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
    if (!showPrivateMessageModal || privateRecipient) return;
    const query = privateSearchQuery.trim();
    if (!query) {
      setPrivateSuggestions([]);
      setPrivateSuggestionsLoading(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setPrivateSuggestionsLoading(true);
      try {
        const response = await apiRequest<{ success: boolean; data?: MentionUser[] }>(
          `/community/mention-users?q=${encodeURIComponent(query)}`
        );
        if (!active) return;
        const selfId = String(user?._id || '');
        const rawList = Array.isArray(response?.data) ? response.data : [];
        setPrivateSuggestions(rawList.filter((entry: MentionUser) => String(entry.id) !== selfId));
      } catch {
        if (active) setPrivateSuggestions([]);
      } finally {
        if (active) setPrivateSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [showPrivateMessageModal, privateRecipient, privateSearchQuery, user?._id]);

  const openPrivateMessageComposer = () => {
    if (!user) {
      setShowFileModal(false);
      showIceMessage('Sign in required', 'Sign in before sending someone a private message.');
      return;
    }
    setPrivateRecipient(null);
    setPrivateSearchQuery('');
    setPrivateSuggestions([]);
    setPrivateMessageText('');
    setShowFileModal(false);
    setShowPrivateMessageModal(true);
  };

  const sendPrivateCommunityMessage = async () => {
    const text = privateMessageText.trim();
    if (!privateRecipient || !text || privateMessageSending) return;
    setPrivateMessageSending(true);
    try {
      const response = await apiRequest<any>('/community/private-messages', {
        method: 'POST',
        body: JSON.stringify({ recipientId: privateRecipient.id, text })
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Could not send your private message.');
      }

      const saved = response.data;
      const sentAt = saved.createdAt || new Date().toISOString();
      const formattedMessage: CommunityMessage = {
        id: String(saved._id || saved.id),
        senderId: String(saved.senderId || user?._id || ''),
        senderEmail: saved.senderEmail || user?.email,
        senderName: saved.senderName || user?.name || 'Moi Student',
        senderFaculty: saved.senderFaculty || 'Moi Student',
        senderCourse: saved.senderCourse,
        senderYear: saved.senderYear,
        senderAvatarUrl: saved.senderAvatarUrl || user?.avatarUrl,
        senderBadge: saved.senderBadge || user?.badge,
        avatarBg: saved.avatarBg || '#15803d',
        text: saved.text || text,
        timestamp: new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isoDate: sentAt,
        updatedAt: saved.updatedAt || sentAt,
        isMe: true,
        isPrivate: true,
        privateNotice: false,
        recipientId: String(saved.recipientId || privateRecipient.id),
        recipientName: saved.recipientName || privateRecipient.name,
        reactions: {}
      };
      setMessages((previous) => {
        const existing = previous.findIndex((message) => message.id === formattedMessage.id);
        const updated = existing >= 0
          ? previous.map((message, index) => index === existing ? { ...message, ...formattedMessage } : message)
          : [...previous, formattedMessage];
        void saveCommunityMessages(updated);
        return updated;
      });
      setShowPrivateMessageModal(false);
      setPrivateRecipient(null);
      setPrivateSearchQuery('');
      setPrivateMessageText('');
    } catch (error: any) {
      showIceMessage('Message not sent', error?.message || 'Check your connection and try again.');
    } finally {
      setPrivateMessageSending(false);
    }
  };

  useEffect(() => {
    void readMentionDirectoryCache().then((cached) => {
      if (cached.length > 0) setMentionDirectory(cached);
    });
  }, []);

  const selectMention = (entry: MentionUser) => {
    const isCampusBot = entry.id === 'campus-bot';
    const isCampusAI = entry.id === 'campus-ai';
    const mentionToken = isCampusBot
      ? 'campus_bot'
      : isCampusAI
        ? 'campus_ai'
        : entry.name.trim().replace(/\s+/g, '_');
    const activeMention = inputText.match(/(^|\s)@([^\s@]*)$/);
    const mentionStart = activeMention ? activeMention.index! + activeMention[1].length : inputText.length;
    const visibleToken = `@${mentionToken}`;
    const nextText = inputText.replace(/(^|\s)@[^\s@]*$/, `$1@${mentionToken} `);
    setInputText(nextText);
    if (!isCampusBot && !isCampusAI) {
      setSelectedMentionTargets((current) => [
        ...current,
        { userId: entry.id, token: visibleToken, start: mentionStart, end: mentionStart + visibleToken.length }
      ]);
    }
    setMentionQuery('');
    setShowMentionSuggestions(false);
  };

  const dismissMentionSuggestions = () => {
    setMentionQuery('');
    setShowMentionSuggestions(false);
  };

  const handleInputChange = (text: string) => {
    // Smart GIF & Image Paste / Keyboard insertion detector
    const pastedDiff = text.length - prevInputTextLengthRef.current;
    if (pastedDiff > 4 || (!selectedFile && (text.startsWith('http') || text.startsWith('data:image/')))) {
      const detected = extractImageOrGifUrl(text);
      if (detected && !selectedFile) {
        setSelectedFile({
          name: detected.isGif ? 'GIF' : 'Image',
          url: detected.url,
          size: detected.isGif ? 'GIF' : 'Image',
          type: 'image'
        });
        text = detected.remainingText;
      }
    }

    const wasDeleting = text.length < prevInputTextLengthRef.current;
    prevInputTextLengthRef.current = text.length;
    setSelectedMentionTargets((current) => updateMentionRangesForTextChange(inputText, text, current));
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

    const sock = socketInstanceRef.current;
    const emitPayload = {
      userName: user?.name || 'Moi Student',
      userId: user?._id,
      avatarUrl: user?.avatarUrl || myProfile?.avatarUri,
      avatarBg: '#15803d'
    };

    if (wasDeleting) {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
        sock?.emit('community:stop_typing', emitPayload);
      }

      sock?.emit('community:start_deleting', emitPayload);
      if (myDeletingTimeoutRef.current) clearTimeout(myDeletingTimeoutRef.current);
      myDeletingTimeoutRef.current = setTimeout(() => {
        sock?.emit('community:stop_deleting', emitPayload);
        myDeletingTimeoutRef.current = null;
      }, text.trim().length === 0 ? 1500 : 2500);
    } else if (text.trim().length > 0) {
      if (myDeletingTimeoutRef.current) {
        clearTimeout(myDeletingTimeoutRef.current);
        myDeletingTimeoutRef.current = null;
        sock?.emit('community:stop_deleting', emitPayload);
      }

      const now = Date.now();
      if (!isTypingRef.current || now - lastTypingHeartbeatRef.current > 1800) {
        isTypingRef.current = true;
        lastTypingHeartbeatRef.current = now;
        sock?.emit('community:start_typing', emitPayload);
      }

      if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
      myTypingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sock?.emit('community:stop_typing', emitPayload);
      }, 2500);
    } else {
      if (myDeletingTimeoutRef.current) {
        clearTimeout(myDeletingTimeoutRef.current);
        myDeletingTimeoutRef.current = null;
      }
      sock?.emit('community:stop_deleting', emitPayload);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
        sock?.emit('community:stop_typing', emitPayload);
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
      const socket = await ensureConnectedSocket(2000);
      if (socket?.connected) {
        // Mark delivery as sent immediately so retry timer doesn't duplicate
        updateMessageDelivery(clientMsgId, 'delivered');
        socket.emit('community:send_message', payload, (ack: { success?: boolean; error?: string }) => {
          retryingMessageIdsRef.current.delete(clientMsgId);
          if (ack?.success) {
            updateMessageDelivery(clientMsgId, 'sent');
          } else if (ack?.error === 'Community chat disabled by administrator') {
            setAllowCommunityChat(false);
            setMessages((prev) => prev.filter((message) => message.clientMsgId !== clientMsgId));
            showIceMessage('Community chat disabled', ack.error);
          } else if (ack?.error?.includes('eligible for forum participation')) {
            setForumParticipationAllowed(false);
            setMessages((prev) => prev.filter((message) => message.clientMsgId !== clientMsgId));
            showIceMessage('Forum participation unavailable', ack.error);
          }
        });
        // Release ref after short timeout if ack callback wasn't returned
        setTimeout(() => {
          retryingMessageIdsRef.current.delete(clientMsgId);
        }, 5000);
      } else {
        // Use HTTP only when Socket.IO is unavailable.
        const result = await apiRequest('/community/messages', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        retryingMessageIdsRef.current.delete(clientMsgId);
        if (result.success) {
          if (payload.waitForBot) {
            const persistedId = result.data?._id || result.data?.id;
            if (persistedId) {
              setMessages((prev) => prev.map((message) =>
                message.clientMsgId === clientMsgId ? { ...message, id: persistedId } : message
              ));
            }
          }
          updateMessageDelivery(clientMsgId, 'sent');
        } else if (result.error === 'Community chat disabled by administrator') {
          setAllowCommunityChat(false);
          setMessages((prev) => prev.filter((message) => message.clientMsgId !== clientMsgId));
          showIceMessage('Community chat disabled', result.error);
        } else if (result.error?.includes('eligible for forum participation')) {
          setForumParticipationAllowed(false);
          setMessages((prev) => prev.filter((message) => message.clientMsgId !== clientMsgId));
          showIceMessage('Forum participation unavailable', result.error);
        }
      }
    } catch (error) {
      retryingMessageIdsRef.current.delete(clientMsgId);
      console.log('[Community] Message queued while offline.');
    }
  };

  const retryQueuedMessages = () => {
    setMessages((prevMsgs) => {
      prevMsgs
        .filter((message) => message.isMe && message.deliveryStatus === 'queued' && message.pendingPayload)
        .forEach((message) => void transmitMessage(message.pendingPayload, message.clientMsgId || message.id));
      return prevMsgs;
    });
  };

    useEffect(() => {
      void retryQueuedMessages();
      const appStateSubscription = AppState.addEventListener('change', (state) => {
        appStateRef.current = state;
        if (state === 'active') {
          void getSocket().then((socket) => {
            if (socket && !socket.connected) socket.connect();
          });
          // Keep the last cursor that was actually returned by the server.
          // Advancing it while the app is backgrounded makes messages sent
          // from web disappear from the next delta sync (the push can still
          // arrive, but the message itself is then queried after its time).
          void fetchDeltaSync();
          void retryQueuedMessages();
        } else {
          void flushCommunityMessagesSync();
        }
      });
      let browserOnlineHandler: (() => void) | undefined;
      let browserOfflineHandler: (() => void) | undefined;
      if (typeof window !== 'undefined' && window.addEventListener) {
        browserOnlineHandler = () => {
          void fetchDeltaSync();
          void getSocket().then((socket) => {
            if (socket && !socket.connected) socket.connect();
          });
        };
        browserOfflineHandler = () => clearTypingIndicators();
        window.addEventListener('online', browserOnlineHandler);
        window.addEventListener('offline', browserOfflineHandler);
      }
    const retryTimer = setInterval(retryQueuedMessages, 15000);
    return () => {
      void flushCommunityMessagesSync();
      appStateSubscription.remove();
      if (browserOnlineHandler && typeof window !== 'undefined') window.removeEventListener('online', browserOnlineHandler);
      if (browserOfflineHandler && typeof window !== 'undefined') window.removeEventListener('offline', browserOfflineHandler);
      clearInterval(retryTimer);
    };
  }, []);
  const handleSendMessage = (stickerId?: string, overrideFile?: FileAttachment) => {
    if (!forumParticipationAllowed) {
      showIceMessage('Forum participation unavailable', 'You are not eligible for forum participation.');
      return;
    }
    const now = Date.now();
    if (now - lastSendTimestampRef.current < 350) {
      return;
    }
    lastSendTimestampRef.current = now;

    // Never attach leftover selectedFile or draft text when sending a dedicated sticker
    let fileToSend = stickerId ? undefined : (overrideFile || selectedFile);
    let sentText = stickerId ? '' : inputText.trim();

    // Auto-detect GIF / image link pasted directly into chat
    if (!fileToSend && !stickerId && sentText) {
      const detected = extractImageOrGifUrl(sentText);
      if (detected) {
        fileToSend = {
          name: detected.isGif ? 'GIF' : 'Image',
          url: detected.url,
          size: detected.isGif ? 'GIF' : 'Image',
          type: 'image'
        };
        sentText = detected.remainingText;
      }
    }

    if (isUploadingMedia && !overrideFile) {
      sendPendingAfterUploadRef.current = true;
      setSendPendingAfterUpload(true);
      showIceMessage('Uploading Media…', 'Your message will send automatically once the media finishes uploading.');
      return;
    }

    if (uploadFailed && !overrideFile) {
      showIceMessage('Media Upload Failed', 'Please tap retry on the attachment to finish uploading before sending.');
      return;
    }

    if (!sentText && !fileToSend && !stickerId) return;

    // Clear the picker explicitly; clearing the input does not run handleInputChange.
    dismissMentionSuggestions();

    setSendButtonBusy(true);
    if (sendButtonBusyTimeoutRef.current) clearTimeout(sendButtonBusyTimeoutRef.current);
    sendButtonBusyTimeoutRef.current = setTimeout(() => {
      setSendButtonBusy(false);
      sendButtonBusyTimeoutRef.current = null;
    }, 650);

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

    if (myDeletingTimeoutRef.current) {
      clearTimeout(myDeletingTimeoutRef.current);
      myDeletingTimeoutRef.current = null;
    }
    getSocket().then((s) => s?.emit('community:stop_deleting', {
      userName: user?.name || 'Moi Student',
      userId: user?._id
    }));

    const isStopCommand = /^\s*@(bot|campusbot|campus[\s_]+bot|ai|campusai|campus[\s_]+ai)\s+stop\b/i.test(sentText);
    const mentionMatch = sentText.match(/(?:^|[^\w@])@(bot|campusbot|campus[\s_]+bot|ai|campusai|campus[\s_]+ai)\b/i);
    const isDirectBotMention = !!mentionMatch && !isStopCommand;
    const isReplyToBot = Boolean(replyingTo && isCampusAssistantMessage(replyingTo) && !isStopCommand);
    const isBotMentioned = isDirectBotMention || isReplyToBot;

    // Start the bot indicator before any network work so it is visible immediately.
    if (isBotMentioned) {
      setBotTyping(true);
      let botName = 'Campus Bot';
      if (mentionMatch) {
        const target = mentionMatch[1].toLowerCase().replace(/[\s_]+/g, '');
        botName = (target === 'ai' || target === 'campusai') ? 'Campus AI' : 'Campus Bot';
      } else if (replyingTo && isCampusAIMessage(replyingTo)) {
        botName = 'Campus AI';
      }
      setBotTypingName(botName);
    } else if (isStopCommand) {
      setBotTyping(false);
    }

    const replyToData = replyingTo
      ? {
          id: replyingTo.id,
          senderId: replyingTo.senderId,
          senderEmail: replyingTo.senderEmail,
          senderName: replyingTo.senderName,
          text: replyingTo.text,
          fileAttachment: replyingTo.fileAttachment
        }
      : undefined;

    const mentionedUserIds = stickerId
      ? []
      : Array.from(new Set(selectedMentionTargets.map((mention) => mention.userId)));

    const tempId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    tempSentIdsRef.current.add(tempId);

    const effectiveCourse = !isUnsetCommunityValue(user?.course) ? user?.course : (!isUnsetCommunityValue(myProfile?.course) ? myProfile?.course : undefined);
    const effectiveYear = !isUnsetCommunityValue(user?.yearOfStudy) ? user?.yearOfStudy : (!isUnsetCommunityValue(myProfile?.yearOfStudy) ? myProfile?.yearOfStudy : undefined);
    const effectiveSchool = !isUnsetCommunityValue(user?.school) ? user?.school : (!isUnsetCommunityValue(myProfile?.school) ? myProfile?.school : undefined);

    const facultySubtitle = formatStudentSubtitle(
      effectiveSchool,
      effectiveCourse,
      effectiveYear,
      (user as any)?.department
    );

    const payload = {
      clientMsgId: tempId,
      senderId: user ? user._id : undefined,
      senderEmail: user ? user.email : undefined,
      text: sentText,
      mentions: mentionedUserIds,
      fileAttachment: fileToSend || undefined,
      stickerId,
      replyTo: replyToData,
      senderName: user ? user.name : 'Moi Student',
      senderFaculty: facultySubtitle,
      senderCourse: effectiveCourse,
      senderYear: effectiveYear,
      senderPhone: user?.phone || myProfile?.phone,
      senderAvatarUrl: user?.avatarUrl || myProfile?.avatarUri,
      senderBadge: user?.badge,
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
      senderYear: payload.senderYear,
      senderPhone: payload.senderPhone,
      senderAvatarUrl: payload.senderAvatarUrl,
      senderBadge: payload.senderBadge,
      avatarBg: payload.avatarBg,
      text: sentText,
      mentions: mentionedUserIds,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isoDate: new Date().toISOString(),
      isMe: true,
      fileAttachment: fileToSend || undefined,
      stickerId,
      replyTo: replyToData,
      reactions: {}
    };

    // 1. Instant Optimistic Render & Save to Local Phone Storage
    scrollLatestAfterLayoutRef.current = true;
    setMessages((prev) => {
      const updated = [...prev, newMessage];
      saveCommunityMessages(updated);
      markAsRead(newMessage.id);
      return updated;
    });

    if (!stickerId) {
      setInputText('');
      prevInputTextLengthRef.current = 0;
      setSelectedMentionTargets([]);
    }
    setPendingUploadItem(null);
    setUploadFailed(false);
    setSendPendingAfterUpload(false);
    sendPendingAfterUploadRef.current = false;
    setSelectedFile(null);
    setShowStickerPicker(false);
    setReplyingTo(null);

    scrollToLatestWhenReady(true);

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

  const handleDeleteForMe = async (msg: CommunityMessage) => {
    try {
      const msgId = msg.id;
      if (user) {
        const serverDelete = await apiRequest(`/community/messages/${encodeURIComponent(msgId)}/delete-for-me`, { method: 'POST' });
        if (!serverDelete.success) {
          throw new Error(serverDelete.error || 'Could not save this deletion to your account.');
        }
      }
      deletedForMeIdsRef.current.add(msgId);
      await saveDeletedForMeMessageId(msgId);
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== msgId && (m as any)._id !== msgId);
        saveCommunityMessages(updated);
        return updated;
      });
      setSelectedMsgForOptions(null);
      showIceMessage('Message Removed 🗑️', 'Deleted for you on this device.');
    } catch {
      showIceMessage('Error', 'Could not delete message for you.');
    }
  };

  const handleDeleteForEveryone = async (msg: CommunityMessage) => {
    try {
      const msgId = msg.id;
      setSelectedMsgForOptions(null);

      const res = await apiRequest(`/community/messages/${msgId}`, { method: 'DELETE' });
      if (res.success) {
        setMessages((prev) => {
          const updated = prev.filter((m) => m.id !== msgId && (m as any)._id !== msgId);
          saveCommunityMessages(updated);
          return updated;
        });
        showIceMessage('Message Deleted 🚨', 'Deleted for everyone in the community.');
      } else {
        showIceMessage('Delete Failed', res.error || 'Could not delete message for everyone.');
      }
    } catch {
      showIceMessage('Delete Error', 'Network error while deleting message.');
    }
  };

  const handleCopyMessageText = async (msg: CommunityMessage) => {
    try {
      const textToCopy = msg.text || msg.fileAttachment?.name || '';
      await Clipboard.setStringAsync(textToCopy);
      setSelectedMsgForOptions(null);
      showIceMessage('Text Copied 📋', 'Message text copied to clipboard!');
    } catch {
      setSelectedMsgForOptions(null);
      showIceMessage('Copy Failed', 'Could not copy the message text.');
    }
  };

  const handleOpenReportModal = (msg: CommunityMessage) => {
    setSelectedMsgForOptions(null);
    setSelectedMsgForReport(msg);
    setReportReason('inappropriate_content');
    setReportDetails('');
  };

  const handleSubmitReport = async () => {
    if (!selectedMsgForReport) return;
    setIsSubmittingReport(true);
    try {
      const res = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'community_message',
          targetId: selectedMsgForReport.id,
          reason: reportReason,
          details: reportDetails.trim() || `Reported message text: "${(selectedMsgForReport.text || '').slice(0, 100)}"`
        })
      });
      setIsSubmittingReport(false);
      setSelectedMsgForReport(null);

      if (res.success) {
        showIceMessage('Report Submitted 🚩', 'Thank you! Admin team will review this report in the dashboard.');
      } else {
        showIceMessage('Report Failed', res.error || 'Could not submit report.');
      }
    } catch {
      setIsSubmittingReport(false);
      setSelectedMsgForReport(null);
      showIceMessage('Report Error', 'Could not submit report. Please try again.');
    }
  };
  const handleOpenFileAttachment = (file: FileAttachment) => {
    if (file.type === 'pdf') {
      const cleanTitle = file.title || file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
      const docItem: PDFDocumentItem = {
        id: file.paperId || `att_${Date.now()}`,
        title: cleanTitle,
        unitCode: file.unitCode || 'MOI',
        unitName: file.unitName || file.school || 'Academic Material',
        school: file.school || 'Moi University',
        fileUrl: file.url,
        author: file.author || 'Moi Student',
        summary: `Shared material: ${cleanTitle}`,
        sampleText: `Shared document content for ${file.unitCode || 'course'}: ${cleanTitle}.`
      };
      setPreviewDoc(docItem);
      setShowPreviewModal(true);
    } else {
      setMediaPreview(file);
    }
  };

  const handleDownloadFileAttachment = (file: FileAttachment) => {
    if (!file?.url) return;
    const downloadKey = file.paperId || file.url;
    setDownloadAttachmentFailedKey(null);
    void mediaDownloadManager.startDownload({
      url: file.url,
      name: file.name,
      title: file.title,
      type: file.type,
      paperId: file.paperId,
      unitCode: file.unitCode,
      unitName: file.unitName,
      school: file.school,
      author: file.author,
      size: file.size,
      thumbnail: isVideoAttachment(file) ? getCloudinaryVideoPreviewUrl(file.url) : file.url
    });
  };

  const handleCancelFileDownload = (key: string) => {
    void mediaDownloadManager.cancelDownload(key);
  };

  const executeUpload = async (itemToUpload: {
    uri: string;
    name: string;
    mimeType: string;
    kind: 'image' | 'video' | 'pdf' | 'doc';
    rawFile?: any;
  }) => {
    setIsUploadingMedia(true);
    setUploadFailed(false);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        if (itemToUpload.rawFile && typeof Blob !== 'undefined' && itemToUpload.rawFile instanceof Blob) {
          formData.append('file', itemToUpload.rawFile, itemToUpload.name);
        } else {
          const response = await fetch(itemToUpload.uri);
          const fetchedBlob = await response.blob();
          formData.append('file', fetchedBlob, itemToUpload.name);
        }
      } else {
        formData.append('file', {
          uri: itemToUpload.uri,
          name: itemToUpload.name,
          type: itemToUpload.mimeType || (itemToUpload.kind === 'video' ? 'video/mp4' : itemToUpload.kind === 'image' ? 'image/jpeg' : 'application/octet-stream')
        } as any);
      }

      const res = await apiRequest('/community/upload-media', {
        method: 'POST',
        body: formData
      });

      setIsUploadingMedia(false);

      if (res.success && res.data?.url) {
        setUploadFailed(false);
        const finalType: 'image' | 'video' | 'pdf' =
          (res.data.type || itemToUpload.kind) === 'video'
            ? 'video'
            : (res.data.type || itemToUpload.kind) === 'image'
              ? 'image'
              : 'pdf';
        const uploadedFileObj: FileAttachment = {
          name: res.data.name || itemToUpload.name,
          url: res.data.url,
          publicId: res.data.publicId,
          size: res.data.size || 'Media file',
          type: finalType
        };
        setSelectedFile(uploadedFileObj);

        if (sendPendingAfterUploadRef.current) {
          sendPendingAfterUploadRef.current = false;
          setSendPendingAfterUpload(false);
          void handleSendMessage(undefined, uploadedFileObj);
        }
      } else {
        setUploadFailed(true);
        setIsUploadingMedia(false);
        showIceMessage('Upload Failed', res.error || 'Failed to upload media. Tap retry to try again.');
      }
    } catch (err: any) {
      setUploadFailed(true);
      setIsUploadingMedia(false);
      showIceMessage('Upload Error', 'Could not upload media. Tap retry to try again.');
    }
  };

  const handlePickMedia = async (kind: 'image' | 'video') => {
    try {
      setPickingMediaKind(kind);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPickingMediaKind(null);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: kind === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.9
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const rawFile = (asset as any).file;
        const item = {
          uri: asset.uri,
          name: asset.fileName || `${kind}_${Date.now()}.${kind === 'image' ? 'jpg' : 'mp4'}`,
          mimeType: asset.mimeType || (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
          kind,
          rawFile
        };
        setPendingUploadItem(item);
        setSelectedFile({
          name: item.name,
          url: asset.uri,
          size: 'Loading…',
          type: kind
        });
        setShowFileModal(false);
        await executeUpload(item);
      }
    } catch (err) {
      setIsUploadingMedia(false);
      setUploadFailed(true);
      showIceMessage('Upload Error', 'Could not select or upload media.');
    } finally {
      setPickingMediaKind(null);
    }
  };

  const handleTakeMedia = async () => {
    try {
      setPickingMediaKind('camera');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPickingMediaKind(null);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        videoMaxDuration: 120,
        quality: 0.9
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const type: 'video' | 'image' = asset.type === 'video' ? 'video' : 'image';
        const rawFile = (asset as any).file;
        const item = {
          uri: asset.uri,
          name: asset.fileName || `camera_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
          mimeType: asset.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
          kind: type,
          rawFile
        };
        setPendingUploadItem(item);
        setSelectedFile({
          name: item.name,
          url: asset.uri,
          size: 'Loading…',
          type
        });
        setShowFileModal(false);
        await executeUpload(item);
      }
    } catch (err) {
      setIsUploadingMedia(false);
      setUploadFailed(true);
      showIceMessage('Camera Error', 'Could not capture or upload media.');
    } finally {
      setPickingMediaKind(null);
    }
  };

  const handlePickFromPhone = async () => {
    try {
      setPickingMediaKind('doc');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const assetNameLower = (asset.name || '').toLowerCase();
        const rawFile = (asset as any).file;
        const attachmentType: 'image' | 'video' | 'pdf' = (asset.mimeType?.startsWith('image/') || assetNameLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|heic|svg)$/i))
          ? 'image'
          : (asset.mimeType?.startsWith('video/') || assetNameLower.match(/\.(mp4|mov|m4v|webm|mkv|avi|3gp|flv|wmv)$/i))
            ? 'video'
            : 'pdf';
        const item = {
          uri: asset.uri,
          name: asset.name || `doc_${Date.now()}`,
          mimeType: asset.mimeType || (attachmentType === 'image' ? 'image/jpeg' : attachmentType === 'video' ? 'video/mp4' : 'application/pdf'),
          kind: attachmentType,
          rawFile
        };
        setPendingUploadItem(item);
        setSelectedFile({
          name: item.name,
          url: asset.uri,
          size: 'Loading…',
          type: attachmentType
        });
        setShowFileModal(false);
        await executeUpload(item);
      }
    } catch (err: any) {
      setIsUploadingMedia(false);
      setUploadFailed(true);
      console.log('Document picker / upload error:', err);
      showIceMessage('Upload Error', 'Could not select or upload file.');
    } finally {
      setPickingMediaKind(null);
    }
  };

  const renderCommunityCell = React.useCallback(({ children, style, item, ...props }: any) => {
    const isPickerOpen = Boolean(
      item &&
      activeReactionMsgId &&
      (item.id === activeReactionMsgId || (item.clientMsgId && item.clientMsgId === activeReactionMsgId))
    );
    return (
      <View
        {...props}
        style={[
          style,
          isPickerOpen && { position: 'relative', zIndex: 999999, elevation: 99999 }
        ]}
      >
        {children}
      </View>
    );
  }, [activeReactionMsgId]);

  const handleExitForum = useCallback(() => {
    try {
      Keyboard.dismiss();
    } catch {}
    setShowStickerPicker(false);
    dismissMentionSuggestions();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  }, [router]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (!isForumFocused) return false;
      if (showStickerPicker) {
        setShowStickerPicker(false);
        return true;
      }
      if (selectedFile) {
        setSelectedFile(null);
        return true;
      }
      if (replyingTo) {
        setReplyingTo(null);
        return true;
      }
      handleExitForum();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [isForumFocused, showStickerPicker, selectedFile, replyingTo, handleExitForum]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Top Header Banner */}
        <View style={styles.header} onLayout={(event) => setForumHeaderHeight(event.nativeEvent.layout.height)}>
          <TouchableOpacity style={styles.backBtn} onPress={handleExitForum} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Exit Uni Forum">
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerAvatarContainer}>
            <View style={styles.headerAvatar}>
              <Image
                source={require('../assets/uni-forum-avatar.png')}
                style={styles.headerAvatarImg}
                resizeMode="contain"
              />
            </View>
            <View
              style={[
                styles.onlineDot,
                !networkOnline
                  ? styles.offlineDot
                  : !socketOnline
                  ? styles.connectingDot
                  : styles.activeOnlineDot
              ]}
            />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              <Text style={{ color: '#ffffff' }}>Uni </Text>
              <Text style={{ color: '#a7f3d0' }}>Forum</Text>
            </Text>
            <View style={styles.onlineSubtitle}>
              {!networkOnline ? (
                <>
                  <WifiOffIcon color="#fca5a5" size={13} />
                  <Text style={styles.offlineHeaderSubtitle}>You're offline</Text>
                </>
              ) : !socketOnline ? (
                <>
                  <ActivityIndicator size={11} color="#fef08a" />
                  <Text style={styles.connectingHeaderSubtitle}>Connecting...</Text>
                </>
              ) : (
                <>
                  <OnlineStatusIcon color="#86efac" size={13} />
                  <Text style={styles.headerSubtitle}>
                    {Math.max(1, onlineCount).toLocaleString()} students online • Open Forum
                  </Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.goLiveHeaderBtn, liveBroadcast && styles.goLiveHeaderBtnActive]}
            onPress={handleGoLivePress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={liveLoading ? 'Connecting to live' : liveBroadcast ? `Join live with ${liveBroadcast.hostName}` : 'Start a live broadcast'}
            disabled={liveLoading || Boolean(liveSession)}
          >
            {liveBroadcast && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.livePulseHalo,
                  {
                    opacity: livePulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] }),
                    transform: [{ scale: livePulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }]
                  }
                ]}
              />
            )}
            {liveLoading ? <ActivityIndicator color="#ffffff" size="small" /> : <TransmitterIcon color="#ffffff" size={18} />}
          </TouchableOpacity>
        </View>

        {/* Floating Background Download Progress Banner */}
        {(() => {
          const bgDl = Object.values(activeMediaDownloads).find((dl) => dl.status === 'downloading');
          if (!bgDl) return null;
          return (
            <View style={styles.floatingDownloadBanner}>
              <View style={styles.floatingDownloadIconWrap}>
                <ActivityIndicator color="#22c55e" size="small" />
              </View>
              <View style={styles.floatingDownloadInfo}>
                <View style={styles.floatingDownloadTopRow}>
                  <Text style={styles.floatingDownloadTitle} numberOfLines={1}>
                    Downloading {bgDl.title || 'media'}
                  </Text>
                  <Text style={styles.floatingDownloadPercent}>
                    {bgDl.progress}%
                  </Text>
                </View>
                <View style={styles.floatingProgressBarBg}>
                  <View style={[styles.floatingProgressBarFill, { width: `${bgDl.progress}%` }]} />
                </View>
                <Text style={styles.floatingDownloadBytes}>
                  {bgDl.bytesText} • Runs in background
                </Text>
              </View>
              <TouchableOpacity
                style={styles.floatingDownloadCancelBtn}
                onPress={() => handleCancelFileDownload(bgDl.key)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Cancel download"
              >
                <Text style={styles.floatingDownloadCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* WhatsApp-Style Chat Wallpaper (Randomized from 5 themed wallpapers) */}
        <ImageBackground
          source={wallpaperSource}
          style={styles.chatBackground}
          imageStyle={styles.chatWallpaperImage}
          resizeMode="cover"
          onLoadEnd={() => setHasLoadedForumWallpaper(true)}
          onError={() => setHasLoadedForumWallpaper(true)}
        >
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            extraData={activeReactionMsgId}
            CellRendererComponent={renderCommunityCell}
            onViewableItemsChanged={forumViewabilityCallback}
            onLayout={() => setHasForumListLayout(true)}
            onContentSizeChange={() => {
              setHasForumListLayout(true);
              setHasForumContentLayout(true);
              if (scrollLatestAfterLayoutRef.current) {
                scrollLatestAfterLayoutRef.current = false;
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }));
                });
              }
            }}
            inverted={true}
            initialNumToRender={18}
            maxToRenderPerBatch={10}
            windowSize={7}
            updateCellsBatchingPeriod={30}
            removeClippedSubviews={Platform.OS !== 'web'}
            keyExtractor={(item, index) => String(item.id || `community-message-${index}`)}
            contentContainerStyle={styles.messageList}
            maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              if (showStickerPicker) setShowStickerPicker(false);
              if (activeReactionMsgId) setActiveReactionMsgId(null);
              isDraggingRef.current = true;
              userScrolledRef.current = true;
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
            ListFooterComponent={
              <View style={styles.dateDivider}>
                <Text style={styles.dateDividerText}>TODAY • FORUM DISCUSSION</Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.isLiveNotice) {
                return (
                  <View style={styles.liveNoticeRow}>
                    <View style={styles.liveNoticeCard}>
                      <View style={styles.liveNoticeCopy}>
                        <View style={styles.liveNoticeTitleRow}>
                          <View style={styles.liveNoticeDot} />
                          <Text style={styles.liveNoticeTitle} numberOfLines={1}>{item.liveHostName || item.senderName} is live</Text>
                        </View>
                        <Text style={styles.liveNoticeSubtitle}>Join the live campus chat</Text>
                      </View>
                      <TouchableOpacity style={styles.liveNoticeJoin} onPress={handleGoLivePress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Join live with ${item.liveHostName || item.senderName}`}>
                        <Text style={styles.liveNoticeJoinText}>Join</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
              if (item.isSystemNotice) {
                const isConn = item.eventType === 'user_connected';
                const isSec = item.eventType === 'security';
                const isLiveStart = item.eventType === 'live_start';
                const isLiveEnd = item.eventType === 'live_end';
                return (
                  <View style={styles.systemNoticeContainer}>
                    <TouchableOpacity
                      activeOpacity={isLiveStart && !liveSession ? 0.75 : 1}
                      onPress={isLiveStart && !liveSession ? handleGoLivePress : undefined}
                      style={[
                        styles.systemNoticePill,
                        isLiveStart && styles.systemNoticeLiveStartPill,
                        isLiveEnd && styles.systemNoticeLiveEndPill
                      ]}
                    >
                      <View
                        style={[
                          styles.systemNoticeDot,
                          isLiveStart
                            ? styles.systemNoticeLiveStartDot
                            : (isLiveEnd
                              ? styles.systemNoticeLiveEndDot
                              : (isSec
                                ? styles.systemNoticeSecurity
                                : (isConn ? styles.systemNoticeConnected : styles.systemNoticeDisconnected)))
                        ]}
                      />
                      <Text
                        style={[
                          styles.systemNoticeText,
                          isLiveStart && styles.systemNoticeLiveStartText
                        ]}
                        numberOfLines={2}
                      >
                        {item.text}
                      </Text>
                      {!!item.timestamp && <Text style={styles.systemNoticeTime}>{item.timestamp}</Text>}
                      {isLiveStart && !liveSession && (
                        <Text style={styles.systemNoticeJoinHint}>Watch</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }

              const isPickerOpen = Boolean(
                activeReactionMsgId && (item.id === activeReactionMsgId || (item.clientMsgId && item.clientMsgId === activeReactionMsgId))
              );
              const hasReactions = item.reactions && Object.keys(item.reactions).length > 0;
              const isFirstUnread = item.id === firstUnreadMsgId;

              return (
                <View style={[{ width: '100%' }, isPickerOpen && { position: 'relative', zIndex: 999999, elevation: 99999 }]}>
                  {/* WhatsApp-Style Unread Divider Line */}
                  {isFirstUnread && (
                    <View style={styles.unreadDividerContainer}>
                      <View style={styles.unreadDividerLine} />
                      <View style={styles.unreadDividerPill}>
                        <Text style={styles.unreadDividerText}>
                          {unreadCount > 0 ? `${unreadCount} UNREAD ${unreadCount === 1 ? 'MESSAGE' : 'MESSAGES'}` : 'UNREAD MESSAGES'}
                        </Text>
                      </View>
                      <View style={styles.unreadDividerLine} />
                    </View>
                  )}

                  <SwipeableMessageItem onReply={() => setReplyingTo(item)} isPickerOpen={isPickerOpen}>
                    <View style={[styles.messageBubbleWrapper, item.isMe ? styles.myWrapper : styles.otherWrapper, isPickerOpen && { position: 'relative', zIndex: 999999, elevation: 99999 }]}>
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

                      <View style={[styles.bubbleContainer, isPickerOpen && { position: 'relative', zIndex: 999999, elevation: 99999 }]}>
                        {(() => {
                          const hasMedia = Boolean(item.fileAttachment && isMediaAttachment(item.fileAttachment));
                          const isMediaOnly = hasMedia && !item.text?.trim() && !item.replyTo && !item.stickerId;
                          const isStickerOnly = Boolean(item.stickerId && !item.text?.trim() && !item.replyTo && !item.fileAttachment);

                          return (
                            <TouchableOpacity
                              activeOpacity={0.9}
                              delayLongPress={500}
                              onLongPress={() => setSelectedMsgForOptions(item)}
                              onPress={() => {
                                if (isPickerOpen) setActiveReactionMsgId(null);
                              }}
                              style={[
                                styles.bubble,
                                item.isMe ? styles.myBubble : styles.otherBubble,
                                highlightedMsgId === item.id && styles.highlightedBubble,
                                isMediaOnly && styles.mediaOnlyBubble,
                                isStickerOnly && styles.stickerOnlyBubble
                              ]}
                            >
                              {!item.isMe && (
                                <View style={styles.senderHeader}>
                                  <View style={styles.senderNameRow}>
                                    <Text style={[styles.senderName, { color: item.avatarBg }]}>{item.senderName}</Text>
                                    <UserBadge badge={item.senderBadge} size={11} />
                                  </View>
                                  <Text style={styles.senderFaculty}>{getCommunitySenderSubtitle(item, user, myProfile)}</Text>
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
                                      {getReplySenderLabel(item.replyTo, user)}
                                    </Text>
                                    <LinkifiedText
                                      style={[styles.engulfedText, item.isMe ? styles.engulfedTextMe : styles.engulfedTextOther]}
                                      numberOfLines={2}
                                      onPressVideo={(videoUrl) => setMediaPreview({ name: 'Video', url: videoUrl, size: '', type: 'video' })}
                                    >
                                      {getSmartReplySnippet(item.replyTo)}
                                    </LinkifiedText>
                                  </View>
                                  {getReplyAttachmentThumbnail(item.replyTo)}
                                </TouchableOpacity>
                              )}

                              {item.stickerId && (
                                STICKER_SOURCES[item.stickerId] ? (
                                  <TouchableOpacity activeOpacity={1} delayLongPress={500} onLongPress={() => setSelectedMsgForOptions(item)}>
                                    <Image source={STICKER_SOURCES[item.stickerId]} style={styles.sentStickerImage} resizeMode="contain" />
                                  </TouchableOpacity>
                                ) : (item.stickerId.startsWith('http://') || item.stickerId.startsWith('https://') || item.stickerId.startsWith('data:image/')) ? (
                                  <TouchableOpacity activeOpacity={1} delayLongPress={500} onLongPress={() => setSelectedMsgForOptions(item)}>
                                    <Image source={{ uri: item.stickerId }} style={styles.sentStickerImage} resizeMode="contain" />
                                  </TouchableOpacity>
                                ) : null
                              )}

                              {/* File Attachment or Pure Media Card */}
                              {item.fileAttachment && (
                                <View style={hasMedia ? styles.mediaAttachmentWrapper : styles.docAttachmentWrapper}>
                                  {hasMedia ? (
                                    <TouchableOpacity
                                      style={styles.chatMediaPreview}
                                      delayLongPress={500}
                                      onLongPress={() => setSelectedMsgForOptions(item)}
                                      onPress={() => {
                                        const fileKey = item.fileAttachment?.paperId || item.fileAttachment?.url;
                                        if (downloadAttachmentFailedKey === fileKey) {
                                          handleDownloadFileAttachment(item.fileAttachment!);
                                          return;
                                        }

                                        setMediaPreview(item.fileAttachment || null);
                                      }}
                                      activeOpacity={0.88}
                                    >
                                      <SmartMediaThumbnail
                                        uri={isVideoAttachment(item.fileAttachment)
                                          ? getCloudinaryVideoPreviewUrl(item.fileAttachment.url)
                                          : item.fileAttachment.url}
                                        videoUrl={item.fileAttachment.url}
                                        type={isVideoAttachment(item.fileAttachment) ? 'video' : 'image'}
                                        title={item.fileAttachment.name}
                                        fileSize={item.fileAttachment.size}
                                        fileType={item.fileAttachment.type}
                                        showPlayBadge={true}
                                        style={styles.chatMediaImage}
                                      />

                                      {/* WhatsApp-style Bit-by-bit Download Progress Overlay with Cancel */}
                                      {(() => {
                                        const bubbleFileKey = item.fileAttachment?.paperId || item.fileAttachment?.url || '';
                                        const bubbleDl = bubbleFileKey ? activeMediaDownloads[bubbleFileKey] : undefined;
                                        if (bubbleDl?.status !== 'downloading') return null;
                                        return (
                                          <View style={styles.chatMediaDownloadOverlay}>
                                            <TouchableOpacity
                                              style={styles.chatMediaDownloadCircle}
                                              onPress={(e) => {
                                                e.stopPropagation();
                                                handleCancelFileDownload(bubbleFileKey);
                                              }}
                                              activeOpacity={0.7}
                                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                              accessibilityLabel="Cancel download"
                                            >
                                              <ActivityIndicator size="small" color="#22c55e" />
                                              <Text style={styles.chatMediaDownloadPercentText}>
                                                {bubbleDl.progress > 0 ? `${bubbleDl.progress}%` : '…'}
                                              </Text>
                                              <Text style={styles.chatMediaCancelSmallText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.chatMediaDownloadBytesText}>
                                              {bubbleDl.bytesText || 'Downloading…'}
                                            </Text>
                                          </View>
                                        );
                                      })()}

                                      {/* WhatsApp-style Download Interrupted / Failed Retry Overlay */}
                                      {downloadAttachmentFailedKey === (item.fileAttachment.paperId || item.fileAttachment.url) && (
                                        <View style={styles.chatMediaDownloadOverlay}>
                                          <View style={styles.chatMediaRetryCircle}>
                                            <Text style={styles.chatMediaRetryIcon}>↺</Text>
                                          </View>
                                          <Text style={styles.chatMediaRetryText}>Download failed</Text>
                                          <Text style={styles.chatMediaRetrySubText}>Tap to retry</Text>
                                        </View>
                                      )}

                                      {/* WhatsApp-style Save/Download button on media for incoming messages */}
                                      {!item.isMe && (!activeMediaDownloads[item.fileAttachment.paperId || item.fileAttachment.url] || activeMediaDownloads[item.fileAttachment.paperId || item.fileAttachment.url]?.status !== 'downloading') && downloadAttachmentFailedKey !== (item.fileAttachment.paperId || item.fileAttachment.url) && (
                                        <TouchableOpacity
                                          style={styles.chatMediaDownloadCornerBtn}
                                          onPress={(e) => {
                                            e.stopPropagation();
                                            handleDownloadFileAttachment(item.fileAttachment!);
                                          }}
                                          activeOpacity={0.8}
                                        >
                                          <DownloadIcon color="#ffffff" size={13} />
                                        </TouchableOpacity>
                                      )}
                                    </TouchableOpacity>
                                  ) : (
                                    <TouchableOpacity
                                      style={styles.fileCard}
                                      onPress={() => handleOpenFileAttachment(item.fileAttachment!)}
                                      activeOpacity={0.8}
                                    >
                                      <View style={styles.fileIconBox}>
                                        <FileTextIcon color="#15803d" size={24} />
                                      </View>
                                      <View style={styles.fileInfo}>
                                        <Text style={styles.fileName} numberOfLines={1}>{item.fileAttachment.name}</Text>
                                        <Text style={styles.fileMeta}>{item.fileAttachment.size} • {item.fileAttachment.type.toUpperCase()}</Text>
                                      </View>
                                      {!item.isMe && (
                                        <TouchableOpacity
                                          style={styles.fileDownloadBtn}
                                          onPress={(e) => {
                                            e.stopPropagation();
                                            handleDownloadFileAttachment(item.fileAttachment!);
                                          }}
                                        >
                                          <DownloadIcon color="#ffffff" size={14} />
                                        </TouchableOpacity>
                                      )}
                                    </TouchableOpacity>
                                  )}
                                </View>
                              )}

                              {item.isPrivate && (
                                <View style={styles.privateMessageLabelRow}>
                                  <LockIcon color={item.isMe ? '#15803d' : '#64748b'} size={11} />
                                  <Text style={[styles.privateMessageLabel, item.isMe ? styles.myPrivateMessageLabel : styles.otherPrivateMessageLabel]}>Private message</Text>
                                </View>
                              )}

                              {item.privateNotice ? (
                                null
                              ) : !!item.text ? (
                                <ExpandableMessageText
                                  text={item.text}
                                  style={[styles.messageText, item.isMe ? styles.myText : styles.otherText]}
                                  onPressVideo={(videoUrl) => setMediaPreview({ name: 'Video', url: videoUrl, size: '', type: 'video' })}
                                />
                              ) : null}

                              {/* Timestamp & Ticks */}
                              <View style={[styles.metaRow, isMediaOnly && styles.mediaMetaRow, isStickerOnly && styles.stickerMetaRow]}>
                                <TouchableOpacity
                                  style={styles.reactionTriggerBtn}
                                  onPress={() => setActiveReactionMsgId(isPickerOpen ? null : item.id)}
                                >
                                  <SmileIcon color={isStickerOnly ? '#ffffff' : (item.isMe ? '#854d0e' : '#94a3b8')} size={12} />
                                </TouchableOpacity>

                                <Text style={[styles.timestamp, item.isMe ? styles.myTimestamp : styles.otherTimestamp, isStickerOnly && styles.stickerTimestamp]}>
                                  {item.timestamp}
                                </Text>
                                {item.isMe && (
                                  item.deliveryStatus === 'queued' ? (
                                    <Text style={[styles.queuedClock, isStickerOnly && styles.stickerTimestamp]}>◷</Text>
                                  ) : (
                                    <View style={styles.ticksWrapper}>
                                      <CheckIcon color={item.deliveryStatus === 'delivered' ? '#38bdf8' : (isStickerOnly ? '#e2e8f0' : '#94a3b8')} size={14} />
                                      {item.deliveryStatus === 'delivered' && (
                                        <CheckIcon color="#38bdf8" size={14} style={styles.secondTick} />
                                      )}
                                    </View>
                                  )
                                )}
                              </View>
                              {isPickerOpen && (
                                <View style={[styles.reactionPickerBar, { right: 0 }]}>
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
                            </TouchableOpacity>
                          );
                        })()}

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
                                <Text style={styles.reactionBadgeText}>
                                  {emoji}{' '}
                                  <Text style={styles.reactionCountText}>{String(count)}</Text>
                                </Text>
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

          {/* Dismiss sticker picker when tapping outside on chat area */}
          {showStickerPicker && (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowStickerPicker(false)}
              accessible={false}
            />
          )}

          {/* WhatsApp Style Floating Unread / Scroll to Bottom Button */}
          {!showForumLoading && showUnreadBtn && (
            <TouchableOpacity
              style={[styles.floatingUnreadBtn, { bottom: floatingBottomOffset }]}
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
          {!showForumLoading && unreadMentionIds.length > 0 && (
            <TouchableOpacity
              style={[styles.floatingMentionBtn, { bottom: floatingBottomOffset }]}
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
                    Replying to <Text style={styles.replyPreviewName}>{replyingTo.isMe ? 'You' : replyingTo.senderName}</Text>
                  </Text>
                </View>
                <LinkifiedText
                  style={styles.replyPreviewSnippet}
                  numberOfLines={1}
                  onPressVideo={(videoUrl) => setMediaPreview({ name: 'Video', url: videoUrl, size: '', type: 'video' })}
                >
                  {getSmartReplySnippet(replyingTo)}
                </LinkifiedText>
              </View>
              {getReplyAttachmentThumbnail(replyingTo)}
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
            <View style={[styles.filePreviewBanner, uploadFailed && styles.filePreviewBannerError]}>
              <View style={styles.filePreviewLeft}>
                <View style={styles.composerThumbnailWrapper}>
                  {selectedFile.type === 'image' ? (
                    <Image source={{ uri: pendingUploadItem?.uri || selectedFile.url }} style={styles.composerMediaThumbnail} />
                  ) : selectedFile.type === 'video' ? (
                    <View style={styles.composerVideoThumbnail}><VideoIcon color="#ffffff" size={18} /></View>
                  ) : (
                    <FileTextIcon color="#15803d" size={20} />
                  )}
                  {isUploadingMedia && (
                    <View style={styles.composerMediaLoadingOverlay}>
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  )}
                  {uploadFailed && (
                    <TouchableOpacity
                      style={styles.composerRetryOverlay}
                      onPress={() => pendingUploadItem && executeUpload(pendingUploadItem)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.composerRetryOverlayIcon}>↺</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.filePreviewName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={[styles.filePreviewMeta, uploadFailed && { color: '#ef4444', fontWeight: '700' }]}>
                    {isUploadingMedia
                      ? (sendPendingAfterUpload ? 'Uploading media… will auto-send' : 'Uploading to cloud…')
                      : uploadFailed
                        ? 'Upload failed • Tap ↺ to retry'
                        : `${selectedFile.size} • Ready to send`}
                  </Text>
                </View>
              </View>
              {isUploadingMedia ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color="#15803d" />
                  <TouchableOpacity
                    onPress={() => {
                      setIsUploadingMedia(false);
                      setSendPendingAfterUpload(false);
                      sendPendingAfterUploadRef.current = false;
                      setSelectedFile(null);
                      setPendingUploadItem(null);
                    }}
                    style={styles.removeFileBtn}
                  >
                    <Text style={styles.removeFileText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : uploadFailed ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.composerRetryBtn}
                    onPress={() => pendingUploadItem && executeUpload(pendingUploadItem)}
                  >
                    <Text style={styles.composerRetryBtnText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setUploadFailed(false);
                      setSelectedFile(null);
                      setPendingUploadItem(null);
                    }}
                    style={styles.removeFileBtn}
                  >
                    <Text style={styles.removeFileText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedFile(null);
                    setPendingUploadItem(null);
                  }}
                  style={styles.removeFileBtn}
                >
                  <Text style={styles.removeFileText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* WhatsApp Style Live Typing Indicator Banner */}
          {(typingUsers.length > 0 || deletingUsers.length > 0 || botTyping) && (
            <View style={styles.typingIndicatorBanner}>
              <View style={styles.typingIndicatorAvatarStack}>
                {botTyping && !activePresenceUser ? (
                  <View style={styles.typingIndicatorAvatar}>
                    <BotIcon color="#6366f1" size={16} />
                  </View>
                ) : (
                  activePresenceUsers.slice(0, 3).map((presenceUser, index) => (
                    <View
                      key={presenceUser.userId}
                      style={[
                        styles.typingIndicatorAvatar,
                        index > 0 && styles.typingIndicatorAvatarOverlap,
                        { backgroundColor: presenceUser.avatarBg || '#e2e8f0' }
                      ]}
                    >
                      {presenceUser.avatarUrl ? (
                        <Image source={{ uri: presenceUser.avatarUrl }} style={styles.typingIndicatorAvatarImage} />
                      ) : (
                        <Text style={styles.typingIndicatorAvatarText}>
                          {presenceUser.userName.trim().charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                  ))
                )}
              </View>
              <View style={styles.typingIndicatorContent}>
                {deletingUsers.length > 0 ? (
                  <Text style={styles.typingIndicatorText} numberOfLines={1}>
                    {formatDeletingText(deletingUsers)}
                  </Text>
                ) : botTyping && typingUsers.length === 0 ? (
                  <View style={styles.typingBotLabel}>
                    <Text style={styles.typingIndicatorText} numberOfLines={1}>{botTypingName} is typing...</Text>
                  </View>
                ) : (
                  <Text style={styles.typingIndicatorText} numberOfLines={1}>
                    {formatTypingText(typingUsers)}
                  </Text>
                )}
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
              </View>
            </View>
          )}

          {/* WhatsApp Style Bottom Input Bar */}
          {showStickerPicker && (
            <View
              ref={stickerPickerRef}
              {...({ 'data-sticker-picker': 'true' } as any)}
              style={styles.stickerPicker}
            >
              {/* WhatsApp-Style Tab Selector */}
              <View style={styles.pickerTabRow}>
                <TouchableOpacity
                  style={[styles.pickerTabBtn, pickerTab === 'stickers' && styles.pickerTabBtnActive]}
                  onPress={() => setPickerTab('stickers')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerTabLabel, pickerTab === 'stickers' && styles.pickerTabLabelActive]}>
                    ✨ Stickers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerTabBtn, pickerTab === 'gifs' && styles.pickerTabBtnActive]}
                  onPress={() => setPickerTab('gifs')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerTabLabel, pickerTab === 'gifs' && styles.pickerTabLabelActive]}>
                    🎬 GIFs
                  </Text>
                </TouchableOpacity>
              </View>

              {pickerTab === 'stickers' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stickerPickerScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {STICKERS.map((sticker) => (
                    <TouchableOpacity
                      key={sticker.id}
                      style={styles.stickerOption}
                      onPress={() => handleSendMessage(sticker.id)}
                      activeOpacity={0.8}
                    >
                      <Image source={sticker.source} style={styles.stickerOptionImage} resizeMode="contain" />
                      <Text style={styles.stickerOptionLabel}>{sticker.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.gifPickerContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.gifCategoryScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {['All', 'Laugh', 'Love', 'Party', 'Clap', 'Fire', 'Sad', 'Cool', 'Wow', 'Think', 'Agree', 'Bye'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.gifCategoryPill, gifCategory === cat && styles.gifCategoryPillActive]}
                        onPress={() => setGifCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.gifCategoryText, gifCategory === cat && styles.gifCategoryTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.gifScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {GIFS
                      .filter((g) => gifCategory === 'All' || g.category.toLowerCase() === gifCategory.toLowerCase())
                      .map((gif) => (
                        <SmartGifCardItem
                          key={gif.id}
                          gif={gif}
                          shouldLoad={showStickerPicker && pickerTab === 'gifs'}
                          onPress={() => {
                            handleSendMessage(undefined, {
                              name: gif.fileName || `${gif.title}.gif`,
                              url: gif.url,
                              size: 'GIF',
                              type: 'image'
                            });
                          }}
                        />
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
          {showMentionSuggestions && (
            <>
              <Pressable
                style={styles.mentionDismissOverlay}
                onPress={dismissMentionSuggestions}
                accessibilityRole="button"
                accessibilityLabel="Close mention suggestions"
              />
              <View style={styles.mentionSuggestions}>
                <View style={styles.mentionSuggestionsHeader}>
                  <Text style={styles.mentionSuggestionsTitle}>Mention someone</Text>
                  {mentionLoading && <Text style={styles.mentionSuggestionsLoading}>Updating…</Text>}
                </View>
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.mentionSuggestionsList}>
                  {MENTION_ASSISTANTS
                    .filter((entry) => matchesMentionEntry(entry, mentionQuery))
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
                    .filter((entry) => matchesMentionEntry(entry, mentionQuery))
                    .slice(0, 8)
                    .map((entry) => (
                      <TouchableOpacity key={entry.id} style={styles.mentionRow} onPress={() => selectMention(entry)} activeOpacity={0.75}>
                        {entry.avatarUrl ? <Image source={{ uri: entry.avatarUrl }} style={styles.mentionAvatar} /> : <View style={styles.mentionAvatarFallback}><Text style={styles.mentionAvatarFallbackText}>{entry.name[0]?.toUpperCase()}</Text></View>}
                        <View style={styles.mentionUserText}>
                          <Text style={styles.mentionUserName} numberOfLines={1}>{entry.name}</Text>
                          <Text style={styles.mentionUserSubtitle}>MConnect user</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  {!mentionLoading && MENTION_ASSISTANTS.every((entry) => !matchesMentionEntry(entry, mentionQuery)) && mentionDirectory.filter((entry) => matchesMentionEntry(entry, mentionQuery)).length === 0 && (
                    <Text style={styles.mentionEmptyText}>No matching users yet</Text>
                  )}
                </ScrollView>
              </View>
            </>
          )}
          {allowCommunityChat && forumParticipationAllowed ? <View onLayout={() => setHasComposerLayout(true)} style={[styles.inputContainer, { paddingBottom: composerPaddingBottom }]}>
            {(() => {
              if (showForumLoading || !liveBroadcast || liveSession) return null;
              const isMyBroadcast = Boolean(user?._id && liveBroadcast.hostId && String(liveBroadcast.hostId) === String(user._id));
              const isDismissed = Boolean(dismissedLiveBannerKey && dismissedLiveBannerKey === liveBroadcastKey);
              if (!isMyBroadcast && isDismissed) return null;

              return (
                <View style={styles.liveJoinBanner}>
                  <View style={styles.liveJoinBannerInfo}>
                    <View style={styles.liveJoinDotWrap}>
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.liveJoinDotHalo,
                          {
                            opacity: livePulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] }),
                            transform: [{ scale: livePulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }]
                          }
                        ]}
                      />
                      <View style={styles.liveJoinDot} />
                    </View>
                    <Text style={styles.liveJoinBannerText} numberOfLines={1}>
                      {isMyBroadcast ? 'You are currently live' : `${liveBroadcast.hostName} is live`}
                    </Text>
                  </View>
                  <View style={styles.liveJoinBannerActions}>
                    <TouchableOpacity
                      style={styles.liveJoinBannerAction}
                      onPress={handleGoLivePress}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={isMyBroadcast ? 'Resume your live broadcast' : `Join live with ${liveBroadcast.hostName}`}
                    >
                      <Text style={styles.liveJoinBannerActionText}>
                        {isMyBroadcast ? 'Resume' : 'Join'}
                      </Text>
                    </TouchableOpacity>
                    {!isMyBroadcast && (
                      <TouchableOpacity
                        style={styles.liveJoinBannerDismiss}
                        onPress={() => setDismissedLiveBannerKey(liveBroadcastKey)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss live notification"
                      >
                        <Text style={styles.liveJoinBannerDismissText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })()}
            <View style={styles.inputComposerRow}>
            <View style={styles.inputPill}>




              <TouchableOpacity
                ref={smileButtonRef}
                {...({ 'data-sticker-toggle': 'true' } as any)}
                style={styles.pillIconBtn}
                onPress={() => {
                  dismissMentionSuggestions();
                  setShowStickerPicker((visible) => !visible);
                }}
                activeOpacity={0.7}
              >
                <SmileIcon color={showStickerPicker ? '#15803d' : '#8696a0'} size={21} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { height: inputHeight }]}
                multiline
                {...(Platform.OS !== 'web' ? { submitBehavior: 'submit' as const } : {})}
                scrollEnabled={inputHeight >= 60}
                textAlignVertical={inputHeight > 40 ? 'top' : 'center'}
                onContentSizeChange={(event) => {
                  if (!inputText) {
                    setInputHeight(40);
                    return;
                  }
                  const contentHeight = event.nativeEvent.contentSize.height;
                  setInputHeight(Math.max(40, Math.min(60, contentHeight + 8)));
                }}
                placeholder="@bot or @ai to mention"
                placeholderTextColor="#8696a0"
                value={inputText}
                onChangeText={(text) => {
                  handleInputChange(text);
                  if (!text) setInputHeight(40);
                }}
                onFocus={() => {
                  if (showStickerPicker) setShowStickerPicker(false);
                }}
                returnKeyType="send"
                onSubmitEditing={() => handleSendMessage()}
                onKeyPress={(e: any) => {
                  if (Platform.OS === 'web' && e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                {...({
                  onPaste: (e: any) => {
                    try {
                      const clipboardData = e.clipboardData || (typeof window !== 'undefined' && (window as any).clipboardData);
                      if (clipboardData?.items) {
                        for (const item of clipboardData.items) {
                          if (item.type?.startsWith('image/')) {
                            e.preventDefault?.();
                            const file = item.getAsFile();
                            if (file) {
                              const blobUrl = URL.createObjectURL(file);
                              const isGif = item.type.includes('gif');
                              const uploadItem = {
                                uri: blobUrl,
                                name: file.name || `pasted_media_${Date.now()}.${isGif ? 'gif' : 'png'}`,
                                mimeType: item.type,
                                kind: 'image' as const,
                                rawFile: file
                              };
                              setPendingUploadItem(uploadItem);
                              setSelectedFile({
                                name: uploadItem.name,
                                url: blobUrl,
                                size: `${Math.round(file.size / 1024)} KB`,
                                type: 'image'
                              });
                              void executeUpload(uploadItem);
                              return;
                            }
                          }
                        }
                      }
                    } catch {}
                  }
                } as any)}
              />

              <TouchableOpacity
                style={styles.pillIconBtn}
                onPress={() => {
                  dismissMentionSuggestions();
                  setShowFileModal(true);
                }}
                activeOpacity={0.7}
              >
                <PaperclipIcon color="#8696a0" size={22} />
              </TouchableOpacity>


            </View>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                ((!inputText.trim() && !selectedFile) || uploadFailed || isUploadingMedia || sendPendingAfterUpload) && styles.sendBtnDisabled
              ]}
              onPress={() => handleSendMessage()}
              disabled={(!inputText.trim() && !selectedFile) || uploadFailed || isUploadingMedia || sendPendingAfterUpload}
              activeOpacity={0.8}
            >
              {sendButtonBusy
                ? <ActivityIndicator color="#ffffff" size="small" />
                : <SendIcon color="#ffffff" size={19} style={{ marginLeft: 2 }} />}
            </TouchableOpacity>
            </View>
          </View> : (
            <View onLayout={() => setHasComposerLayout(true)} style={[styles.chatDisabledNotice, { marginBottom: !isKeyboardVisible && Platform.OS === 'android' && insets.bottom > 0 ? insets.bottom + 10 : 10 }]}>
              <Text style={styles.chatDisabledNoticeText}>{allowCommunityChat ? 'You are not eligible for forum participation' : 'Community chat disabled by administrator'}</Text>
            </View>
          )}
        </ImageBackground>

        {showForumLoading && (
          <View
            style={[styles.forumLoadingOverlay, forumHeaderHeight > 0 && { top: forumHeaderHeight }]}
            pointerEvents="auto"
          >
            <View style={styles.forumLoadingCard}>
              <ActivityIndicator color="#15803d" size="small" />
              <Text style={styles.forumLoadingText}>
                Logging you into Forum…
              </Text>
            </View>
          </View>
        )}

        {/* Signed-out visitors can browse, but are prompted to unlock forum actions. */}
        <Modal
          visible={showGuestSignInPrompt && isForumFocused && !authLoading && !user}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.guestPromptOverlay}>
            <View style={styles.guestPromptCard}>
              <View style={styles.guestPromptIcon}>
                <UsersIcon color="#15803d" size={26} />
              </View>
              <Text style={styles.guestPromptTitle}>Join Uni Forum</Text>
              <Text style={styles.guestPromptText}>
                Sign in to send messages, reply, mention students, share materials, and use all forum features.
              </Text>
              <TouchableOpacity
                style={styles.guestPromptSignInBtn}
                onPress={() => {
                  setShowGuestSignInPrompt(false);
                  router.push('/(auth)/login');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.guestPromptSignInText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
                  <View style={styles.profileModalNameRow}>
                    <Text style={styles.profileModalName}>{selectedProfile.senderName}</Text>
                    <UserBadge badge={selectedProfile.senderBadge} size={18} />
                  </View>
                  <Text style={styles.profileModalRole}>{isCampusAssistantMessage(selectedProfile) ? 'AI Assistant' : 'MConnect community member'}</Text>
                  <View style={styles.profileInfoList}>
                    <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Academic</Text><Text style={styles.profileInfoValue}>{getCommunitySenderSubtitle(selectedProfile, user, myProfile)}</Text></View>
                    <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Course</Text><Text style={styles.profileInfoValue}>{selectedProfile.senderCourse && selectedProfile.senderCourse.toLowerCase() !== 'unset' ? selectedProfile.senderCourse : (isCampusAssistantMessage(selectedProfile) ? 'AI assistant' : 'Not provided')}</Text></View>
                    <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Year</Text><Text style={styles.profileInfoValue}>{selectedProfile.senderYear && selectedProfile.senderYear.toLowerCase() !== 'unset' ? selectedProfile.senderYear : (isCampusAssistantMessage(selectedProfile) ? 'AI assistant' : 'Not provided')}</Text></View>
                    <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Phone</Text><Text style={styles.profileInfoValue}>{selectedProfile.senderPhone && selectedProfile.senderPhone.toLowerCase() !== 'unset' ? selectedProfile.senderPhone : (isCampusAssistantMessage(selectedProfile) ? 'AI assistant' : 'Not provided')}</Text></View>
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
            <Pressable style={[styles.modalCard, { paddingBottom: Platform.OS === 'android' && insets.bottom > 0 ? insets.bottom + 20 : 20 }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Campus File & Document</Text>
                <TouchableOpacity
                  onPress={() => setShowFileModal(false)}
                  style={styles.closeIconBtn}
                  disabled={isUploadingMedia}
                  activeOpacity={0.7}
                >
                  <CloseIcon color="#0f172a" size={16} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Select materials from your downloads or phone's storage:</Text>

              <View style={styles.mediaOptionsRow}>
                <TouchableOpacity style={[styles.mediaOption, isUploadingMedia && styles.mediaOptionDisabled]} disabled={isUploadingMedia} onPress={() => handlePickMedia('image')}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#eff6ff' }]}><ImageIcon color="#2563eb" size={21} /></View>
                  <Text style={styles.mediaOptionLabel}>Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.mediaOption, isUploadingMedia && styles.mediaOptionDisabled]} disabled={isUploadingMedia} onPress={() => handlePickMedia('video')}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#fff7ed' }]}><VideoIcon color="#f97316" size={21} /></View>
                  <Text style={styles.mediaOptionLabel}>Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.mediaOption, isUploadingMedia && styles.mediaOptionDisabled]} disabled={isUploadingMedia} onPress={handlePickFromPhone}>
                  <View style={[styles.mediaOptionIcon, { backgroundColor: '#f0fdf4' }]}><FileTextIcon color="#15803d" size={21} /></View>
                  <Text style={styles.mediaOptionLabel}>Document</Text>
                </TouchableOpacity>
              <TouchableOpacity style={[styles.mediaOption, isUploadingMedia && styles.mediaOptionDisabled]} disabled={isUploadingMedia} onPress={handleTakeMedia}>
                <View style={[styles.mediaOptionIcon, { backgroundColor: '#fdf2f8' }]}><CameraIcon color="#db2777" size={21} /></View>
                <Text style={styles.mediaOptionLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mediaOption, isUploadingMedia && styles.mediaOptionDisabled]} disabled={isUploadingMedia} onPress={openPrivateMessageComposer}>
                <View style={[styles.mediaOptionIcon, { backgroundColor: '#f0fdf4' }]}><LockIcon color="#15803d" size={20} /></View>
                <Text style={[styles.mediaOptionLabel, styles.privateOptionLabel]}>Private Message</Text>
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
                      <Text style={styles.sampleFileName}>{file.title || file.name}</Text>
                      <Text style={styles.sampleFileMeta}>{file.size} • Ready to share</Text>
                    </View>
                    <Text style={styles.attachLabel}>+ Attach</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {isUploadingMedia && (
                <View style={styles.mediaUploadOverlay} pointerEvents="auto">
                  <View style={styles.mediaUploadCard}>
                    <ActivityIndicator size="large" color="#15803d" />
                    <Text style={styles.mediaUploadTitle}>Uploading media…</Text>
                    <Text style={styles.mediaUploadText}>Please wait while it is prepared for chat.</Text>
                  </View>
                </View>
              )}

              
            </Pressable>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showPrivateMessageModal} transparent animationType="fade" onRequestClose={() => setShowPrivateMessageModal(false)}>
          <KeyboardAvoidingView style={styles.privateMessageOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPrivateMessageModal(false)} />
            <View style={styles.privateMessageCard}>
              <View style={styles.privateMessageHeader}>
                <View style={styles.privateMessageTitleWrap}>
                  <View style={styles.privateMessageIcon}><LockIcon color="#15803d" size={17} /></View>
                  <View>
                    <Text style={styles.privateMessageTitle}>Private message</Text>
                    <Text style={styles.privateMessageSubtitle}>Only you and the recipient can read it</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeIconBtn} onPress={() => setShowPrivateMessageModal(false)} disabled={privateMessageSending}>
                  <CloseIcon color="#64748b" size={16} />
                </TouchableOpacity>
              </View>

              {privateRecipient ? (
                <View style={styles.privateSelectedRecipient}>
                  {privateRecipient.avatarUrl
                    ? <Image source={{ uri: privateRecipient.avatarUrl }} style={styles.privateRecipientAvatar} />
                    : <View style={styles.privateRecipientAvatarFallback}><Text style={styles.mentionAvatarFallbackText}>{privateRecipient.name[0]?.toUpperCase()}</Text></View>}
                  <View style={styles.mentionUserText}>
                    <Text style={styles.mentionUserName} numberOfLines={1}>{privateRecipient.name}</Text>
                    <Text style={styles.mentionUserSubtitle}>Message recipient</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.privateChangeRecipient}
                    onPress={() => { setPrivateRecipient(null); setPrivateSearchQuery(''); setPrivateMessageText(''); }}
                    disabled={privateMessageSending}
                  >
                    <Text style={styles.privateChangeRecipientText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.privateFieldLabel}>To</Text>
                  <View style={styles.privateSearchBox}>
                    <TextInput
                      value={privateSearchQuery}
                      onChangeText={setPrivateSearchQuery}
                      placeholder="Search a student's name"
                      placeholderTextColor="#94a3b8"
                      style={styles.privateSearchInput}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                    {privateSuggestionsLoading && <ActivityIndicator size="small" color="#15803d" />}
                  </View>
                  {privateSearchQuery.trim().length > 0 && (
                    <ScrollView style={styles.privateSuggestionList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                      {privateSuggestions.map((entry) => (
                        <TouchableOpacity
                          key={entry.id}
                          style={styles.mentionRow}
                          onPress={() => { setPrivateRecipient(entry); setPrivateSearchQuery(''); setPrivateSuggestions([]); }}
                          activeOpacity={0.75}
                        >
                          {entry.avatarUrl
                            ? <Image source={{ uri: entry.avatarUrl }} style={styles.mentionAvatar} />
                            : <View style={styles.mentionAvatarFallback}><Text style={styles.mentionAvatarFallbackText}>{entry.name[0]?.toUpperCase()}</Text></View>}
                          <View style={styles.mentionUserText}>
                            <Text style={styles.mentionUserName} numberOfLines={1}>{entry.name}</Text>
                            <Text style={styles.mentionUserSubtitle}>MConnect user</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                      {!privateSuggestionsLoading && privateSuggestions.length === 0 && (
                        <Text style={styles.privateNoResults}>No students found</Text>
                      )}
                    </ScrollView>
                  )}
                </>
              )}

              <Text style={styles.privateFieldLabel}>Message</Text>
              <TextInput
                value={privateMessageText}
                onChangeText={setPrivateMessageText}
                placeholder={privateRecipient ? `Write to ${privateRecipient.name}…` : 'Choose a recipient first'}
                placeholderTextColor="#94a3b8"
                style={[styles.privateMessageInput, !privateRecipient && styles.privateMessageInputDisabled]}
                multiline
                maxLength={2000}
                editable={!!privateRecipient && !privateMessageSending}
                textAlignVertical="top"
              />
              <View style={styles.privateMessageFooter}>
                <Text style={styles.privateCharacterCount}>{privateMessageText.length}/2000</Text>
                <TouchableOpacity
                  style={[styles.privateSendButton, (!privateRecipient || !privateMessageText.trim() || privateMessageSending) && styles.privateSendButtonDisabled]}
                  onPress={sendPrivateCommunityMessage}
                  disabled={!privateRecipient || !privateMessageText.trim() || privateMessageSending}
                  activeOpacity={0.8}
                >
                  {privateMessageSending ? <ActivityIndicator size="small" color="#ffffff" /> : <SendIcon color="#ffffff" size={16} />}
                  <Text style={styles.privateSendButtonText}>{privateMessageSending ? 'Sending…' : 'Send privately'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={!!mediaPreview}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setMediaPreview(null)}
        >
          <View style={styles.videoPlayerScreen}>
            <View style={styles.videoPlayerHeader}>
              <Text style={styles.videoPlayerTitle}>{mediaPreview?.type === 'video' ? 'Video' : 'Image'}</Text>
              {(() => {
                const previewKey = mediaPreview ? (mediaPreview.paperId || mediaPreview.url) : '';
                const previewDl = previewKey ? activeMediaDownloads[previewKey] : undefined;
                const isDownloading = previewDl?.status === 'downloading';

                if (isDownloading) {
                  return (
                    <View style={styles.videoPlayerDownloadPill}>
                      <ActivityIndicator color="#22c55e" size="small" />
                      <Text style={styles.videoPlayerDownloadPillText}>
                        {previewDl.progress}%
                      </Text>
                      <TouchableOpacity
                        style={styles.videoPlayerDownloadCancelBtn}
                        onPress={() => previewKey && handleCancelFileDownload(previewKey)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Cancel download"
                      >
                        <Text style={styles.videoPlayerDownloadCancelText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                return (
                  <TouchableOpacity
                    style={styles.videoPlayerDownload}
                    onPress={() => mediaPreview && handleDownloadFileAttachment(mediaPreview)}
                    accessibilityRole="button"
                    accessibilityLabel="Download media"
                  >
                    <DownloadIcon color="#ffffff" size={17} />
                  </TouchableOpacity>
                );
              })()}
              <TouchableOpacity
                style={styles.videoPlayerClose}
                onPress={() => setMediaPreview(null)}
                accessibilityRole="button"
                accessibilityLabel="Close media preview"
              >
                <CloseIcon color="#ffffff" size={18} />
              </TouchableOpacity>
            </View>
            {mediaPreview && (mediaPreview.type === 'video' || isVideoAttachment(mediaPreview)) ? (
              <WebView
                source={{ html: getVideoPlayerHtml(mediaPreview.url) }}
                style={styles.videoPlayerWebView}
                originWhitelist={['*']}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo
              />
            ) : mediaPreview ? (
              <Image source={getLocalGifSource(mediaPreview.url) || { uri: mediaPreview.url }} style={styles.fullScreenImagePreview} resizeMode="contain" />
            ) : null}
            {(() => {
              const previewKey = mediaPreview ? (mediaPreview.paperId || mediaPreview.url) : '';
              const previewDl = previewKey ? activeMediaDownloads[previewKey] : undefined;
              if (previewDl?.status !== 'downloading') return null;

              return (
                <View style={styles.mediaDownloadProgressCard}>
                  <View style={styles.mediaDownloadProgressRow}>
                    <ActivityIndicator color="#22c55e" size="small" />
                    <View style={styles.mediaDownloadProgressTextCol}>
                      <View style={styles.mediaDownloadProgressHeaderRow}>
                        <Text style={styles.mediaDownloadProgressTitle}>Downloading in background</Text>
                        <Text style={styles.mediaDownloadProgressPercent}>{previewDl.progress}%</Text>
                      </View>
                      <View style={styles.mediaDownloadProgressBarBg}>
                        <View style={[styles.mediaDownloadProgressBarFill, { width: `${previewDl.progress}%` }]} />
                      </View>
                      <Text style={styles.mediaDownloadProgressBytes}>{previewDl.bytesText || 'Connecting…'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.mediaDownloadCardCancelBtn}
                      onPress={() => previewKey && handleCancelFileDownload(previewKey)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Cancel download"
                    >
                      <Text style={styles.mediaDownloadCardCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}
          </View>
        </Modal>
      <PDFViewerModal
        visible={showPreviewModal}
        document={previewDoc}
        onClose={() => setShowPreviewModal(false)}
        onDownload={(doc) => handleDownloadFileAttachment({
          name: doc.title,
          url: doc.fileUrl,
          size: '1.8 MB',
          type: 'pdf',
          paperId: doc.id,
          title: doc.title,
          unitCode: doc.unitCode,
          unitName: doc.unitName,
          school: doc.school,
          author: doc.author
        })}
      />

      {/* 1. Message Options Bottom Sheet Modal */}
      <Modal
        visible={Boolean(selectedMsgForOptions)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMsgForOptions(null)}
      >
        <Pressable style={styles.optionsSheetOverlay} onPress={() => setSelectedMsgForOptions(null)}>
          <Pressable style={[styles.optionsSheetContainer, { paddingBottom: Platform.OS === 'android' && insets.bottom > 0 ? insets.bottom + 20 : 28 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            {selectedMsgForOptions && (
              <View style={styles.optionsMsgPreviewBox}>
                <Text style={styles.optionsPreviewSender}>{selectedMsgForOptions.senderName}</Text>
                <Text style={styles.optionsPreviewText} numberOfLines={2}>
                  {selectedMsgForOptions.text || (selectedMsgForOptions.fileAttachment ? `📎 ${selectedMsgForOptions.fileAttachment.name}` : 'Media content')}
                </Text>
              </View>
            )}

            {/* Quick Reactions Bar */}
            <View style={styles.optionsReactionRow}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.optionsEmojiBtn,
                    selectedMsgForOptions?.myReaction === emoji && styles.optionsEmojiBtnActive
                  ]}
                  onPress={() => {
                    if (selectedMsgForOptions) {
                      handleToggleReaction(selectedMsgForOptions.id, emoji);
                      setSelectedMsgForOptions(null);
                    }
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions List */}
            <View style={styles.optionsList}>
              <TouchableOpacity
                style={styles.optionRowItem}
                onPress={() => {
                  if (selectedMsgForOptions) setReplyingTo(selectedMsgForOptions);
                  setSelectedMsgForOptions(null);
                }}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: '#dcfce7' }]}>
                  <ReplyIcon color="#15803d" size={18} />
                </View>
                <Text style={styles.optionRowText}>Reply to Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRowItem}
                onPress={() => selectedMsgForOptions && handleCopyMessageText(selectedMsgForOptions)}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                </View>
                <Text style={styles.optionRowText}>Copy Message Text</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRowItem}
                onPress={() => selectedMsgForOptions && handleDeleteForMe(selectedMsgForOptions)}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: '#fef3c7' }]}>
                  <TrashIcon color="#d97706" size={18} />
                </View>
                <Text style={styles.optionRowText}>Delete for Me</Text>
              </TouchableOpacity>

              {(selectedMsgForOptions?.isMe || (user as any)?.role === 'admin' || user?.roles?.includes?.('admin')) && (
                <TouchableOpacity
                  style={styles.optionRowItem}
                  onPress={() => selectedMsgForOptions && handleDeleteForEveryone(selectedMsgForOptions)}
                >
                  <View style={[styles.optionIconCircle, { backgroundColor: '#fee2e2' }]}>
                    <TrashIcon color="#ef4444" size={18} />
                  </View>
                  <Text style={[styles.optionRowText, { color: '#ef4444' }]}>Delete for Everyone</Text>
                </TouchableOpacity>
              )}

              {!selectedMsgForOptions?.isMe && (
                <TouchableOpacity
                  style={styles.optionRowItem}
                  onPress={() => selectedMsgForOptions && handleOpenReportModal(selectedMsgForOptions)}
                >
                  <View style={[styles.optionIconCircle, { backgroundColor: '#ffe4e6' }]}>
                    <Text style={{ fontSize: 16 }}>🚩</Text>
                  </View>
                  <Text style={[styles.optionRowText, { color: '#e11d48' }]}>Report Message</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.optionsCancelBtn}
              onPress={() => setSelectedMsgForOptions(null)}
            >
              <Text style={styles.optionsCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2. Report Message Modal */}
      <Modal
        visible={Boolean(selectedMsgForReport)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMsgForReport(null)}
      >
        <Pressable style={styles.optionsSheetOverlay} onPress={() => setSelectedMsgForReport(null)}>
          <Pressable style={styles.reportCardContainer} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.reportTitle}>🚩 Report Inappropriate Content</Text>
            <Text style={styles.reportSubtitle}>Select the reason for reporting this message. Admin team will review and take action.</Text>

            {[
              { id: 'inappropriate_content', label: 'Inappropriate or Offensive Content' },
              { id: 'spam', label: 'Spam or Unwanted Advertising' },
              { id: 'harassment', label: 'Harassment or Bullying' },
              { id: 'misleading_information', label: 'False or Misleading Information' },
              { id: 'other', label: 'Other Reason' }
            ].map((reasonItem) => (
              <TouchableOpacity
                key={reasonItem.id}
                style={[
                  styles.reportReasonRow,
                  reportReason === reasonItem.id && styles.reportReasonRowSelected
                ]}
                onPress={() => setReportReason(reasonItem.id)}
              >
                <View style={[styles.radioCircle, reportReason === reasonItem.id && styles.radioCircleSelected]}>
                  {reportReason === reasonItem.id && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.reportReasonText}>{reasonItem.label}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.reportDetailsInput}
              placeholder="Provide optional additional details for the admin..."
              placeholderTextColor="#94a3b8"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
            />

            <View style={styles.reportBtnRow}>
              <TouchableOpacity
                style={styles.reportCancelBtn}
                onPress={() => setSelectedMsgForReport(null)}
              >
                <Text style={styles.reportCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reportSubmitBtn, isSubmittingReport && { opacity: 0.6 }]}
                onPress={handleSubmitReport}
                disabled={isSubmittingReport}
              >
                <Text style={styles.reportSubmitBtnText}>
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={Boolean(liveSession)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeLiveRoom}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        {liveSession && (
          <View style={styles.liveModalContent}>
            {!liveEnded && (
              <CommunityLiveRoom
                serverUrl={liveSession.serverUrl}
                token={liveSession.token}
                isHost={liveSession.isHost}
                isNetworkOnline={networkOnline}
                currentUserAvatar={user?.avatarUrl}
                currentUserName={user?.name}
                onReady={handleLiveRoomReady}
                onClose={closeLiveRoom}
              />
            )}
            {liveEnded && (
              <View style={styles.liveEndedOverlay}>
                <View style={styles.liveEndedCard}>
                  <View style={styles.liveEndedDot} />
                  <Text style={styles.liveEndedTitle}>Live ended</Text>
                  <Text style={styles.liveEndedMessage}>The host has ended this live session.</Text>
                  <TouchableOpacity style={styles.liveEndedExit} onPress={closeLiveRoom} activeOpacity={0.85} accessibilityRole="button">
                    <Text style={styles.liveEndedExitText}>Exit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
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
  chatDisabledNotice: {
    marginHorizontal: 12,
    marginBottom: 10,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  chatDisabledNoticeText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: '#e2e8f0'
  },
  forumLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    top: 56,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    elevation: 99999
  },
  forumLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  forumLoadingText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '800'
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
  connectingHeaderSubtitle: {
    fontSize: 12,
    color: '#fef08a',
    fontWeight: '700'
  },
  offlineHeaderSubtitle: {
    fontSize: 12,
    color: '#fecaca',
    fontWeight: '700'
  },
  activeOnlineDot: {
    backgroundColor: '#22c55e',
    borderColor: '#15803d'
  },
  connectingDot: {
    backgroundColor: '#facc15',
    borderColor: '#854d0e'
  },
  offlineDot: {
    backgroundColor: '#94a3b8',
    borderColor: '#475569'
  },
  chatBackground: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    backgroundColor: '#efeae2'
  },
  chatWallpaperImage: {
    width: '100%',
    height: '100%',
    opacity: 0.92
  },
  messageList: {
    padding: 12,
    paddingBottom: 20
  },
  olderMessagesLoader: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.86)'
  },
  olderMessagesLoaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
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
  expandableMessage: { flexShrink: 1 },
  readMoreText: { marginTop: 4, color: '#15803d', fontSize: 12, fontWeight: '800' },
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
  privateMessageLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3
  },
  privateMessageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  myPrivateMessageLabel: {
    color: '#15803d'
  },
  otherPrivateMessageLabel: {
    color: '#64748b'
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
    minWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(21, 128, 61, 0.2)'
  },
  mediaOnlyBubble: {
    padding: 3,
    paddingBottom: 4,
    paddingHorizontal: 3,
    borderRadius: 16,
  },
  stickerOnlyBubble: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    marginVertical: 4,
  },
  stickerMetaRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: -22,
    marginRight: 4,
    alignSelf: 'flex-end',
  },
  stickerTimestamp: {
    color: '#ffffff',
    fontSize: 10,
  },
  mediaAttachmentWrapper: {
    borderRadius: 13,
    overflow: 'hidden',
  },
  docAttachmentWrapper: {
    marginBottom: 4,
  },
  chatMediaPreview: {
    width: 280,
    maxWidth: '100%',
    height: 230,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
    alignSelf: 'stretch',
  },
  chatMediaImage: {
    width: '100%',
    height: '100%'
  },
  chatVideoOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.22)'
  },
  chatVideoPlay: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 128, 61, 0.94)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  chatVideoPlayText: {
    color: '#ffffff',
    fontSize: 20,
    marginLeft: 3
  },
  chatVideoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8
  },
  chatVideoBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  mediaMetaRow: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingBottom: 2
  },
  chatMediaContainer: {
    position: 'relative'
  },
  chatMediaDownloadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    padding: 12,
  },
  chatMediaDownloadCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 2,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  chatMediaDownloadPercentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  chatMediaDownloadBytesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e2e8f0',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  chatMediaRetryCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  chatMediaRetryIcon: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  chatMediaRetryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  chatMediaRetrySubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fca5a5',
    marginTop: 2,
  },
  chatMediaDownloadCornerBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  videoPlayerScreen: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  },
  videoPlayerHeader: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  videoPlayerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  videoPlayerDownload: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    marginLeft: 'auto',
    marginRight: 8
  },
  videoPlayerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)'
  },
  fullScreenImagePreview: {
    flex: 1,
    width: '100%',
    backgroundColor: '#020617'
  },
  mediaDownloadProgress: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
    gap: 6
  },
  mediaDownloadProgressText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  videoPlayerDownloadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 128, 61, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    marginLeft: 'auto',
    marginRight: 8
  },
  videoPlayerDownloadPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  videoPlayerDownloadCancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginLeft: 2
  },
  videoPlayerDownloadCancelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  mediaDownloadProgressCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8
  },
  mediaDownloadProgressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  mediaDownloadProgressTextCol: {
    flex: 1,
    marginHorizontal: 10
  },
  mediaDownloadProgressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  mediaDownloadProgressTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700'
  },
  mediaDownloadProgressPercent: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '800'
  },
  mediaDownloadProgressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  mediaDownloadProgressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3
  },
  mediaDownloadProgressBytes: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3
  },
  mediaDownloadCardCancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  mediaDownloadCardCancelText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700'
  },
  floatingDownloadBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 44,
    left: 12,
    right: 12,
    zIndex: 9999,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 9
  },
  floatingDownloadIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  floatingDownloadInfo: {
    flex: 1,
    marginRight: 10
  },
  floatingDownloadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  floatingDownloadTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    marginRight: 6
  },
  floatingDownloadPercent: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '800'
  },
  floatingProgressBarBg: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden'
  },
  floatingProgressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2
  },
  floatingDownloadBytes: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3
  },
  floatingDownloadCancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8
  },
  floatingDownloadCancelText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '700'
  },
  chatMediaCancelSmallText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  videoPlayerWebView: {
    flex: 1,
    backgroundColor: '#020617'
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
    flex: 1,
    minWidth: 0
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
    bottom: 26,
    zIndex: 999999,
    elevation: 99999,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 2,
    paddingVertical: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0
  },
  reactionBadgeActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent'
  },
  reactionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  reactionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
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
  filePreviewBannerError: {
    borderTopColor: '#fecaca',
    backgroundColor: '#fff5f5'
  },
  filePreviewLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  composerThumbnailWrapper: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 8,
    overflow: 'hidden'
  },
  composerMediaThumbnail: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#e2e8f0'
  },
  composerVideoThumbnail: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a'
  },
  composerMediaLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerRetryOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerRetryOverlayIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff'
  },
  composerRetryBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  composerRetryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626'
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
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    paddingBottom: 10
  },
  pickerTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8
  },
  pickerTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9'
  },
  pickerTabBtnActive: {
    backgroundColor: '#15803d'
  },
  pickerTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  pickerTabLabelActive: {
    color: '#ffffff'
  },
  gifPickerContainer: {
    width: '100%'
  },
  gifCategoryScroll: {
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 8
  },
  gifCategoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  gifCategoryPillActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7'
  },
  gifCategoryText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500'
  },
  gifCategoryTextActive: {
    color: '#0369a1',
    fontWeight: '700'
  },
  gifScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center'
  },
  gifCard: {
    width: 100,
    height: 75,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative'
  },
  gifCardImage: {
    width: '100%',
    height: '100%'
  },
  gifCardBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1
  },
  gifCardBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  gifCardTitle: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  gifShimmerContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  gifShimmerPulse: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#cbd5e1'
  },
  gifShimmerCenterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  gifShimmerCenterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },
  gifFallbackContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gifFallbackText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8'
  },
  stickerPickerScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8
  },
  stickerOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 66,
    paddingVertical: 2
  },
  stickerOptionImage: {
    width: 48,
    height: 48
  },
  stickerOptionLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4
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
    zIndex: 51,
    overflow: 'hidden'
  },
  mentionDismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
    backgroundColor: 'transparent'
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
    width: 144,
    height: 144,
    alignSelf: 'center',
    marginVertical: 2,
    resizeMode: 'contain'
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'stretch',
    zIndex: 52,
    elevation: 52,
    paddingHorizontal: 8,
    paddingVertical: 8,
    // Let the wallpaper continue behind the composer until the bottom bar.
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#e9edef'
  },
  inputComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 8,
    minHeight: 44,
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
    minHeight: 40,
    maxHeight: 60,
    lineHeight: 20,
    paddingVertical: 4,
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
  sendBtnUploading: {
    backgroundColor: '#16a34a',
    opacity: 0.95
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
  guestPromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  guestPromptCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 10
  },
  guestPromptIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  guestPromptTitle: {
    color: '#0f172a',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center'
  },
  guestPromptText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20
  },
  guestPromptSignInBtn: {
    width: '100%',
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center'
  },
  guestPromptSignInText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
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
  profileModalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
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
  mediaOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 16 },
  mediaOption: { alignItems: 'center', width: '19%' },
  mediaOptionDisabled: { opacity: 0.45 },
  mediaOptionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  mediaOptionLabel: { fontSize: 12, color: '#334155', fontWeight: '700' },
  privateOptionLabel: { fontSize: 10, textAlign: 'center' },
  privateMessageOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)'
  },
  privateMessageCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8
  },
  privateMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 14
  },
  privateMessageTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privateMessageIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  privateMessageTitle: { color: '#0f172a', fontSize: 15, fontWeight: '800' },
  privateMessageSubtitle: { color: '#64748b', fontSize: 10, marginTop: 2 },
  privateFieldLabel: { color: '#334155', fontSize: 11, fontWeight: '800', marginBottom: 6, marginTop: 2 },
  privateSearchBox: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#dbe4ea',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  privateSearchInput: { flex: 1, color: '#0f172a', fontSize: 13, paddingVertical: 9, outlineStyle: 'none' } as any,
  privateSuggestionList: { maxHeight: 170, borderWidth: 1, borderColor: '#eef2f5', borderRadius: 12, marginBottom: 10 },
  privateNoResults: { padding: 12, color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  privateSelectedRecipient: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    padding: 9,
    marginBottom: 12
  },
  privateRecipientAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e2e8f0' },
  privateRecipientAvatarFallback: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#15803d' },
  privateChangeRecipient: { paddingHorizontal: 8, paddingVertical: 6 },
  privateChangeRecipientText: { color: '#15803d', fontSize: 11, fontWeight: '800' },
  privateMessageInput: {
    minHeight: 105,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#dbe4ea',
    borderRadius: 12,
    padding: 12,
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 19
  },
  privateMessageInputDisabled: { backgroundColor: '#f8fafc' },
  privateMessageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  privateCharacterCount: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  privateSendButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#15803d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  privateSendButtonDisabled: { opacity: 0.45 },
  privateSendButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  mediaLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  mediaLoadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d'
  },
  mediaUploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    zIndex: 20
  },
  mediaUploadCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5
  },
  mediaUploadTitle: {
    marginTop: 10,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800'
  },
  mediaUploadText: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center'
  },
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
    marginVertical: 1.5,
    paddingHorizontal: 8
  },
  systemNoticePill: {
    maxWidth: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1
  },
  systemNoticeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  systemNoticeConnected: { backgroundColor: '#22c55e' },
  systemNoticeDisconnected: { backgroundColor: '#c4b5fd' },
  systemNoticeSecurity: { backgroundColor: '#f59e0b' },
  systemNoticeLiveStartDot: { backgroundColor: '#ef4444' },
  systemNoticeLiveEndDot: { backgroundColor: '#94a3b8' },
  systemNoticeLiveStartPill: {
    backgroundColor: '#fff7f7',
    borderColor: '#fca5a5'
  },
  systemNoticeLiveStartText: {
    color: '#b91c1c',
    fontWeight: '700'
  },
  systemNoticeLiveEndPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#cbd5e1'
  },
  systemNoticeJoinHint: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 3,
    textTransform: 'uppercase'
  },
  systemNoticeText: {
    flexShrink: 1,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '600',
    color: '#475569'
  },
  systemNoticeTime: {
    flexShrink: 0,
    fontSize: 8,
    fontWeight: '500',
    color: '#94a3b8'
  },  /* WhatsApp-style Live Typing Indicator Banner */
  typingIndicatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '92%',
    marginLeft: 10,
    marginVertical: 5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe5ee',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  typingIndicatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0'
  },
  typingIndicatorAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2
  },
  typingIndicatorAvatarOverlap: {
    marginLeft: -9,
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  typingIndicatorAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14
  },
  typingIndicatorAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b'
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
    flexShrink: 1,
    minWidth: 0,
    gap: 2
  },
  typingBotLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  /* Go Live Stream & Stage Styles */
  liveModalContent: {
    flex: 1,
    backgroundColor: '#071b16'
  },
  liveEndedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(2, 6, 23, 0.94)'
  },
  liveEndedCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151'
  },
  liveEndedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 14,
    backgroundColor: '#ef4444'
  },
  liveEndedTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800'
  },
  liveEndedMessage: {
    marginTop: 8,
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center'
  },
  liveEndedExit: {
    minWidth: 110,
    alignItems: 'center',
    marginTop: 22,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#dc2626'
  },
  liveEndedExitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  liveFullScreen: {
    flex: 1,
    backgroundColor: '#020617'
  },
  liveFullScreenStage: {
    flex: 1,
    margin: 0,
    padding: 16,
    borderRadius: 0,
    borderBottomWidth: 0
  },
  liveFullScreenVideoGrid: {
    flex: 1,
    justifyContent: 'center'
  },
  liveFullScreenHostVideo: {
    height: '62%',
    minHeight: 220
  },
  goLiveHeaderBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 8
  },
  liveJoinBanner: {
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 99
  },
  liveJoinBannerInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveJoinDotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  liveJoinDotHalo: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444' },
  liveJoinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' },
  liveJoinBannerText: { flexShrink: 1, color: '#0f172a', fontSize: 13, fontWeight: '700' },
  liveJoinBannerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveJoinBannerAction: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#dc2626',
    borderRadius: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2
  },
  liveJoinBannerActionText: { color: '#ffffff', fontSize: 12.5, fontWeight: '800' },
  liveJoinBannerDismiss: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#f1f5f9' },
  liveJoinBannerDismissText: { color: '#64748b', fontSize: 18, lineHeight: 20, fontWeight: '600' },
  goLiveHeaderBtnActive: {
    backgroundColor: '#dc2626',
    borderColor: '#fecaca'
  },
  livePulseHalo: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444'
  },
  goLiveHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  goLiveHeaderBtnTextActive: {
    color: '#ef4444'
  },
  liveNoticeRow: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  liveNoticeCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#fff7f7',
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  liveNoticeCopy: { flex: 1, minWidth: 0 },
  liveNoticeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveNoticeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' },
  liveNoticeTitle: { flexShrink: 1, color: '#7f1d1d', fontSize: 13, fontWeight: '800' },
  liveNoticeSubtitle: { marginTop: 2, marginLeft: 15, color: '#64748b', fontSize: 11 },
  liveNoticeJoin: { minWidth: 52, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#dc2626' },
  liveNoticeJoinText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  liveStageContainer: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  liveStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  liveBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  liveBackButtonText: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '300',
    marginTop: -3
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff'
  },
  liveBadgeDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444'
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  liveStageTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8
  },
  liveParticipantCountText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  liveVideoGrid: {
    gap: 8,
    alignItems: 'center'
  },
  hostVideoBox: {
    width: '100%',
    height: 150,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  videoAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  hostAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 6
  },
  cameraOffText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  activeVideoPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  hostAvatarImgBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3
  },
  hostAvatarImgFg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#22c55e'
  },
  videoWaveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  speakingWaveText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600'
  },
  hostNameOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  hostNameOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  guestsScrollView: {
    marginTop: 8,
    width: '100%'
  },
  guestsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4
  },
  guestSmallCard: {
    width: 80,
    height: 60,
    backgroundColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  guestAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  guestNameOverlay: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 4
  },
  guestNameText: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center'
  },
  liveControlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b'
  },
  liveControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155'
  },
  liveControlBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#ef4444'
  },
  liveControlBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  liveEndBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24
  },
  liveEndBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  liveExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#475569',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24
  },
  liveExitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  liveAudienceBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fecaca',
    elevation: 3,
    shadowColor: '#991b1b',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  liveAudienceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1
  },
  livePulseIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  livePulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444'
  },
  livePulseCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fee2e2'
  },
  liveAudienceCopy: {
    flex: 1,
    minWidth: 0
  },
  liveAudienceText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600'
  },
  liveAudienceHostName: {
    color: '#b91c1c',
    fontWeight: '800'
  },
  liveAudienceSubtext: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1
  },
  joinLiveBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18
  },
  joinLiveBannerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  optionsSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  optionsSheetContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '85%'
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 16
  },
  optionsMsgPreviewBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#15803d'
  },
  optionsPreviewSender: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 2
  },
  optionsPreviewText: {
    fontSize: 13,
    color: '#334155'
  },
  optionsReactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f1f5f9',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 18
  },
  optionsEmojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionsEmojiBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  optionsList: {
    gap: 6,
    marginBottom: 14
  },
  optionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff'
  },
  optionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionRowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  optionsCancelBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  optionsCancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748b'
  },
  reportCardContainer: {
    width: '92%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto'
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16
  },
  reportReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    backgroundColor: '#ffffff'
  },
  reportReasonRowSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fff1f2'
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleSelected: {
    borderColor: '#ef4444'
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444'
  },
  reportReasonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b'
  },
  reportDetailsInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 70,
    marginTop: 8,
    marginBottom: 16,
    textAlignVertical: 'top'
  },
  reportBtnRow: {
    flexDirection: 'row',
    gap: 12
  },
  reportCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  reportCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b'
  },
  reportSubmitBtn: {
    flex: 1.4,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  reportSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  }
});

