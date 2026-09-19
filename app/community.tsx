import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
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
  TrashIcon
} from '../src/components/Icons';
import { saveDownloadedPaper } from '../src/services/offlineStorage';

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
}

const EMOJI_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];

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
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim() && !selectedFile) return;

    const sentText = inputText.trim();
    const isBotMentioned = sentText.toLowerCase().includes('@bot');

    const newMessage: CommunityMessage = {
      id: Date.now().toString(),
      senderName: user ? user.name : 'Moi Student',
      senderFaculty: user?.department || 'Main Campus Student',
      avatarBg: '#15803d',
      text: sentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      fileAttachment: selectedFile || undefined,
      reactions: {}
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setSelectedFile(null);

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
    } catch (e) {
      Alert.alert('Download Error', 'Could not save file attachment locally.');
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
              <UsersIcon color="#ffffff" size={20} />
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
              );
            }}
          />

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
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => setShowFileModal(true)}
              activeOpacity={0.7}
            >
              <PaperclipIcon color="#475569" size={22} />
            </TouchableOpacity>

            <View style={styles.textInputCard}>
              <TextInput
                style={styles.input}
                placeholder="Message campus community..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxHeight={100}
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
              <SendIcon color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* File Selection Modal */}
        <Modal visible={showFileModal} transparent animationType="slide" onRequestClose={() => setShowFileModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Campus File & Document</Text>
                <TouchableOpacity onPress={() => setShowFileModal(false)}>
                  <Text style={styles.closeBtn}>✕ Close</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Select revision material or file to attach in chat:</Text>

              {SAMPLE_ATTACHMENTS.map((file, idx) => (
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

              <TouchableOpacity
                style={styles.customFileBtn}
                onPress={() => {
                  setSelectedFile({
                    name: `Campus_Notes_${Date.now().toString().slice(-4)}.pdf`,
                    url: 'https://res.cloudinary.com/mconnect/docs/sample.pdf',
                    size: '1.2 MB',
                    type: 'pdf'
                  });
                  setShowFileModal(false);
                }}
              >
                <Text style={styles.customFileBtnText}>📁 Pick Custom File from Phone Storage</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#15803d'
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
    paddingVertical: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
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
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  attachBtn: {
    padding: 6
  },
  textInputCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  input: {
    fontSize: 14,
    color: '#0f172a',
    maxHeight: 100
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    backgroundColor: '#94a3b8'
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
  closeBtn: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14
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
    marginTop: 6,
    backgroundColor: '#15803d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  customFileBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});
