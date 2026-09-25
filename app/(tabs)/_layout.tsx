import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { HomeIcon, DownloadIcon, MessageIcon, ProfileIcon, CommunityIcon } from '../../src/components/Icons';
import { NotificationCenterModal } from '../../src/components/NotificationCenterModal';
import {
  subscribeToUnreadCountUpdates,
  getStoredCommunityMessages,
  saveLastReadCommunityMsgId
} from '../../src/services/offlineStorage';

function HomeHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.2,
          textShadowColor: 'rgba(0, 0, 0, 0.65)',
          textShadowOffset: { width: 0, height: 1.5 },
          textShadowRadius: 3,
        }}
      >
        <Text style={{ color: '#ffffff' }}>Moi</Text>
        <Text style={{ color: '#a7f3d0' }}>Connect</Text>
      </Text>
    </View>
  );
}

function DownloadsHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.2,
          textShadowColor: 'rgba(0, 0, 0, 0.65)',
          textShadowOffset: { width: 0, height: 1.5 },
          textShadowRadius: 3,
        }}
      >
        <Text style={{ color: '#ffffff' }}>Down</Text>
        <Text style={{ color: '#a7f3d0' }}>loads</Text>
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = subscribeToUnreadCountUpdates((count) => {
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#15803d' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        headerRight: () => (
          <View style={{ marginRight: 14 }}>
            <NotificationCenterModal />
          </View>
        ),
        tabBarActiveTintColor: '#15803d',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { display: 'none' }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => <HomeHeaderTitle />,
          tabBarIcon: ({ color }: { color: string }) => <HomeIcon color={color} size={22} />
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          href: null,
          headerTitle: 'Notes PDF',
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          headerTitle: () => <DownloadsHeaderTitle />,
          tabBarIcon: ({ color }: { color: string }) => <DownloadIcon color={color} size={22} />
        }}
      />
      <Tabs.Screen
        name="rentals"
        options={{
          href: null,
          headerTitle: 'Students Rentals',
        }}
      />
      <Tabs.Screen
        name="messages"
        listeners={{
          tabPress: () => {
            getStoredCommunityMessages().then((msgs) => {
              if (msgs && msgs.length > 0) {
                const latestId = msgs[msgs.length - 1].id || msgs[msgs.length - 1]._id;
                if (latestId) saveLastReadCommunityMsgId(latestId);
              }
            });
          }
        }}
        options={{
          title: 'Community',
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: '900',
            lineHeight: 15,
            marginTop: -2
          },
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <Image
              source={require('../../assets/splash-icon.png')}
              style={{
                width: 24,
                height: 24,
                opacity: focused ? 1 : 0.55
              }}
              resizeMode="contain"
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerTitle: 'Student Profile & Settings',
        }}
      />
    </Tabs>
  );
}
