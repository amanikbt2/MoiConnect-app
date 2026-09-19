import React from 'react';
import { Tabs } from 'expo-router';
import { HomeIcon, DownloadIcon, MessageIcon, ProfileIcon } from '../../src/components/Icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#15803d' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        tabBarActiveTintColor: '#15803d',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'MoiConnect',
          tabBarIcon: ({ color }: { color: string }) => <HomeIcon color={color} size={22} />
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          href: null,
          headerTitle: 'Academic Resources',
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          headerTitle: 'Offline Downloaded Materials',
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
        options={{
          title: 'Messages',
          headerTitle: 'Conversations',
          tabBarIcon: ({ color }: { color: string }) => <MessageIcon color={color} size={22} />
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
