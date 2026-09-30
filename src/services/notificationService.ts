import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiRequest } from './api';

// Configure foreground push notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let registrationInFlight: Promise<string | null> | null = null;

export async function registerForPushNotificationsAsync() {
  if (registrationInFlight) return registrationInFlight;
  registrationInFlight = registerPushToken();
  try {
    return await registrationInFlight;
  } finally {
    registrationInFlight = null;
  }
}

async function registerPushToken() {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MoiConnect Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#15803d'
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Notifications]: Permission not granted for push notifications.');
      return null;
    }

    const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId || process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '53c51c41-a1f7-40a0-8111-7b7cd97d968e';

    let token: string | null = null;
    try {
      console.log(`[Notifications]: Requesting Expo token for project ${projectId}.`);
      const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = pushTokenData.data;
    } catch (tokenErr) {
      console.warn('[Notifications]: getExpoPushTokenAsync error, attempting native device token fallback:', tokenErr);
      try {
        const nativeToken = await Notifications.getDevicePushTokenAsync();
        token = typeof nativeToken.data === 'string' ? nativeToken.data : JSON.stringify(nativeToken.data);
      } catch (nativeErr) {
        console.error('[Notifications]: Could not fetch native device token:', nativeErr);
      }
    }

    if (!token) {
      console.error('[Notifications]: Android did not return a valid push token.');
      return null;
    }

    const registration = await apiRequest('/notifications/register-token', {
      method: 'POST',
      body: JSON.stringify({
        token,
        platform: Platform.OS
      })
    });
    if (!registration.success) {
      console.error('[Notifications]: Backend token registration failed:', registration.error || 'Unknown error');
      return null;
    }

    console.log('[Notifications]: Push token registered successfully with backend.');
    return token;
  } catch (error) {
    console.error('[Notifications]: Error registering push token:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function notifyLoginSuccess(userName: string) {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }

    await Notifications.setNotificationChannelAsync('default', {
      name: 'MoiConnect Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#15803d'
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Login successful 🎉',
        body: `You've logged in successfully, ${userName}. Explore PDFs and community chat.`,
        sound: 'default',
        data: { screen: 'home', channelId: 'login_success' }
      },
      trigger: null
    });
  } catch (error) {
    console.warn('[Notifications]: Could not show login success notification:', error);
  }
}
export function setupNotificationResponseListener(onNavigate: (screenPath: string) => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    return () => {};
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data && (data.screen === 'community' || data.channelId === 'community_chat')) {
      onNavigate('/(tabs)/messages');
    }
  });

  return () => {
    subscription.remove();
  };
}

export function sendWebBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  const trigger = () => {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.png'
      });
      if (onClick) {
        notif.onclick = () => {
          window.focus();
          onClick();
        };
      }
    } catch (e) {}
  };

  if (Notification.permission === 'granted') {
    trigger();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        trigger();
      }
    });
  }
}
