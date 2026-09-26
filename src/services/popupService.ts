import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from './api';
import { IUser } from '@moi/shared';

const DISMISSED_POPUPS_KEY = 'moi_dismissed_popup_ids';

const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

export const getDismissedPopupIds = async (): Promise<string[]> => {
  try {
    const raw = await getItem(DISMISSED_POPUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveDismissedPopupId = async (popupId: string): Promise<void> => {
  try {
    const existing = await getDismissedPopupIds();
    if (!existing.includes(popupId)) {
      existing.push(popupId);
      await setItem(DISMISSED_POPUPS_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    // Ignore storage errors
  }
};

export function parseMagicVariables(
  text?: string,
  user?: IUser | null,
  studentCourse?: string
): string {
  if (!text) return '';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const course = studentCourse || 'Course';

  return text
    .replace(/\{name\}/gi, firstName)
    .replace(/\{course\}/gi, course);
}

export interface PopupAction {
  label: string;
  target: string;
  type: 'in_app' | 'external';
}

export interface ClientPopupResponse {
  hasPopup: boolean;
  type?: 'normal' | 'update';
  popup?: {
    _id: string;
    popupId: string;
    type: 'normal' | 'update';
    title: string;
    subtitle?: string;
    body?: string;
    imageUrl?: string;
    hasCancelButton?: boolean;
    actionTarget?: string;
    actionButtonText?: string;
    actions?: PopupAction[];
    minAppVersion?: string;
    playStoreUrl?: string;
    isForceUpdate?: boolean;
  };
}

export const checkAppPopups = async (
  currentVersion: string = '1.0.6',
  user?: IUser | null,
  studentCourse?: string
): Promise<ClientPopupResponse> => {
  try {
    const dismissedIds = await getDismissedPopupIds();
    const res = await apiRequest<ClientPopupResponse>('/notify/check-popup', {
      method: 'POST',
      body: JSON.stringify({
        version: currentVersion,
        email: user?.email || '',
        dismissedIds
      })
    });

    if (res.success && res.data && res.data.hasPopup && res.data.popup) {
      const p = res.data.popup;
      return {
        hasPopup: true,
        type: res.data.type || p.type,
        popup: {
          ...p,
          title: parseMagicVariables(p.title, user, studentCourse),
          subtitle: parseMagicVariables(p.subtitle, user, studentCourse),
          body: parseMagicVariables(p.body, user, studentCourse)
        }
      };
    }
    return { hasPopup: false };
  } catch (e) {
    return { hasPopup: false };
  }
};
