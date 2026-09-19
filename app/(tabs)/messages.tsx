import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useAppNavigation } from '../../src/utils/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { apiRequest } from '../../src/services/api';
import { cacheConversations, getCachedConversations } from '../../src/services/offlineStorage';
import { IConversation } from '@moi/shared';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';

import { HouseIcon } from '../../src/components/Icons';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const router = useAppNavigation();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    setLoading(true);
    const res = await apiRequest<{ data: IConversation[] }>('/conversations');
    setLoading(false);
    setRefreshing(false);
    if (res.success && res.data) {
      setConversations(res.data);
      cacheConversations(res.data);
    } else {
      const cached = await getCachedConversations();
      if (cached && cached.length > 0) {
        setConversations(cached);
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.authRequiredContainer}>
        <EmptyState
          title="Authentication Required"
          message="Please sign in to view your conversations and communicate with landlords."
        />
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.signInBtnText}>Sign In Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getOtherParticipant = (participants: any[]) => {
    return participants.find((p) => p._id !== user._id) || participants[0];
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConversations(); }} colors={['#15803d']} />
        }
        renderItem={({ item }) => {
          const other = getOtherParticipant(item.participants);
          return (
            <TouchableOpacity
              style={styles.convCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/chat/${item._id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{other?.name?.[0]?.toUpperCase() || 'U'}</Text>
              </View>

              <View style={styles.convBody}>
                <View style={styles.convHeader}>
                  <Text style={styles.convName}>{other?.name || 'User'}</Text>
                  <Text style={styles.convDate}>
                    {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>

                {item.houseId && typeof item.houseId === 'object' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <HouseIcon color="#15803d" size={14} />
                    <Text style={styles.houseTag} numberOfLines={1}>
                      {(item.houseId as any).title}
                    </Text>
                  </View>
                )}

                <Text style={styles.lastMsg} numberOfLines={1}>
                  {item.lastMessage ? (item.lastMessage as any).text : 'No messages yet...'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 10 }}>
              <Skeleton height={74} />
              <Skeleton height={74} />
              <Skeleton height={74} />
            </View>
          ) : (
            <EmptyState
              title="No Conversations"
              message="You have no active messages. Visit a house listing and tap 'Contact Landlord' to start chatting!"
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  listContent: {
    padding: 16
  },
  authRequiredContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  signInBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16
  },
  signInBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  convBody: {
    flex: 1
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  convName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  convDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500'
  },
  houseTag: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
    marginBottom: 2
  },
  lastMsg: {
    fontSize: 13,
    color: '#64748b'
  }
});
