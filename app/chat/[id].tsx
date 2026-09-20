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
  ActivityIndicator,
  Modal,
  Alert,
  PanResponder,
  Animated
} from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { getSocket } from '../../src/services/socket';
import {
  cacheMessages,
  getCachedMessages,
  enqueueOfflineMessage,
  saveDownloadedPaper,
  getDownloadedPapers
} from '../../src/services/offlineStorage';
import {
  SendIcon,
  PaperclipIcon,
  SmileIcon,
  FileTextIcon,
  DownloadIcon,
  CheckIcon,
  ReplyIcon
} from '../../src/components/Icons';

export interface FileAttachment {
  name: string;
  url: string;
  size: string;
  type: 'pdf' | 'doc' | 'image';
}

const EMOJI_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];

const SAMPLE_ATTACHMENTS: FileAttachment[] = [
  {
    name: 'COM_310_Past_Paper_2025.pdf',
    url: 'https://res.cloudinary.com/mconnect/docs/com310_2025.pdf',
    size: '1.5 MB',
    type: 'pdf'
  },
  {
    name: 'MConnect_Tenancy_Agreement.pdf',
    url: 'https://res.cloudinary.com/mconnect/docs/tenancy.pdf',
    size: '950 KB',
    type: 'pdf'
  }
];

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
          useNativeDriver: true
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: true
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



