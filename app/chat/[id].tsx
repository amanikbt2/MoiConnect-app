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
  ActivityIndicator
} from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { getSocket } from '../../src/services/socket';
import {
  cacheMessages,
  getCachedMessages,
  enqueueOfflineMessage
} from '../../src/services/offlineStorage';
import { SendIcon } from '../../src/components/Icons';

export default function ChatRoomScreen({ route }: any) {
  const conversationId = route?.params?.id;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (conversationId && user) {
      loadMessageHistory();
      setupSocketListeners();
    }
  }, [conversationId, user]);

  const loadMessageHistory = async () => {
    setLoading(true);
    const res = await apiRequest<{ data: IMessage[] }>(`/conversations/${conversationId}/messages`);
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

      // Join socket room securely
      socket.emit('join_conversation', conversationId);

      // Listen for incoming messages
      socket.on('receive_message', (newMessage: IMessage) => {
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
    if (!text.trim() || !user || !conversationId) return;

    const messageText = text.trim();
    setText('');
    setSending(true);

    try {
      const socket = await getSocket();
      // Emit via socket for instant delivery
      socket.emit('send_message', {
        conversationId,
        text: messageText
      });

      // REST request to guarantee persistence
      const res = await apiRequest(`/conversations/messages`, {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          text: messageText
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
        // Enqueue message offline
        const tempMsg: IMessage = {
          _id: `temp_${Date.now()}`,
          conversationId,
          senderId: user._id,
          text: messageText,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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

            return (
              <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                {!isMe && sender && (
                  <Text style={styles.senderName}>{sender.name}</Text>
                )}
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                  {item.text}
                </Text>
                <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.otherTimeText]}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type your message..."
          placeholderTextColor="#94a3b8"
          value={text}
          onChangeText={setText}
          style={styles.textInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <SendIcon color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>
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
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#15803d',
    borderBottomRightRadius: 4
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 2
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  myMessageText: {
    color: '#ffffff'
  },
  otherMessageText: {
    color: '#0f172a'
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  myTimeText: {
    color: '#dcfce7'
  },
  otherTimeText: {
    color: '#94a3b8'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    maxHeight: 100,
    outlineStyle: 'none',
  } as any,
  sendBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  }
});
