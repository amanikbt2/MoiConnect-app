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
import FAQScreen from './app/faq';
import PastPapersScreen from './app/past-papers';
import CatPapersScreen from './app/cat-papers';
import ContributeScreen from './app/contribute';
import LandlordPortalScreen from './app/landlord-portal';

import LoginScreen from './app/(auth)/login';
import RegisterScreen from './app/(auth)/register';
import RequestLandlordScreen from './app/(auth)/request-landlord';

import PaperDetailScreen from './app/paper/[id]';
import HouseDetailScreen from './app/house/[id]';
import ChatRoomScreen from './app/chat/[id]';

import { TouchableOpacity } from 'react-native';
import { useAuth } from './src/context/AuthContext';
import { HomeIcon, BookIcon, DownloadIcon, HouseIcon, MessageIcon, ProfileIcon, BellIcon } from './src/components/Icons';
import { InAppPopupModal } from './src/components/InAppPopupModal';
import { checkAppPopups } from './src/services/popupService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient();

function HeaderNotificationBell() {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(4);
  const [notifications, setNotifications] = React.useState([
    {
      id: 'welcome_reward',
      title: '🎉 Account Created Reward',
      message: "You've been awarded pt5 for creating an account.",
      time: 'Just now',
      type: 'reward',
      read: false
    },
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

function HeaderPointsBadge() {
  const { user, userPoints } = useAuth();
  const [modalVisible, setModalVisible] = React.useState(false);

  if (!user) return null;

  return (
    <View style={{ marginRight: 6 }}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.16)',
          borderRadius: 10,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.22)',
          gap: 2
        }}
        activeOpacity={0.75}
      >
        <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 9.5, fontWeight: '600' }}>pt</Text>
        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>{userPoints}+</Text>
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
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24
          }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24 }}>🌟</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Student Rewards</Text>
              <Text style={{ fontSize: 12, color: '#15803d', fontWeight: '600', marginTop: 2 }}>MoiConnect Points System</Text>
            </View>

            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Your Balance</Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#15803d', marginVertical: 2 }}>{userPoints} pts</Text>
              <Text style={{ fontSize: 11, color: '#15803d' }}>Earn points by contributing study materials!</Text>
            </View>

            <View style={{ gap: 8, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 10, borderRadius: 12 }}>
                <Text style={{ fontSize: 16 }}>🎉</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>Account Welcome Bonus</Text>
                  <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '600' }}>+5 pts awarded on registration</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 10, borderRadius: 12 }}>
                <Text style={{ fontSize: 16 }}>📚</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>Material Contribution</Text>
                  <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '600' }}>+10 pts per approved upload</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#15803d', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function HeaderProfileAvatar({ navigation }) {
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

function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#15803d' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <HeaderPointsBadge />
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
          headerTitle: () => <DownloadsHeaderTitle />,
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

function AppNavigator() {
  const { user } = useAuth();
  const [activePopup, setActivePopup] = React.useState(null);
  const [popupVisible, setPopupVisible] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    checkAppPopups('1.0.6', user)
      .then((res) => {
        if (isMounted && res.hasPopup && res.popup) {
          setActivePopup(res.popup);
          setPopupVisible(true);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <>
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
        <Stack.Screen name="FAQ" component={FAQScreen} options={{ title: 'Frequently Asked Questions', headerShown: true }} />
        <Stack.Screen name="PastPapers" component={PastPapersScreen} options={{ title: 'Past Exam Papers', headerShown: true }} />
        <Stack.Screen name="CatPapers" component={CatPapersScreen} options={{ title: 'CAT Papers', headerShown: true }} />
        <Stack.Screen name="Contribute" component={ContributeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LandlordPortal" component={LandlordPortalScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Academics" component={AcademicsScreen} options={{ title: 'Notes PDF', headerShown: true }} />
        <Stack.Screen name="Rentals" component={RentalsScreen} options={{ title: 'Student Rental Marketplace', headerShown: true }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="RequestLandlord" component={RequestLandlordScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="PaperDetail" component={PaperDetailScreen} options={{ title: 'Paper Detail', headerShown: true }} />
        <Stack.Screen name="HouseDetail" component={HouseDetailScreen} options={{ title: 'House Detail', headerShown: true }} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Chat Conversation', headerShown: true }} />
      </Stack.Navigator>
      <InAppPopupModal
        visible={popupVisible}
        popup={activePopup}
        onClose={() => setPopupVisible(false)}
      />
    </>
  );
}

const linking = {
  prefixes: [
    'https://moiconnect-app.onrender.com',
    'http://localhost:8082',
    'http://localhost:3000',
    'http://localhost:8080',
    'moiconnect://'
  ],
  config: {
    screens: {
      MainTabs: {
        path: '',
        screens: {
          HomeTab: '',
          DownloadsTab: 'downloads',
          MessagesTab: 'messages'
        }
      },
      Profile: 'profile',
      Privacy: 'privacy',
      FAQ: 'faq',
      PastPapers: 'past-papers',
      CatPapers: 'cat-papers',
      Contribute: 'contribute',
      Community: 'community',
      LandlordPortal: 'landlord-portal',
      Academics: 'academics',
      Rentals: 'rentals',
      Login: 'login',
      Register: 'register',
      RequestLandlord: 'request-landlord',
      PaperDetail: 'paper/:id',
      HouseDetail: 'house/:id',
      ChatRoom: 'chat/:id'
    }
  }
};

export default function App() {
  return (
    <NetworkProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <NavigationContainer linking={linking}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </NetworkProvider>
  );
}
