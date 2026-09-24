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
  saveCommunityMessages
} from '../src/services/offlineStorage';
import { setupNotificationResponseListener } from '../src/services/notificationService';

export interface FileAttachment {
  name: string;
  url: string;
  size: string;
  type: 'pdf' | 'doc' | 'image';
}

export interface CommunityMessage {
  id: string;
  senderName: string;
  senderFaculty: string;
  avatarBg: string;
  text: string;
  timestamp: string;
  isMe: boolean;
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

  const flatListRef = useRef<FlatList>(null);

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

  const scrollToMessage = (msgId: string) => {
    const index = messages.findIndex((m) => m.id === msgId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim() && !selectedFile) return;

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

    const newMessage: CommunityMessage = {
      id: Date.now().toString(),
      senderName: user ? user.name : 'Moi Student',
      senderFaculty: user?.department || 'Main Campus Student',
      avatarBg: '#15803d',
      text: sentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      fileAttachment: selectedFile || undefined,
      replyTo: replyToData,
      reactions: {}
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setSelectedFile(null);
    setReplyingTo(null);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

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
          isMe: false,
          reactions: { '🤖': 1, '❤️': 1 }
        };

        setMessages((prev) => [...prev, botMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 1000);
    } else {
      setTimeout(() => {
        const autoReplies = [
          'Awesome thoughts! 👏 Thanks for sharing with the campus community.',
          'Noted! Good luck to everyone studying for upcoming exams! 📚✨',
          'Great point! Let us catch up at Student Centre later today. 👍',
          'Thanks for updating us! 🎓🔥'
        ];
        const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];

        const botMessage: CommunityMessage = {
          id: (Date.now() + 1).toString(),
          senderName: 'Campus Bot 🤖',
          senderFaculty: 'Moi Uni Community',
          avatarBg: '#6366f1',
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          reactions: { '❤️': 1 }
        };

        setMessages((prev) => [...prev, botMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 2500);
    }
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;

        const currentReactions = { ...(msg.reactions || {}) };
        const myPrev = msg.myReaction;

        if (myPrev === emoji) {
          // Remove reaction
          currentReactions[emoji] = (currentReactions[emoji] || 1) - 1;
          if (currentReactions[emoji] <= 0) delete currentReactions[emoji];
          return { ...msg, reactions: currentReactions, myReaction: undefined };
        } else {
          // Change or add reaction
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
        const mime = asset.mimeType || '';
        let fileType: 'pdf' | 'doc' | 'image' = 'pdf';
        if (mime.includes('image')) {
          fileType = 'image';
        } else if (mime.includes('word') || asset.name.endsWith('.doc') || asset.name.endsWith('.docx')) {
          fileType = 'doc';
        }

        const formattedSize = asset.size
          ? asset.size > 1024 * 1024
            ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(asset.size / 1024)} KB`
          : '1.2 MB';

        setSelectedFile({
          name: asset.name,
          url: asset.uri,
          size: formattedSize,
          type: fileType
        });
        setShowFileModal(false);
      }
    } catch (err) {
      console.log('Document picker error:', err);
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
            ListHeaderComponent={
              <View style={styles.dateDivider}>
                <Text style={styles.dateDividerText}>TODAY • CAMPUS DISCUSSION</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isPickerOpen = activeReactionMsgId === item.id;
              const hasReactions = item.reactions && Object.keys(item.reactions).length > 0;

              return (
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
                        style={[styles.bubble, item.isMe ? styles.myBubble : styles.otherBubble]}
                      >
                        {!item.isMe && (
                          <View style={styles.senderHeader}>
                            <Text style={[styles.senderName, { color: item.avatarBg }]}>{item.senderName}</Text>
                            <Text style={styles.senderFaculty}>{item.senderFaculty}</Text>
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
                              <Text style={styles.reactionBadgeText}>{emoji} {count}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </SwipeableMessageItem>
              );
            }}
          />

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
                onChangeText={setInputText}
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
                style={styles.customFileBtn}
                onPress={handlePickFromPhone}
                activeOpacity={0.8}
              >
                <FolderIcon color="#ffffff" size={18} />
                <Text style={styles.customFileBtnText}>Pick from phone</Text>
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
  }
});
