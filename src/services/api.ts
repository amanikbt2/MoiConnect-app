import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { config } from '../config';

const ACCESS_TOKEN_KEY = 'moi_access_token';
const REFRESH_TOKEN_KEY = 'moi_refresh_token';

// Storage helpers with web fallback
export const getStoredToken = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

export const setStoredToken = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

export const removeStoredToken = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export const saveAuthTokens = async (accessToken: string, refreshToken: string) => {
  await setStoredToken(ACCESS_TOKEN_KEY, accessToken);
  await setStoredToken(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuthTokens = async () => {
  await removeStoredToken(ACCESS_TOKEN_KEY);
  await removeStoredToken(REFRESH_TOKEN_KEY);
  await removeStoredToken('moi_user_profile');
  await removeStoredToken('moi_student_profile_details');
  await removeStoredToken('moi_cached_chat_messages');
  await removeStoredToken('moi_offline_booking_queue');
  await removeStoredToken('moi_offline_msg_queue');
  await removeStoredToken('moi_unread_download_badge');
  await removeStoredToken('moi_read_notification_ids');
  await removeStoredToken('moi_community_messages_cache');
  await removeStoredToken('moi_community_read_mention_ids');
  await removeStoredToken('moi_community_deleted_for_me_ids');
  await removeStoredToken('moi_community_last_read_id');
  await removeStoredToken('moi_community_sync_cursor');
  await removeStoredToken('moi_community_reactor_id');
  await removeStoredToken('moi_community_mention_directory_v1');
  await removeStoredToken('moi_offline_papers');
  await removeStoredToken('moi_material_search_history');
  await removeStoredToken('moi_cached_rentals_list');
  await removeStoredToken('moi_cached_house_details');
  await removeStoredToken('moi_dismissed_popup_ids');
  await removeStoredToken('moi_tts_preferences');
};

const inFlightGetRequests = new Map<string, Promise<any>>();

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; pagination?: any }> {
  const method = (options.method || 'GET').toUpperCase();

  // Deduplicate identical in-flight GET requests within 800ms
  if (method === 'GET' && inFlightGetRequests.has(endpoint)) {
    return inFlightGetRequests.get(endpoint)!;
  }

  const requestPromise = (async () => {
    let token = await getStoredToken(ACCESS_TOKEN_KEY);

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string> || {})
    };

    if (isFormData && headers['Content-Type'] === 'application/json') {
      delete headers['Content-Type'];
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(`${config.apiUrl}${endpoint}`, {
        ...options,
        headers
      });

      // Attempt token refresh on 401 Unauthorized
      if (response.status === 401 && token) {
        const refreshToken = await getStoredToken(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const refreshRes = await fetch(`${config.apiUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.success && refreshData.data?.tokens) {
              await saveAuthTokens(
                refreshData.data.tokens.accessToken,
                refreshData.data.tokens.refreshToken
              );
              headers['Authorization'] = `Bearer ${refreshData.data.tokens.accessToken}`;
              response = await fetch(`${config.apiUrl}${endpoint}`, {
                ...options,
                headers
              });
            }
          } else {
            await clearAuthTokens();
          }
        }
      }

      const json = await response.json();
      if (!response.ok) {
        return { success: false, error: json.error || 'Request failed' };
      }
      return json;
    } catch (error: any) {
      return { success: false, error: error.message || 'Network connection failed' };
    }
  })();

  if (method === 'GET') {
    inFlightGetRequests.set(endpoint, requestPromise);
    setTimeout(() => {
      if (inFlightGetRequests.get(endpoint) === requestPromise) {
        inFlightGetRequests.delete(endpoint);
      }
    }, 800);
  }

  return requestPromise;
}
