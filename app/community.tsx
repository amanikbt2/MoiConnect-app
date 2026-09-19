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
  SafeAreaView
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useAppNavigation } from '../src/utils/navigation';
import { SendIcon, UsersIcon, CheckIcon } from '../src/components/Icons';

interface CommunityMessage {
  id: string;
  senderName: string;
  senderFaculty: string;
  avatarBg: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  likes?: number;
}

const INITIAL_COMMUNITY_MESSAGES: CommunityMessage[] = [
  {
    id: '1',
    senderName: 'Mercy Chebet',
    senderFaculty: 'School of Information Sciences',
    avatarBg: '#3b82f6',
    text: 'Jambo everyone! 👋 Does anyone have the revised COM 310 CAT 1 timetable for this Friday?',
    timestamp: '09:42 AM',
    isMe: false,
    likes: 4
  },
  {
    id: '2',
    senderName: 'Brian Kipkurui',
    senderFaculty: 'Engineering Y4',
    avatarBg: '#10b981',
    text: 'Yes Mercy, it was shifted to 2:00 PM at Margaret Thatcher Library hall B. Check the past papers card for revision notes too!',
    timestamp: '09:45 AM',
    isMe: false,
    likes: 9
  },
  {
    id: '3',
    senderName: 'Amina Hassan',
    senderFaculty: 'School of Law',
    avatarBg: '#ec4899',
    text: 'Quick notice: The Annex Hostel bus departs main campus at 1:15 PM today 🚌',
    timestamp: '10:02 AM',
    isMe: false,
    likes: 15
  },
  {
    id: '4',
    senderName: 'David Omondi',
    senderFaculty: 'Computer Science Y3',
    avatarBg: '#8b5cf6',
    text: 'We are hosting a React Native & Node.js tech workshop at the Innovation Hub tomorrow 4PM. Everyone is welcome! 🚀⚡',
    timestamp: '10:15 AM',
    isMe: false,
    likes: 22
  }
];

export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useAppNavigation();
  const [messages, setMessages] = useState<CommunityMessage[]>(INITIAL_COMMUNITY_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: CommunityMessage = {
      id: Date.now().toString(),
      senderName: user ? user.name : 'Moi Student',
      senderFaculty: user?.department || 'Main Campus Student',
      avatarBg: '#15803d',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      likes: 0
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulated automated campus response
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
        likes: 1
      };

      setMessages((prev) => [...prev, botMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* WhatsApp Style Top Header Banner */}
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

        {/* WhatsApp-Style Chat Wallpaper Background */}
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
            renderItem={({ item }) => (
              <View style={[styles.messageBubbleWrapper, item.isMe ? styles.myWrapper : styles.otherWrapper]}>
                {!item.isMe && (
                  <View style={[styles.senderAvatar, { backgroundColor: item.avatarBg }]}>
                    <Text style={styles.avatarLetter}>{item.senderName[0]?.toUpperCase()}</Text>
                  </View>
                )}

                <View style={[styles.bubble, item.isMe ? styles.myBubble : styles.otherBubble]}>
                  {!item.isMe && (
                    <View style={styles.senderHeader}>
                      <Text style={[styles.senderName, { color: item.avatarBg }]}>{item.senderName}</Text>
                      <Text style={styles.senderFaculty}>{item.senderFaculty}</Text>
                    </View>
                  )}

                  <Text style={[styles.messageText, item.isMe ? styles.myText : styles.otherText]}>
                    {item.text}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={[styles.timestamp, item.isMe ? styles.myTimestamp : styles.otherTimestamp]}>
                      {item.timestamp}
                    </Text>
                    {item.isMe && (
                      <View style={styles.ticksWrapper}>
                        <CheckIcon color="#38bdf8" size={14} />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          />

          {/* WhatsApp Style Bottom Input Bar */}
          <View style={styles.inputContainer}>
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
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <SendIcon color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 12,
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
  bubble: {
    borderRadius: 14,
    padding: 10,
    paddingHorizontal: 14,
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
    marginBottom: 2
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
    marginTop: 2
  },
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
    gap: 4,
    marginTop: 4
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
  }
});
