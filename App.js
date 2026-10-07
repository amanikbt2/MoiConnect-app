import React from 'react';
import { View, Text, Platform, Modal, ScrollView, Image } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { UniversityProvider } from './src/context/UniversityContext';
import { UniversitySetupModal } from './src/components/UniversitySetupModal';
import { NetworkProvider } from './src/context/NetworkContext';
import { StatusBar } from 'expo-status-bar';
import { GlobalBottomBar } from './src/components/GlobalBottomBar';

export const navigationRef = createNavigationContainerRef();

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
import AgentScreen from './app/agent-screen';
import LandlordPortalScreen from './app/landlord-portal';
import Admin2Screen from './app/admin2';

import LoginScreen from './app/(auth)/login';
import RegisterScreen from './app/(auth)/register';
import RequestLandlordScreen from './app/(auth)/request-landlord';

import PaperDetailScreen from './app/paper/[id]';
import HouseDetailScreen from './app/house/[id]';
import ChatRoomScreen from './app/chat/[id]';

import { TouchableOpacity } from 'react-native';
import { useAuth } from './src/context/AuthContext';
import { HomeIcon, BookIcon, DownloadIcon, HouseIcon, MessageIcon, ProfileIcon, BellIcon, CommunityIcon } from './src/components/Icons';
import { InAppPopupModal } from './src/components/InAppPopupModal';
import { checkAppPopups } from './src/services/popupService';
import { setupNotificationResponseListener } from './src/services/notificationService';
import { apiRequest } from './src/services/api';
import {
  getReadNotificationIds,
  saveReadNotificationIdsBatch
} from './src/services/offlineStorage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient();

const repairNotificationText = (value) => {
  if (typeof value !== 'string' || !/[ÃÂâð]/.test(value)) return value || '';

  let repaired = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const encodedBytes = Array.from(repaired).map((character) => {
        const code = character.charCodeAt(0);
        if (code > 255) throw new Error('Not mojibake');
        return `%${code.toString(16).padStart(2, '0')}`;
      }).join('');
      const decoded = decodeURIComponent(encodedBytes);
      if (decoded === repaired || decoded.includes('\ufffd')) break;
      repaired = decoded;
      if (!/[ÃÂâð]/.test(repaired)) break;
    } catch (_) {
      break;
    }
  }

  return repaired;
};

