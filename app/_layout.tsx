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
import { registerForPushNotificationsAsync, setupNotificationResponseListener } from '../src/services/notificationService';
import { useAuth } from '../src/context/AuthContext';

import { initSocket } from '../src/services/socket';
import { apiRequest } from '../src/services/api';
import { getStoredCommunityMessages, saveCommunityMessages } from '../src/services/offlineStorage';

const queryClient = new QueryClient();

function AppRuntimeServices() {
  const { user } = useAuth();
  const router = useRouter();
  const [activePopup, setActivePopup] = useState<any>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const popupCheckInFlight = useRef(false);
  const communityPrefetchInFlight = useRef(false);

  const prefetchCommunityMessages = async () => {
    if (communityPrefetchInFlight.current) return;
    communityPrefetchInFlight.current = true;
    try {
      const [cached, response] = await Promise.all([
        getStoredCommunityMessages(),
        apiRequest<{ success: boolean; data?: any[] }>('/community/messages?limit=120')
      ]);
      if (!response.success || !Array.isArray(response.data)) return;
      const merged = new Map<string, any>();
      [...cached, ...response.data].forEach((message: any) => {
        const id = String(message.id || message._id || message.clientMsgId || '');
        if (id) merged.set(id, message);
      });
      const refreshed = Array.from(merged.values()).sort((a, b) =>
        new Date(a.createdAt || a.isoDate || 0).getTime() - new Date(b.createdAt || b.isoDate || 0).getTime()
      );
      await saveCommunityMessages(refreshed.slice(-120));
    } catch {
      // Optional background work; the chat screen retries when opened.
    } finally {
      communityPrefetchInFlight.current = false;
    }
  };

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
    if (user) void registerForPushNotificationsAsync();
    const removeNotificationListener = setupNotificationResponseListener((screenPath) => {
      router.push(screenPath as any);
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (user) void registerForPushNotificationsAsync();
        loadPopup();
        void prefetchCommunityMessages();
      }
    });

    loadPopup();
    void prefetchCommunityMessages();
    return () => {
      removeNotificationListener();
      appStateSubscription.remove();
    };
  }, [user]);

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

  const handleNavigate = (tab: 'Home' | 'Downloads' | 'Community') => {
    if (tab === 'Home') router.push('/(tabs)');
    else if (tab === 'Downloads') router.push('/(tabs)/downloads');
    else if (tab === 'Community') router.push('/(tabs)/messages');
  };

  useEffect(() => {
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
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
