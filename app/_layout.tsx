import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalBottomBar } from '../src/components/GlobalBottomBar';

import { initSocket } from '../src/services/socket';

const queryClient = new QueryClient();

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
            <GlobalBottomBar currentRoute={pathname} onNavigate={handleNavigate} />
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

