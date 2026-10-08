import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { apiRequest } from './api';

// Configure foreground push notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

let registrationInFlight: Promise<string | null> | null = null;
export const GENERAL_NOTIFICATION_CHANNEL_ID = 'mconnect_general_v2';
export const COMMUNITY_NOTIFICATION_CHANNEL_ID = 'mconnect_messages_v2';
const LOGIN_NOTIFICATION_CHANNEL_ID = 'mconnect_login_v2';
const COMMUNITY_MESSAGE_CATEGORY = 'community_message';
let registrationEnabled = false;
let registrationRetryTimer: ReturnType<typeof setTimeout> | null = null;
let registrationRetryAttempt = 0;
let permissionPrompted = false;
let notificationPermissionRequest: Promise<boolean> | null = null;
const MAX_REGISTRATION_RETRY_DELAY_MS = 5 * 60 * 1000;

function schedulePushRegistrationRetry() {
  if (!registrationEnabled || registrationRetryTimer) return;
  const delay = Math.min(5000 * (2 ** registrationRetryAttempt), MAX_REGISTRATION_RETRY_DELAY_MS);
  registrationRetryAttempt += 1;
  registrationRetryTimer = setTimeout(() => {
    registrationRetryTimer = null;
    void registerForPushNotificationsAsync();
  }, delay);
}

AppState.addEventListener('change', (state) => {
  if (state !== 'active' || !registrationEnabled) return;
  if (registrationRetryTimer) {
    clearTimeout(registrationRetryTimer);
    registrationRetryTimer = null;
  }
  void registerForPushNotificationsAsync();
});

async function configureNotificationCategories() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationCategoryAsync(COMMUNITY_MESSAGE_CATEGORY, [
      {
        identifier: 'reply',
        buttonTitle: 'Reply',
        textInput: {
          submitButtonTitle: 'Send',
          placeholder: 'Reply to message...'
        },
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'mark_read',
        buttonTitle: 'Mark as read',
        options: { opensAppToForeground: true }
      }
    ]);
  } catch (error) {
    console.warn('[Notifications]: Could not configure message actions:', error);
  }
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationPermissionRequest) {
    notificationPermissionRequest = (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus === 'granted') return true;
      if (permissionPrompted) return false;
      permissionPrompted = true;
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    })().finally(() => {
      notificationPermissionRequest = null;
    });
  }
  return notificationPermissionRequest;
}

async function configureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const common = {
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#15803d',
    sound: 'default' as const,
    enableVibrate: true,
    showBadge: true,
  };
  await Promise.all([
    Notifications.setNotificationChannelAsync(GENERAL_NOTIFICATION_CHANNEL_ID, {
      ...common,
      name: 'MConnect Notifications',
    }),
    Notifications.setNotificationChannelAsync(COMMUNITY_NOTIFICATION_CHANNEL_ID, {
      ...common,
      name: 'MConnect Messages',
    }),
    Notifications.setNotificationChannelAsync(LOGIN_NOTIFICATION_CHANNEL_ID, {
      ...common,
      name: 'MConnect Sign-in Alerts',
    }),
  ]);
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;
  registrationEnabled = true;
  if (registrationInFlight) return registrationInFlight;
  registrationInFlight = registerPushToken();
  try {
    return await registrationInFlight;
  } finally {
    registrationInFlight = null;
    if (registrationEnabled) {
      if (lastPushRegistrationSucceeded) {
        registrationRetryAttempt = 0;
        if (registrationRetryTimer) {
          clearTimeout(registrationRetryTimer);
          registrationRetryTimer = null;
        }
      } else {
        schedulePushRegistrationRetry();
      }
    }
  }
}

let lastPushRegistrationSucceeded = false;

export function stopPushTokenRegistrationRetries() {
  registrationEnabled = false;
  registrationRetryAttempt = 0;
  lastPushRegistrationSucceeded = false;
  if (registrationRetryTimer) {
    clearTimeout(registrationRetryTimer);
    registrationRetryTimer = null;
  }
}

