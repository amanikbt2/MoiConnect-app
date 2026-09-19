import React from 'react';
import { View, Text, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { HomeIcon, DownloadIcon, MessageIcon, ProfileIcon } from '../../src/components/Icons';

function HomeHeaderTitle() {
  return (
    <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: 0.4 }}>
      MConnect
    </Text>
  );
}

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
          title: 'Community',
          headerShown: false,
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
