import { apiRequest } from './api';

let cachedShowDemo: boolean | null = null;
let cachedAllowCommunityChat: boolean | null = null;

export const getShowDemoMaterialsSetting = async (): Promise<boolean> => {
  try {
    // The /settings endpoint returns { success, settings: { showDemoMaterials } }
    // apiRequest returns the raw JSON, so we cast to any to read it safely
    const res: any = await apiRequest('/settings');
    const showDemo: boolean | undefined =
      res?.settings?.showDemoMaterials ??
      res?.data?.settings?.showDemoMaterials ??
      res?.showDemoMaterials;
    if (typeof showDemo === 'boolean') {
      cachedShowDemo = showDemo;
      return showDemo;
    }
  } catch (err) {
    console.log('Error fetching app settings:', err);
  }
  // Fail closed: demo content must never reappear when the setting cannot be verified.
  return false;
};

export const getAllowCommunityChatSetting = async (): Promise<boolean> => {
  try {
    const res: any = await apiRequest('/settings');
    const allowChat: boolean | undefined =
      res?.settings?.allowCommunityChat ??
      res?.data?.settings?.allowCommunityChat ??
      res?.allowCommunityChat;
    if (typeof allowChat === 'boolean') {
      cachedAllowCommunityChat = allowChat;
      return allowChat;
    }
  } catch (err) {
    console.log('Error fetching community chat setting:', err);
  }
  return cachedAllowCommunityChat ?? true;
};