async function registerPushToken() {
  lastPushRegistrationSucceeded = false;
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    await configureNotificationCategories();
    if (Platform.OS === 'android') {
      await configureAndroidChannels();
      await Notifications.setNotificationChannelAsync('academic', {
        name: 'MoiConnect Academic Approvals',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#15803d',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (!await ensureNotificationPermission()) {
      console.log('[Notifications]: Permission not granted for push notifications.');
      return null;
    }

    const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

    let token: string | null = null;
    try {
      console.log(`[Notifications]: Requesting Expo token${projectId ? ` for project ${projectId}` : ''}.`);
      const pushTokenData = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      token = pushTokenData.data;
    } catch (tokenErr) {
      console.error('[Notifications]: Could not fetch an Expo push token. Check the active EAS project ID and notification credentials.', tokenErr);
    }

    if (!token || !/^(Expo|Exponent)PushToken\[.+\]$/.test(token)) {
      console.error('[Notifications]: No compatible Expo push token was returned; device was not registered.');
      return null;
    }

    let registration: any = { success: false };
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        registration = await apiRequest('/notifications/register-token', {
          method: 'POST',
          body: JSON.stringify({
            token,
            platform: Platform.OS
          })
        });
        if (registration.success) break;
      } catch (reqErr) {
        console.warn(`[Notifications]: Registration attempt ${attempt} failed:`, reqErr);
      }
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (!registration.success) {
      console.error('[Notifications]: Backend token registration failed after retries:', registration.error || 'Unknown error');
      return null;
    }

    console.log('[Notifications]: Push token registered successfully with backend.');
    lastPushRegistrationSucceeded = true;
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
    await configureAndroidChannels();
    if (!await ensureNotificationPermission()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Login successful 🎉',
        body: `You've logged in successfully, ${userName}. Explore PDFs and community chat.`,
        sound: 'default',
        data: { screen: 'home', channelId: 'login_success' }
      },
      trigger: { channelId: LOGIN_NOTIFICATION_CHANNEL_ID }
    });
  } catch (error) {
    console.warn('[Notifications]: Could not show login success notification:', error);
  }
}

export async function scheduleLocalMissedMessagesNotification(
  senderName: string,
  messageText: string,
  screen: 'community' | 'chat' = 'community',
  conversationId?: string
) {
  if (Platform.OS === 'web') {
    sendWebBrowserNotification(`💬 ${senderName}`, messageText);
    return;
  }

  try {
    await configureAndroidChannels();
    if (!await ensureNotificationPermission()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💬 ${senderName}`,
        body: messageText,
        sound: 'default',
        data: {
          screen,
          channelId: screen === 'community' ? 'community_chat' : 'chat_message',
          conversationId
        }
      },
      trigger: {
        channelId: screen === 'community' ? COMMUNITY_NOTIFICATION_CHANNEL_ID : GENERAL_NOTIFICATION_CHANNEL_ID
      }
    });
  } catch (error) {
    console.warn('[Notifications]: Could not schedule local notification:', error);
  }
}
export function setupNotificationResponseListener(onNavigate: (screenPath: string) => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    return () => {};
  }

  // Handle app cold-start launch when student taps a push notification while app was completely closed
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response?.notification) {
        const data = response.notification.request.content.data;
        if (data && (data.screen === 'community' || data.channelId === 'community_chat')) {
          void handleCommunityNotificationAction(response);
          onNavigate('/(tabs)/messages');
        } else if (data && data.screen === 'chat' && data.conversationId) {
          onNavigate(`/chat/${data.conversationId}`);
        }
      }
    })
    .catch(() => {});

  // Handle taps while app is running or in background
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data && (data.screen === 'community' || data.channelId === 'community_chat')) {
      void handleCommunityNotificationAction(response);
      onNavigate('/(tabs)/messages');
    } else if (data && data.screen === 'chat' && data.conversationId) {
      onNavigate(`/chat/${data.conversationId}`);
    }
  });

  return () => {
    subscription.remove();
  };
}

async function handleCommunityNotificationAction(response: Notifications.NotificationResponse) {
  const action = response.actionIdentifier;
  if (action === Notifications.DEFAULT_ACTION_IDENTIFIER) return;

  const data = response.notification.request.content.data as any;
  const messageId = data?.messageId ? String(data.messageId) : '';
  try {
    if (action === 'mark_read' && messageId) {
      await apiRequest(`/community/messages/${encodeURIComponent(messageId)}/read`, { method: 'POST' });
      return;
    }

    if (action === 'reply' && response.userText?.trim()) {
      await apiRequest('/community/messages', {
        method: 'POST',
        body: JSON.stringify({
          text: response.userText.trim(),
          replyTo: messageId ? {
            id: messageId,
            senderName: data?.senderName || 'Student',
            text: data?.messagePreview || ''
          } : undefined
        })
      });
    }
  } catch (error) {
    console.warn('[Notifications]: Message action failed:', error);
  }
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
