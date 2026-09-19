import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(auth)/register" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(auth)/request-landlord" options={{ presentation: 'modal' }} />
          <Stack.Screen name="paper/[id]" options={{ title: 'Paper Detail', headerShown: true }} />
          <Stack.Screen name="house/[id]" options={{ title: 'House Detail', headerShown: true }} />
          <Stack.Screen name="chat/[id]" options={{ title: 'Chat Conversation', headerShown: true }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}

