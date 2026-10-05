import React, { useEffect, useRef, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { AppState, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalBottomBar } from '../src/components/GlobalBottomBar';
import { IceMessageHost } from '../src/components/IceMessageCard';
import { InAppPopupModal } from '../src/components/InAppPopupModal';
import { checkAppPopups } from '../src/services/popupService';
import { registerForPushNotificationsAsync, setCommunityChatActive, setupNotificationResponseListener } from '../src/services/notificationService';
import { useAuth } from '../src/context/AuthContext';
import { UniversityProvider } from '../src/context/UniversityContext';
import { UniversitySetupModal } from '../src/components/UniversitySetupModal';
import { syncCommunityUnreadBackground } from '../src/services/offlineStorage';

import * as SplashScreen from 'expo-splash-screen';
import { initSocket } from '../src/services/socket';

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
    void registerForPushNotificationsAsync();
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
        void registerForPushNotificationsAsync();
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
export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setCommunityChatActive(
      pathname.toLowerCase().includes('message') || pathname.toLowerCase().includes('community')
    );
    return () => setCommunityChatActive(false);
  }, [pathname]);

  const handleNavigate = (tab: 'Home' | 'Downloads' | 'Community') => {
    if (tab === 'Home') router.push('/(tabs)');
    else if (tab === 'Downloads') router.push('/(tabs)/downloads');
    else if (tab === 'Community') router.push('/(tabs)/messages');
  };

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
    // Request permission and register the device as soon as the installed
    // app opens, even before authentication is complete. The authenticated
    // runtime retries after sign-in so the same token becomes linked to the
    // user's account when available.
    void registerForPushNotificationsAsync();
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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <UniversityProvider>
          <UniversitySetupModal />
          <AuthProvider>
            <AppRuntimeServices />
          <IceMessageHost />
          <StatusBar style="light" backgroundColor="#15803d" />
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <View style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="faq" options={{ headerShown: false }} />
                <Stack.Screen name="privacy" options={{ headerShown: false }} />
                <Stack.Screen name="past-papers" options={{ headerShown: false }} />
                <Stack.Screen name="cat-papers" options={{ headerShown: false }} />
                <Stack.Screen name="contribute" options={{ headerShown: false }} />
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
            <GlobalBottomBar
              currentRoute={pathname}
              onNavigate={handleNavigate}
              onMentionNavigate={() => router.push({ pathname: '/(tabs)/messages', params: { focusMention: '1' } })}
            />
          </View>
          </AuthProvider>
        </UniversityProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
