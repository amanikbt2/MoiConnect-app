import * as Notifications from 'expo-notifications';
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

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
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

    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    const token = pushTokenData.data;

    if (token) {
      await apiRequest('/notifications/register-token', {
        method: 'POST',
        body: JSON.stringify({
          token,
          platform: Platform.OS
        })
      });
      console.log('[Notifications]: Push token registered successfully:', token);
    }

    return token;
  } catch (error) {
    console.error('[Notifications]: Error registering push token:', error);
    return null;
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
