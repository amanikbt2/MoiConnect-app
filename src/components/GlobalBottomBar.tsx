import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, DownloadIcon } from './Icons';

export interface GlobalBottomBarProps {
  currentRoute?: string;
  onNavigate?: (tabName: 'Home' | 'Downloads' | 'Community') => void;
}

export function GlobalBottomBar({ currentRoute = 'HomeTab', onNavigate }: GlobalBottomBarProps) {
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const handlePress = (tab: 'Home' | 'Downloads' | 'Community') => {
    if (tab === 'Community') {
      setUnreadCount(0);
    }
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const containerPaddingBottom = Math.max(bottomInset, Platform.OS === 'ios' ? 14 : 6);

  return (
    <View style={[styles.container, { paddingBottom: containerPaddingBottom }]}>
      {/* 1. Home Tab */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => handlePress('Home')}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <HomeIcon color={isHomeActive ? '#15803d' : '#64748b'} size={22} />
        </View>
        <Text style={[styles.tabLabel, isHomeActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
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
        <Text style={[styles.tabLabel, isDownloadsActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
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
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, isCommunityActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
          Community
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 9999,
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
    width: 26,
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
});