function HeaderNotificationBell() {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const loadNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/notifications', { method: 'GET' });
      const list = res.data?.notifications || res.notifications || [];
      const localReadIds = new Set(await getReadNotificationIds());
      setNotifications(list.map((item) => ({
        ...item,
        id: item._id,
        title: repairNotificationText(item.title),
        subtitle: repairNotificationText(item.subtitle),
        message: repairNotificationText(item.body),
        read: Boolean(item.isRead || localReadIds.has(item._id))
      })));
    } catch (error) {
      console.warn('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllRead = async () => {
    const allIds = notifications.map((notification) => notification.id).filter(Boolean);
    if (allIds.length > 0) {
      await saveReadNotificationIdsBatch(allIds);
    }

    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    if (allIds.length > 0) {
      await apiRequest('/notifications/read-all', { method: 'POST' });
    }
  };

  const closeModal = async () => {
    await markAllRead();
    setModalVisible(false);
  };

  return (
    <View style={{ marginRight: 12 }}>
      <TouchableOpacity
        onPress={async () => {
          setModalVisible(true);
          await loadNotifications();
        }}
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
        onRequestClose={closeModal}
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
          onPress={closeModal}
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
              {loading ? (
                <Text style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading notifications…</Text>
              ) : notifications.length === 0 ? (
                <Text style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No notifications yet.</Text>
              ) : notifications.map((item) => (
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
              onPress={closeModal}
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
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#166634', textTransform: 'uppercase' }}>Your Points</Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#15803d', marginVertical: 2 }}>{userPoints} pts</Text>
              <Text style={{ fontSize: 11, color: '#15803d' }}>Earn points by contributing study materials!</Text>
            </View>

            {/* Progress Section Container */}
            <View style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 16 }}>
                {userPoints >= 1000
                  ? '🎉 Max level reached!'
                  : userPoints >= 100
                  ? 'Reach 1000+ pts to unlock Ksh 2,500'
                  : userPoints >= 10
                  ? 'Reach 100+ pts to unlock Ksh 450'
                  : userPoints >= 8
                  ? 'Reach 10+ pts to unlock Ksh 1'
                  : userPoints >= 6
                  ? 'Reach 8+ pts to unlock Ksh 1'
                  : 'Reach 6+ pts to unlock Ksh 5'}
              </Text>

              {/* Progress Line Component */}
              <View style={{ position: 'relative', paddingVertical: 6, marginBottom: 4 }}>
                {/* Connecting Line */}
                <View style={{ position: 'absolute', top: 26, left: 16, right: 16, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2 }}>
                  <View
                    style={{
                      height: '100%',
                      backgroundColor: '#16a34a',
                      borderRadius: 2,
                      width: `${
                        userPoints >= 1000
                          ? 100
                          : userPoints >= 100
                          ? 75 + Math.min(25, ((userPoints - 100) / 900) * 25)
                          : userPoints >= 10
                          ? 50 + Math.min(25, ((userPoints - 10) / 90) * 25)
                          : userPoints >= 8
                          ? 25 + Math.min(25, ((userPoints - 8) / 2) * 25)
                          : userPoints >= 6
                          ? Math.min(25, ((userPoints - 6) / 2) * 25)
                          : 0
                      }%`
                    }}
                  />
                </View>

                {/* Nodes Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {[
                    { pts: 6, label: '6+ pts', reward: 'Ksh 5' },
                    { pts: 8, label: '8+ pts', reward: 'Ksh 1' },
                    { pts: 10, label: '10+ pts', reward: 'Ksh 1' },
                    { pts: 100, label: '100+ pts', reward: 'Ksh 450' },
                    { pts: 1000, label: '1000+ pts', reward: 'Ksh 2.5k' }
                  ].map((m) => {
                    const isReached = userPoints >= m.pts;
                    return (
                      <View key={m.pts} style={{ alignItems: 'center', width: 48 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: isReached ? '#15803d' : '#94a3b8', marginBottom: 6 }}>
                          {m.label}
                        </Text>
                        <View
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: isReached ? '#16a34a' : '#ffffff',
                            borderWidth: 2,
                            borderColor: isReached ? '#15803d' : '#cbd5e1',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isReached && <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                        </View>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: isReached ? '#15803d' : '#64748b', marginTop: 6 }}>
                          {m.reward}
                        </Text>
                      </View>
                    );
                  })}
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
        <Text style={{ color: '#ffffff' }}>M</Text>
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

function NotesPdfHeaderTitle() {
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
        <Text style={{ color: '#ffffff' }}>Notes </Text>
        <Text style={{ color: '#a7f3d0' }}>PDF</Text>
      </Text>
    </View>
  );
}

function RentalsHeaderTitle() {
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
        <Text style={{ color: '#ffffff' }}>Students </Text>
        <Text style={{ color: '#a7f3d0' }}>Rentals</Text>
      </Text>
    </View>
  );
}

function ProfileHeaderTitle() {
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
        <Text style={{ color: '#ffffff' }}>Student </Text>
        <Text style={{ color: '#a7f3d0' }}>Profile</Text>
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
        tabBarStyle: { display: 'none' }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: () => <HomeHeaderTitle />,
        }}
      />
      <Tab.Screen
        name="DownloadsTab"
        component={DownloadsScreen}
        options={{
          title: 'Downloads',
          headerTitle: () => <DownloadsHeaderTitle />,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={CommunityScreen}
        options={{
          title: 'Community',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator({ currentRoute }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activePopup, setActivePopup] = React.useState(null);
  const [popupVisible, setPopupVisible] = React.useState(false);

  React.useEffect(() => {
    const removeNotificationListener = setupNotificationResponseListener((screenPath) => {
      if (screenPath === '/(tabs)/messages' && navigationRef.isReady()) {
        navigationRef.navigate('MainTabs', { screen: 'MessagesTab' });
      }
    });
    return () => {
      removeNotificationListener();
    };
  }, [user]);


  React.useEffect(() => {
    let isMounted = true;
    checkAppPopups('1.1.5', user)
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

  const handleBottomBarNavigate = (tab) => {
    if (!navigationRef || !navigationRef.isReady()) return;
    if (tab === 'Home') {
      navigationRef.navigate('MainTabs', { screen: 'HomeTab' });
    } else if (tab === 'Downloads') {
      navigationRef.navigate('MainTabs', { screen: 'DownloadsTab' });
    } else if (tab === 'Community') {
      navigationRef.navigate('MainTabs', { screen: 'MessagesTab' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
      <View style={{ flex: 1 }}>
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
          <Stack.Screen name="AgentScreen" component={AgentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LandlordPortal" component={LandlordPortalScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Admin2" component={Admin2Screen} options={{ headerShown: false }} />
          <Stack.Screen name="Academics" component={AcademicsScreen} options={{ title: 'Notes PDF', headerShown: true }} />
          <Stack.Screen name="Rentals" component={RentalsScreen} options={{ title: 'Student Rental Marketplace', headerShown: true }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="RequestLandlord" component={RequestLandlordScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="PaperDetail" component={PaperDetailScreen} options={{ title: 'Paper Detail', headerShown: true }} />
          <Stack.Screen name="HouseDetail" component={HouseDetailScreen} options={{ title: 'House Detail', headerShown: true }} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Chat Conversation', headerShown: true }} />
        </Stack.Navigator>
      </View>
      <GlobalBottomBar currentRoute={currentRoute} onNavigate={handleBottomBarNavigate} />
      <InAppPopupModal
        visible={popupVisible}
        popup={activePopup}
        onClose={() => setPopupVisible(false)}
      />
    </View>
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
      AgentScreen: 'agent-screen',
      Community: 'community',
      LandlordPortal: 'landlord-portal',
      Admin2: 'admin2',
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
  const [currentRoute, setCurrentRoute] = React.useState('HomeTab');

  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <QueryClientProvider client={queryClient}>
          <UniversityProvider>
            <UniversitySetupModal />
            <AuthProvider>
              <ThemeProvider>
              <StatusBar style="light" backgroundColor="#15803d" />
              <NavigationContainer
                ref={navigationRef}
                linking={linking}
                onReady={() => {
                  const route = navigationRef.getCurrentRoute();
                  if (route) setCurrentRoute(route.name);
                }}
                onStateChange={() => {
                  const route = navigationRef.getCurrentRoute();
                  if (route) setCurrentRoute(route.name);
                }}
              >
                <AppNavigator currentRoute={currentRoute} />
              </NavigationContainer>
              </ThemeProvider>
            </AuthProvider>
          </UniversityProvider>
        </QueryClientProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
