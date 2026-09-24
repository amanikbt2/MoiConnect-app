import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { HomeIcon, DownloadIcon, MessageIcon, ProfileIcon } from '../../src/components/Icons';
import { NotificationCenterModal } from '../../src/components/NotificationCenterModal';

function HomeHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image
        source={require('../../assets/mc-logo-transparent.png')}
        style={{ width: 28, height: 28, borderRadius: 6, marginRight: 6 }}
        resizeMode="contain"
      />
      <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: 0.4 }}>
        Connect
      </Text>
    </View>
  );
}

function DownloadsHeaderTitle() {
  return (
    <View style={{ justifyContent: 'center' }}>
      <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', lineHeight: 22 }}>
        Downloads
      </Text>
      <Text style={{ color: '#dcfce7', fontSize: 11, fontWeight: '500', marginTop: 1 }}>
        Offline downloaded materials
      </Text>
    </View>
  );
}

export default function TabLayout() {
  // Initialize with fake 3 unread messages badge
  const [unreadCount, setUnreadCount] = useState<number>(3);

  // Smart simulation: If cleared and user stays away from Community tab, simulate new incoming community message badge
  useEffect(() => {
    const timer = setInterval(() => {
      setUnreadCount((prev) => (prev === 0 ? 3 : prev));
    }, 30000);
    return () => clearInterval(timer);
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
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 }
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
            // Clear unread badge when user opens Community tab
            setUnreadCount(0);
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
              source={require('../../assets/mc-logo.png')}
              style={{
                width: 26,
                height: 26,
                opacity: focused ? 1 : 0.5,
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
