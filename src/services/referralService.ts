import { Platform } from 'react-native';
import { apiRequest, getStoredToken, removeStoredToken, setStoredToken } from './api';

const PENDING_REFERRAL_CODE_KEY = 'mconnect_pending_referral_code_v1';
const PLAY_REFERRER_CHECKED_KEY = 'mconnect_play_referrer_checked_v1';

export interface ReferralSummary {
  referralCode: string;
  shareUrl: string;
  successfulReferrals: number;
  rewardPointsPerReferral: number;
  points: number;
  googlePlayUrl: string;
}

export const normalizeReferralCode = (value?: string | null): string =>
  String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);

export const getPendingReferralCode = async (): Promise<string> =>
  normalizeReferralCode(await getStoredToken(PENDING_REFERRAL_CODE_KEY));

export const savePendingReferralCode = async (value: string): Promise<void> => {
  const code = normalizeReferralCode(value);
  if (code) await setStoredToken(PENDING_REFERRAL_CODE_KEY, code);
  else await removeStoredToken(PENDING_REFERRAL_CODE_KEY);
};

export const clearPendingReferralCode = async (): Promise<void> => {
  await removeStoredToken(PENDING_REFERRAL_CODE_KEY);
};

export const capturePlayInstallReferral = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  if (await getStoredToken(PLAY_REFERRER_CHECKED_KEY)) return;

  try {
    const { PlayInstallReferrer } = require('react-native-play-install-referrer');
    PlayInstallReferrer.getInstallReferrerInfo(async (details: { installReferrer?: string } | null, error: unknown) => {
      if (error) return;
      const rawReferrer = details?.installReferrer || '';
      const params = new URLSearchParams(rawReferrer);
      const code = normalizeReferralCode(params.get('referral_code'));
      if (code) await savePendingReferralCode(code);
      await setStoredToken(PLAY_REFERRER_CHECKED_KEY, '1');
    });
  } catch (error) {
    // Expo Go and devices without Google Play do not include this native service.
    console.info('[Referrals] Play Install Referrer is unavailable on this build.', error);
  }
};

export const fetchReferralSummary = async (): Promise<ReferralSummary | null> => {
  const response = await apiRequest<ReferralSummary>('/referrals/me', { method: 'GET' });
  return response.success && response.data ? response.data : null;
};
