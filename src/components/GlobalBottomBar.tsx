import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Keyboard,
  AppState,
  InteractionManager
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, DownloadIcon } from './Icons';
import {
  subscribeToUnreadSummaryUpdates,
  syncCommunityUnreadBackground
} from '../services/offlineStorage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export interface GlobalBottomBarProps {
  currentRoute?: string;
  onNavigate?: (tabName: 'Home' | 'Downloads' | 'Community') => void;
  onMentionNavigate?: () => void;
}

export function GlobalBottomBar({ currentRoute = 'HomeTab', onNavigate, onMentionNavigate }: GlobalBottomBarProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadMentions, setUnreadMentions] = useState<number>(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const unsubscribeSummary = subscribeToUnreadSummaryUpdates((summary) => {
      setUnreadCount(summary.general);
      setUnreadMentions(summary.mentions);
    }, user);

    let backgroundInterval: ReturnType<typeof setInterval> | undefined;
    let delayedSync: ReturnType<typeof setTimeout> | undefined;
    let interactionTask: { cancel?: () => void } | undefined;
    const onCommunityRoute = typeof currentRoute === 'string' && (
      currentRoute.toLowerCase().includes('message') || currentRoute.toLowerCase().includes('community')
    );
    const scheduleSilentSync = () => {
      if (!user || onCommunityRoute || AppState.currentState !== 'active') return;
      interactionTask = InteractionManager.runAfterInteractions(() => {
        delayedSync = setTimeout(() => {
          void syncCommunityUnreadBackground({ notify: true });
        }, 1200);
      }) as any;
    };
    if (user && !onCommunityRoute) {
      scheduleSilentSync();
      backgroundInterval = setInterval(scheduleSilentSync, 30000);
    }
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') scheduleSilentSync();
    });

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      unsubscribeSummary();
      showSub.remove();
      hideSub.remove();
      appStateSubscription.remove();
      if (backgroundInterval) clearInterval(backgroundInterval);
      if (delayedSync) clearTimeout(delayedSync);
      interactionTask?.cancel?.();
    };
  }, [user, currentRoute]);

  let bottomInset = 0;
  try {
    const insets = useSafeAreaInsets();
    bottomInset = insets?.bottom || 0;
  } catch {
    bottomInset = 0;
  }

  // Hide on modal authentication screens and live chat keyboards
  const HIDDEN_ROUTES = [
    'Login',
    'Register',
    'RequestLandlord',
    'ChatRoom',
    'MessagesTab',
    'Community',
    'AgentScreen',
    '/(auth)/login',
    '/(auth)/register',
    '/(auth)/request-landlord',
  ];

  if (isKeyboardVisible || (currentRoute && HIDDEN_ROUTES.includes(currentRoute))) {
    return null;
  }

  const isHomeActive =
    currentRoute === 'HomeTab' ||
    currentRoute === 'MainTabs' ||
    currentRoute === '/' ||
    currentRoute === '/(tabs)' ||
    currentRoute === '/(tabs)/index' ||
    !currentRoute;

  const isDownloadsActive =
    currentRoute === 'DownloadsTab' ||
    currentRoute === 'Downloads' ||
    (typeof currentRoute === 'string' && currentRoute.toLowerCase().includes('download'));

  const isCommunityActive =
    currentRoute === 'MessagesTab' ||
    currentRoute === 'Community' ||
    (typeof currentRoute === 'string' &&
      (currentRoute.toLowerCase().includes('message') || currentRoute.toLowerCase().includes('community')));

  const handlePress = async (tab: 'Home' | 'Downloads' | 'Community') => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const containerPaddingBottom = Math.max(bottomInset, Platform.OS === 'ios' ? 14 : 6);
  return (
    <View style={[styles.container, isDark && styles.darkContainer, { paddingBottom: containerPaddingBottom }]}>
      {/* 1. Home Tab */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => handlePress('Home')}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <HomeIcon color={isHomeActive ? '#15803d' : '#64748b'} size={22} />
        </View>
        <Text style={[styles.tabLabel, isHomeActive ? styles.tabLabelActive : (isDark ? styles.darkTabLabel : styles.tabLabelInactive)]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. Downloads Tab */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => handlePress('Downloads')}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <DownloadIcon color={isDownloadsActive ? '#15803d' : '#64748b'} size={22} />
        </View>
        <Text style={[styles.tabLabel, isDownloadsActive ? styles.tabLabelActive : (isDark ? styles.darkTabLabel : styles.tabLabelInactive)]}>
          Downloads
        </Text>
      </TouchableOpacity>

      {/* 3. Community Tab */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => handlePress('Community')}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <Image
            source={require('../../assets/splash-icon.png')}
            style={{
              width: 24,
              height: 24,
              opacity: isCommunityActive ? 1 : 0.55
            }}
            resizeMode="contain"
          />

          {unreadMentions > 0 ? (
            <>
              {/* Left Side: Mention Badge (@) */}
              <TouchableOpacity
                style={styles.mentionBadgeLeft}
                onPress={() => (onMentionNavigate ? onMentionNavigate() : handlePress('Community'))}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Jump to unread mention"
              >
                <Text style={styles.mentionBadgeLeftText}>
                  @{unreadMentions > 99 ? '99+' : unreadMentions}
                </Text>
              </TouchableOpacity>

              {/* Right Side: Total Unread Count Badge */}
              <View style={styles.countBadgeRight}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            </>
          ) : unreadCount > 0 ? (
            /* Center: Normal Red Unread Count Badge */
            <View style={styles.countBadgeCenter}>
              <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.tabLabel, isCommunityActive ? styles.tabLabelActive : (isDark ? styles.darkTabLabel : styles.tabLabelInactive)]}>
          Uni Forum
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    ...Platform.select({
      web: { boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4
      }
    }),
    elevation: 8,
    zIndex: 9999,
  },
  darkContainer: {
    backgroundColor: '#111827',
    borderTopColor: '#334155'
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    width: 32,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#15803d',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#64748b',
    fontWeight: '500',
  },
  darkTabLabel: {
    color: '#cbd5e1',
    fontWeight: '500',
  },
  mentionBadgeLeft: {
    position: 'absolute',
    top: -7,
    left: -12,
    backgroundColor: '#0f172a',
    borderRadius: 10,
     minWidth: 15,
     height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    zIndex: 2,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(245, 158, 11, 0.3)' },
      default: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2
      }
    }),
  },
  mentionBadgeLeftText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  countBadgeRight: {
    position: 'absolute',
    top: -7,
    right: -12,
    backgroundColor: '#ef4444',
     borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
     paddingHorizontal: 3,
     borderWidth: 1,
    borderColor: '#ffffff',
    zIndex: 2,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(239, 68, 68, 0.3)' },
      default: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2
      }
    }),
  },
  countBadgeCenter: {
    position: 'absolute',
    top: -7,
    alignSelf: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    zIndex: 2,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(239, 68, 68, 0.3)' },
      default: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2
      }
    }),
  },
  badgeText: {
    color: '#ffffff',
     fontSize: 8,
    fontWeight: '900',
     lineHeight: 9,
  },
});
