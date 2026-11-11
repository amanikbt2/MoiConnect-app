import React, { useEffect, useRef, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar as AndroidNavigationBar } from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { AppState, Platform, View, TouchableOpacity } from 'react-native';
import { ArrowLeftIcon } from '../src/components/Icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalBottomBar } from '../src/components/GlobalBottomBar';
import { IceMessageHost } from '../src/components/IceMessageCard';
import { InAppPopupModal } from '../src/components/InAppPopupModal';
import { checkAppPopups } from '../src/services/popupService';
import { setupForumLiveNotificationCleanup, setupNotificationResponseListener } from '../src/services/notificationService';
import { useAuth } from '../src/context/AuthContext';
import { UniversityProvider } from '../src/context/UniversityContext';
import { UniversitySetupModal } from '../src/components/UniversitySetupModal';
import { syncCommunityUnreadBackground } from '../src/services/offlineStorage';

import * as SplashScreen from 'expo-splash-screen';
import { initSocket } from '../src/services/socket';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

// Hide splash screen immediately when JS bundle executes
void SplashScreen.hideAsync().catch(() => {});

const queryClient = new QueryClient();

function AppRuntimeServices() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [activePopup, setActivePopup] = useState<any>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const popupCheckInFlight = useRef(false);
  useEffect(() => setupForumLiveNotificationCleanup(), []);
  const loadPopup = async () => {
    if (popupCheckInFlight.current) return;
    popupCheckInFlight.current = true;
    try {
      const result = await checkAppPopups('1.1.5', user);
      if (result.hasPopup && result.popup) {
        setActivePopup(result.popup);
        setPopupVisible(true);
      }
    } finally {
      popupCheckInFlight.current = false;
    }
  };

  useEffect(() => {
    const removeNotificationListener = setupNotificationResponseListener((screenPath) => {
      router.push(screenPath as any);
    });

    const onCommunityRoute = pathname.toLowerCase().includes('message') || pathname.toLowerCase().includes('community');

    // Keep unread counters fresh while the app is open. Notifications are
    // suppressed by the sync service while the user is already in the chat.
    void syncCommunityUnreadBackground({ notify: !onCommunityRoute });
    const communitySyncInterval = setInterval(() => {
      void syncCommunityUnreadBackground({ notify: !onCommunityRoute });
    }, 5000);

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadPopup();
        void syncCommunityUnreadBackground({ notify: !onCommunityRoute });
      }
    });

    loadPopup();
    return () => {
      removeNotificationListener();
      appStateSubscription.remove();
      clearInterval(communitySyncInterval);
    };
  }, [user?._id, pathname]);

  return (
    <InAppPopupModal
      visible={popupVisible}
      popup={activePopup}
      onClose={() => setPopupVisible(false)}
    />
  );
}
function RootLayoutContent() {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (tab: 'Home' | 'Downloads' | 'Community') => {
    if (tab === 'Home') router.push('/(tabs)');
    else if (tab === 'Downloads') router.push('/(tabs)/downloads');
    else if (tab === 'Community') router.push('/(tabs)/messages');
  };

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
    // Automatically initialize socket connection for online status tracking
    initSocket().catch(() => {});

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'expo-reset-outline';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          input, textarea, select, [contenteditable="true"] {
            outline: none !important;
            box-shadow: none !important;
          }
          *:focus {
            outline: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Android draws the system navigation area against the window background.
    // Keep that background and the system button contrast in step with the app theme.
    void SystemUI.setBackgroundColorAsync(colors.background).catch((error) => {
      console.warn('[Theme] Could not update Android system navigation background:', error);
    });
  }, [colors.background]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <UniversityProvider>
          <AuthProvider>
            <UniversitySetupModal />
            <AppRuntimeServices />
          <IceMessageHost />
          <StatusBar style="light" />
          {Platform.OS === 'android' ? <AndroidNavigationBar style={isDark ? 'light' : 'dark'} /> : null}
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: Platform.OS === 'android' ? 'none' : 'default',
                  headerStyle: { backgroundColor: colors.header },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { fontWeight: '800', fontSize: 18 },
                  headerLeft: ({ canGoBack, tintColor }) => (
                    <TouchableOpacity
                      onPress={() => {
                        if (router.canGoBack()) {
                          router.back();
                        } else {
                          router.push('/(tabs)');
                        }
                      }}
                      style={{
                        paddingRight: 14,
                        paddingVertical: 6,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                      accessibilityLabel="Go back"
                      accessibilityRole="button"
                    >
                      <ArrowLeftIcon color="#ffffff" size={22} />
                    </TouchableOpacity>
                  )
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="faq" options={{ title: 'Frequently Asked Questions', headerShown: true }} />
                <Stack.Screen name="privacy" options={{ title: 'Privacy Policy', headerShown: true }} />
                <Stack.Screen name="past-papers" options={{ title: 'Past Exam Papers', headerShown: true }} />
                <Stack.Screen name="cat-papers" options={{ title: 'CAT Papers', headerShown: true }} />
                <Stack.Screen name="contribute" options={{ headerShown: false }} />
                <Stack.Screen name="admin2" options={{ headerShown: false }} />
                <Stack.Screen name="community" options={{ headerShown: false }} />
                <Stack.Screen name="landlord-portal" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
                <Stack.Screen name="(auth)/register" options={{ presentation: 'modal' }} />
                <Stack.Screen name="(auth)/request-landlord" options={{ presentation: 'modal' }} />
                <Stack.Screen name="paper/[id]" options={{ title: 'Paper Detail', headerShown: true }} />
                <Stack.Screen name="house/[id]" options={{ title: 'House Detail', headerShown: true }} />
                <Stack.Screen name="chat/[id]" options={{ title: 'Chat Conversation', headerShown: true }} />
              </Stack>
            </View>
            {!pathname.toLowerCase().includes('admin2') ? (
              <GlobalBottomBar
                currentRoute={pathname}
                onNavigate={handleNavigate}
                onMentionNavigate={() => router.push({ pathname: '/(tabs)/messages', params: { focusMention: '1' } })}
              />
            ) : null}
          </View>
          </AuthProvider>
        </UniversityProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
