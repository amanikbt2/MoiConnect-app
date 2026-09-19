import React from 'react';
import { View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './app/(tabs)/index';
import AcademicsScreen from './app/(tabs)/academics';
import DownloadsScreen from './app/(tabs)/downloads';
import RentalsScreen from './app/(tabs)/rentals';
import MessagesScreen from './app/(tabs)/messages';
import ProfileScreen from './app/(tabs)/profile';

import CommunityScreen from './app/community';
import PrivacyScreen from './app/privacy';

import LoginScreen from './app/(auth)/login';
import RegisterScreen from './app/(auth)/register';
import RequestLandlordScreen from './app/(auth)/request-landlord';

import PaperDetailScreen from './app/paper/[id]';
import HouseDetailScreen from './app/house/[id]';
import ChatRoomScreen from './app/chat/[id]';

import { HomeIcon, BookIcon, DownloadIcon, HouseIcon, MessageIcon, ProfileIcon } from './src/components/Icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient();

function MainTabs() {
  return (
    <Tab.Navigator
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
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'MConnect',
          tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} />
        }}
      />
      <Tab.Screen
        name="AcademicsTab"
        component={AcademicsScreen}
        options={{
          title: 'Academics',
          headerTitle: 'Academic Resources',
          tabBarIcon: ({ color }) => <BookIcon color={color} size={22} />
        }}
      />
      <Tab.Screen
        name="DownloadsTab"
        component={DownloadsScreen}
        options={{
          title: 'Downloads',
          headerTitle: 'Offline Downloaded Materials',
          tabBarIcon: ({ color }) => <DownloadIcon color={color} size={22} />
        }}
      />
      <Tab.Screen
        name="RentalsTab"
        component={RentalsScreen}
        options={{
          title: 'Rentals',
          headerTitle: 'Student Rental Marketplace',
          tabBarIcon: ({ color }) => <HouseIcon color={color} size={22} />
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{
          title: 'Messages',
          headerTitle: 'Conversations',
          tabBarIcon: ({ color }) => <MessageIcon color={color} size={22} />
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'Student Profile & Settings',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} size={22} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: '#15803d' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { fontWeight: '800', fontSize: 18 }
              }}
            >
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="Community" component={CommunityScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy Policy', headerShown: true }} />
              <Stack.Screen name="Academics" component={AcademicsScreen} options={{ title: 'Academic Resources', headerShown: true }} />
              <Stack.Screen name="Rentals" component={RentalsScreen} options={{ title: 'Student Rental Marketplace', headerShown: true }} />
              <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="RequestLandlord" component={RequestLandlordScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="PaperDetail" component={PaperDetailScreen} options={{ title: 'Paper Detail', headerShown: true }} />
              <Stack.Screen name="HouseDetail" component={HouseDetailScreen} options={{ title: 'House Detail', headerShown: true }} />
              <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Chat Conversation', headerShown: true }} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </NetworkProvider>
  );
}