export default function ChatRoomScreen({ route }: any) {
  const conversationId = route?.params?.id;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<FileAttachment[]>(SAMPLE_ATTACHMENTS);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  const { user } = useAuth();
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
    const index = messages.findIndex((m) => (m._id || m.id) === msgId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  useEffect(() => {
    if (conversationId && user) {
      loadMessageHistory();
      setupSocketListeners();
    }
  }, [conversationId, user]);

  const loadMessageHistory = async () => {
    setLoading(true);
    const res = await apiRequest<{ data: any[] }>(`/conversations/${conversationId}/messages`);
    setLoading(false);
    if (res.success && res.data) {
      setMessages(res.data);
      cacheMessages(conversationId, res.data);
    } else {
      const cached = await getCachedMessages(conversationId);
      if (cached && cached.length > 0) {
        setMessages(cached);
      }
    }
  };

  const setupSocketListeners = async () => {
    try {
      const socket = await getSocket();
      socket.emit('join_conversation', conversationId);

      socket.on('receive_message', (newMessage: any) => {
        if (newMessage.conversationId === conversationId) {
          setMessages((prev) => {
            const exists = prev.some((m) => m._id === newMessage._id);
            if (exists) return prev;
            const updated = [...prev, newMessage];
            cacheMessages(conversationId, updated);
            return updated;
          });
        }
      });

      return () => {
        socket.off('receive_message');
      };
    } catch (e) {
      console.warn('Socket setup error', e);
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || !user || !conversationId) return;

    const messageText = text.trim();
    const fileToAttach = selectedFile;
    const replyToData = replyingTo
      ? {
          id: replyingTo._id || replyingTo.id,
          senderName:
            typeof replyingTo.senderId === 'object' && replyingTo.senderId?.name
              ? replyingTo.senderId.name
              : replyingTo.senderName || 'User',
          text: replyingTo.text,
          fileAttachment: replyingTo.fileAttachment
        }
      : undefined;

    setText('');
    setSelectedFile(null);
    setReplyingTo(null);
    setSending(true);

    try {
      const socket = await getSocket();
      socket.emit('send_message', {
        conversationId,
        text: messageText,
        fileAttachment: fileToAttach,
        replyTo: replyToData
      });

      const res = await apiRequest(`/conversations/messages`, {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          text: messageText,
          fileAttachment: fileToAttach,
          replyTo: replyToData
        })
      });

      if (res.success && res.data?.message) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === res.data.message._id);
          if (exists) return prev;
          const updated = [...prev, res.data.message];
          cacheMessages(conversationId, updated);
          return updated;
        });
      } else {
        const tempMsg: any = {
          _id: `temp_${Date.now()}`,
          conversationId,
          senderId: user._id,
          text: messageText,
          fileAttachment: fileToAttach,
          replyTo: replyToData,
          reactions: {},
          createdAt: new Date().toISOString()
        };
        await enqueueOfflineMessage({
          tempId: tempMsg._id,
          conversationId,
          text: messageText,
          senderId: user._id,
          createdAt: tempMsg.createdAt
        });
        setMessages((prev) => [...prev, tempMsg]);
      }
    } catch (err) {
      console.warn('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._id !== msgId) return msg;

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
  };

  const handleDownloadFileAttachment = async (file: FileAttachment) => {
    try {
      await saveDownloadedPaper({
        _id: `file_${Date.now()}`,
        title: file.name,
        school: 'MConnect Direct Chat',
        department: 'Chat Attachment',
        courseCode: 'SHARED',
        unitCode: 'DOC 101',
        unitName: file.name,
        type: file.type === 'pdf' ? 'past_paper' : 'lecture_notes',
        examYear: 2025,
        fileUrl: file.url,
        fileType: file.type === 'pdf' ? 'pdf' : 'other',
        uploadedBy: { _id: 'chat', name: 'Chat Member' } as any,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      Alert.alert('File Saved Offline', `"${file.name}" has been saved to your local Downloads tab!`);
    } catch (e) {
      Alert.alert('Download Error', 'Could not save file attachment locally.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#15803d" />
          <Text style={styles.loadingText}>Loading Messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const sender = typeof item.senderId === 'object' ? (item.senderId as any) : null;
            const isMe = (sender ? sender._id : item.senderId) === user?._id;
            const isPickerOpen = activeReactionMsgId === item._id;
            const hasReactions = item.reactions && Object.keys(item.reactions).length > 0;

            return (
              <SwipeableMessageItem onReply={() => setReplyingTo(item)}>
                <View style={[styles.bubbleWrapper, isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                  {/* Floating Emoji Picker Bar */}
                  {isPickerOpen && (
                    <View style={[styles.reactionPickerBar, isMe ? { right: 0 } : { left: 0 }]}>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          style={[
                            styles.emojiPickBtn,
                            item.myReaction === emoji && styles.emojiPickBtnActive
                          ]}
                          onPress={() => handleToggleReaction(item._id, emoji)}
                        >
                          <Text style={{ fontSize: 18 }}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={() => setActiveReactionMsgId(isPickerOpen ? null : item._id)}
                    onPress={() => {
                      if (isPickerOpen) setActiveReactionMsgId(null);
                    }}
                    style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}
                  >
                    {!isMe && sender && <Text style={styles.senderName}>{sender.name}</Text>}

                    {/* Engulfed Quoted Reply Box */}
                    {item.replyTo && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={[styles.engulfedQuoteBox, isMe ? styles.engulfedQuoteBoxMe : styles.engulfedQuoteBoxOther]}
                        onPress={() => scrollToMessage(item.replyTo.id || item.replyTo._id)}
                      >
                        <View style={[styles.engulfedAccentBar, isMe ? styles.engulfedAccentBarMe : styles.engulfedAccentBarOther]} />
                        <View style={styles.engulfedContent}>
                          <Text style={[styles.engulfedSender, isMe ? styles.engulfedSenderMe : styles.engulfedSenderOther]} numberOfLines={1}>
                            {item.replyTo.senderName || 'User'}
                          </Text>
                          <Text style={[styles.engulfedText, isMe ? styles.engulfedTextMe : styles.engulfedTextOther]} numberOfLines={2}>
                            {item.replyTo.text || (item.replyTo.fileAttachment ? `📎 ${item.replyTo.fileAttachment.name}` : 'Attachment')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* File Attachment */}
                    {item.fileAttachment && (
                      <View style={styles.fileCard}>
                        <View style={styles.fileIconBox}>
                          <FileTextIcon color="#15803d" size={22} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fileName} numberOfLines={1}>
                            {item.fileAttachment.name}
                          </Text>
                          <Text style={styles.fileMeta}>
                            {item.fileAttachment.size} • {item.fileAttachment.type.toUpperCase()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.fileDownloadBtn}
                          onPress={() => handleDownloadFileAttachment(item.fileAttachment)}
                        >
                          <DownloadIcon color="#ffffff" size={12} />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Text content with clean text wrapping */}
                    {!!item.text && (
                      <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                        {item.text}
                      </Text>
                    )}

                    <View style={styles.metaRow}>
                      <TouchableOpacity
                        style={{ padding: 2 }}
                        onPress={() => setActiveReactionMsgId(isPickerOpen ? null : item._id)}
                      >
                        <SmileIcon color={isMe ? '#dcfce7' : '#94a3b8'} size={12} />
                      </TouchableOpacity>

                      <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.otherTimeText]}>
                        {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>

                      {isMe && <CheckIcon color="#38bdf8" size={12} />}
                    </View>
                  </TouchableOpacity>

                  {/* Reaction Badges */}
                  {hasReactions && (
                    <View style={[styles.reactionBadgeContainer, isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                      {Object.entries(item.reactions!).map(([emoji, count]) => (
                        <TouchableOpacity
                          key={emoji}
                          style={[
                            styles.reactionBadge,
                            item.myReaction === emoji && styles.reactionBadgeActive
                          ]}
                          onPress={() => handleToggleReaction(item._id, emoji)}
                        >
                          <Text style={styles.reactionBadgeText}>{emoji} {count}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </SwipeableMessageItem>
            );
          }}
        />
      )}

      {/* Replying Preview Banner */}
      {replyingTo && (
        <View style={styles.replyPreviewBanner}>
          <View style={styles.replyPreviewAccentBar} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ReplyIcon color="#15803d" size={13} />
              <Text style={styles.replyPreviewTitle}>
                Replying to <Text style={styles.replyPreviewName}>
                  {typeof replyingTo.senderId === 'object' && replyingTo.senderId?.name
                    ? replyingTo.senderId.name
                    : replyingTo.senderName || 'User'}
                </Text>
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

      {/* Attached File Preview Bar */}
      {selectedFile && (
        <View style={styles.filePreviewBanner}>
          <FileTextIcon color="#15803d" size={20} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.filePreviewName} numberOfLines={1}>
              {selectedFile.name}
            </Text>
            <Text style={styles.filePreviewMeta}>{selectedFile.size} • File Ready to Send</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WhatsApp Style Input Bar */}
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
            placeholder="@bot to mention campus bot"
            placeholderTextColor="#8696a0"
            value={text}
            onChangeText={setText}
            style={styles.textInput}
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
          style={[styles.sendBtn, ((!text.trim() && !selectedFile) || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={(!text.trim() && !selectedFile) || sending}
          activeOpacity={0.8}
        >
          <SendIcon color="#ffffff" size={19} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      {/* File Modal */}
      <Modal visible={showFileModal} transparent animationType="slide" onRequestClose={() => setShowFileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Campus File & Document</Text>
              <TouchableOpacity onPress={() => setShowFileModal(false)}>
                <Text style={{ color: '#ef4444', fontWeight: '700' }}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              Select materials from your downloads or phone's storage:
            </Text>

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
                  <FileTextIcon color="#15803d" size={22} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.sampleFileName}>{file.name}</Text>
                    <Text style={styles.sampleFileMeta}>{file.size} • Ready to share</Text>
                  </View>
                  <Text style={{ color: '#15803d', fontWeight: '700', fontSize: 12 }}>+ Attach</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: '#f1f5f9',
                padding: 12,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 12,
                borderWidth: 1,
                borderColor: '#cbd5e1'
              }}
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
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803d' }}>
                📁 Pick Custom File from Phone Storage
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b'
  },
  messageList: {
    padding: 16
  },
  bubbleWrapper: {
    maxWidth: '85%',
    marginVertical: 4,
    position: 'relative'
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    flexShrink: 1
  },
  myBubble: {
    backgroundColor: '#15803d',
    borderBottomRightRadius: 4
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 4
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' ? { wordBreak: 'break-word' } : {})
  } as any,
  myMessageText: {
    color: '#ffffff'
  },
  otherMessageText: {
    color: '#0f172a'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6
  },
  timeText: {
    fontSize: 10
  },
  myTimeText: {
    color: '#dcfce7'
  },
  otherTimeText: {
    color: '#94a3b8'
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    gap: 8
  },
  fileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  fileMeta: {
    fontSize: 10,
    color: '#64748b'
  },
  fileDownloadBtn: {
    backgroundColor: '#15803d',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reactionPickerBar: {
    position: 'absolute',
    top: -40,
    zIndex: 99,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 4
  },
  emojiPickBtn: {
    padding: 4,
    borderRadius: 10
  },
  emojiPickBtnActive: {
    backgroundColor: '#fef08a'
  },
  reactionBadgeContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2
  },
  reactionBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  reactionBadgeActive: {
    backgroundColor: '#fef08a',
    borderColor: '#eab308'
  },
  reactionBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  filePreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
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
  textInput: {
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
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  sampleFileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sampleFileName: {
    fontSize: 13,
    fontWeight: '700'
  },
  sampleFileMeta: {
    fontSize: 11,
    color: '#64748b'
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
