import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { HomeIcon, DownloadIcon, MessageIcon, ProfileIcon } from '../../src/components/Icons';
import { NotificationCenterModal } from '../../src/components/NotificationCenterModal';

function HomeHeaderTitle() {
  return (
    <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: 0.4 }}>
      MConnect
    </Text>
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

function formatUnreadBadge(count: number): string {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return `${count}`;
}

export default function TabLayout() {
  // Generate random fake unread message count (e.g. 105 -> 99+, or 45) when app opens
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    const fakeCounts = [24, 45, 88, 105, 112, 142, 99, 108];
    return fakeCounts[Math.floor(Math.random() * fakeCounts.length)];
  });

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
          headerTitle: 'Student Rental Marketplace',
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
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={{ position: 'relative' }}>
              <Image
                source={require('../../assets/mc-logo.png')}
                style={{
                  width: 26,
                  height: 26,
                  opacity: focused ? 1 : 0.5,
                }}
                resizeMode="contain"
              />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -9,
                    backgroundColor: '#ef4444',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#ffffff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.25,
                    shadowRadius: 2,
                    elevation: 4
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900', textAlign: 'center' }}>
                    {formatUnreadBadge(unreadCount)}
                  </Text>
                </View>
              )}
            </View>
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
