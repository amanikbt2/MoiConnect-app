import React from 'react';
import { View, Text, Platform, Modal, ScrollView, Image } from 'react-native';
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

import { TouchableOpacity } from 'react-native';
import { useAuth } from './src/context/AuthContext';
import { HomeIcon, BookIcon, DownloadIcon, HouseIcon, MessageIcon, ProfileIcon, BellIcon } from './src/components/Icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient();

function HeaderNotificationBell() {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(3);
  const [notifications, setNotifications] = React.useState([
    {
      id: '1',
      title: 'Exam Timetable Released',
      message: 'Draft exam timetable for School of Information Sciences is now available.',
      time: '10 mins ago',
      type: 'academic',
      read: false
    },
    {
      id: '2',
      title: 'New Past Paper Uploaded',
      message: 'STA 210 Probability & Statistics 2023 exam paper has been added.',
      time: '1 hr ago',
      type: 'paper',
      read: false
    },
    {
      id: '3',
      title: 'Rental Booking Update',
      message: 'Landlord approved your room viewing request for Kesses Sunrise Hostels.',
      time: 'Yesterday',
      type: 'rental',
      read: false
    },
    {
      id: '4',
      title: 'Campus Event',
      message: 'Moi University Tech & Innovation Hackathon registrations are open.',
      time: '2 days ago',
      type: 'event',
      read: true
    }
  ]);

  const markAllRead = () => {
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <View style={{ marginRight: 12 }}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{ padding: 4, position: 'relative' }}
        activeOpacity={0.7}
      >
        <BellIcon color="#ffffff" size={24} />
        {unreadCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              backgroundColor: '#ef4444',
              borderRadius: 9,
              minWidth: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
              borderWidth: 1.5,
              borderColor: '#15803d'
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            paddingTop: 60,
            paddingRight: 16
          }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={{
              width: 320,
              maxHeight: 450,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 1,
              borderColor: '#e2e8f0'
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803d' }}>{unreadCount} new</Text>
                  </View>
                )}
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803d' }}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              {notifications.map((item) => (
                <View
                  key={item.id}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: item.read ? '#f8fafc' : '#f0fdf4',
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: item.read ? '#94a3b8' : '#22c55e'
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', flex: 1 }}>{item.title}</Text>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>{item.time}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#334155', lineHeight: 16 }}>{item.message}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function HeaderProfileAvatar({ navigation }: any) {
  const { user } = useAuth();
  const initial = user?.name ? user.name[0].toUpperCase() : 'M';

  return (
    <TouchableOpacity
      style={{
        marginRight: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3
      }}
      onPress={() => navigation.navigate('Profile')}
      activeOpacity={0.8}
    >
      <Text style={{ color: '#15803d', fontWeight: '800', fontSize: 16 }}>{initial}</Text>
    </TouchableOpacity>
  );
}

function HomeHeaderTitle() {
  return (
    <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: 0.4 }}>
      MConnect
    </Text>
  );
}

function MainTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#15803d' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <HeaderNotificationBell />
            <HeaderProfileAvatar navigation={navigation} />
          </View>
        ),
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
          headerTitle: () => <HomeHeaderTitle />,
          tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} />
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
        name="MessagesTab"
        component={CommunityScreen}
        options={{
          title: 'Community',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('./assets/mc-logo.png')}
              style={{ width: 26, height: 26, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          )
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
              <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Student Profile & Settings', headerShown: true }} />
              <Stack.Screen name="Community" component={CommunityScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy Policy', headerShown: true }} />
              <Stack.Screen name="Academics" component={AcademicsScreen} options={{ title: 'Notes PDF', headerShown: true }} />
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
