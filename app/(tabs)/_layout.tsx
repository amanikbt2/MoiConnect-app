import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, Alert, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { HomeIcon, DownloadIcon, MessageIcon, ProfileIcon, CommunityIcon, MoreVerticalIcon, TrashIcon } from '../../src/components/Icons';
import { NotificationCenterModal } from '../../src/components/NotificationCenterModal';
import { useAuth } from '../../src/context/AuthContext';
import {
  subscribeToUnreadCountUpdates,
  getStoredCommunityMessages,
  saveLastReadCommunityMsgId
} from '../../src/services/offlineStorage';

function HomeHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.2,
          textShadowColor: 'rgba(0, 0, 0, 0.65)',
          textShadowOffset: { width: 0, height: 1.5 },
          textShadowRadius: 3,
        }}
      >
        <Text style={{ color: '#ffffff' }}>Moi</Text>
        <Text style={{ color: '#a7f3d0' }}>Connect</Text>
      </Text>
    </View>
  );
}

function DownloadsHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.2,
          textShadowColor: 'rgba(0, 0, 0, 0.65)',
          textShadowOffset: { width: 0, height: 1.5 },
          textShadowRadius: 3,
        }}
      >
        <Text style={{ color: '#ffffff' }}>Down</Text>
        <Text style={{ color: '#a7f3d0' }}>loads</Text>
      </Text>
    </View>
  );
}

function NotesPdfHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.2,
          textShadowColor: 'rgba(0, 0, 0, 0.65)',
          textShadowOffset: { width: 0, height: 1.5 },
          textShadowRadius: 3,
        }}
      >
        <Text style={{ color: '#ffffff' }}>Notes </Text>
        <Text style={{ color: '#a7f3d0' }}>PDF</Text>
      </Text>
    </View>
  );
}

function RentalsHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.2,
          textShadowColor: 'rgba(0, 0, 0, 0.65)',
          textShadowOffset: { width: 0, height: 1.5 },
          textShadowRadius: 3,
        }}
      >
        <Text style={{ color: '#ffffff' }}>Students </Text>
        <Text style={{ color: '#a7f3d0' }}>Rentals</Text>
      </Text>
    </View>
  );
}

function ProfileHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.2,
          textShadowColor: 'rgba(0, 0, 0, 0.65)',
          textShadowOffset: { width: 0, height: 1.5 },
          textShadowRadius: 3,
        }}
      >
        <Text style={{ color: '#ffffff' }}>Student </Text>
        <Text style={{ color: '#a7f3d0' }}>Profile</Text>
      </Text>
    </View>
  );
}

function ProfileHeaderActions() {
  const { logout, deleteAccount } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const confirmDeleteAccount = () => {
    setMenuVisible(false);
    Alert.alert(
      'Permanently Delete Account?',
      'This permanently deletes your profile, posts, uploaded materials, and personal data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: () => deleteAccount() }
      ]
    );
  };

  return (
    <View style={profileHeaderStyles.container}>
      <NotificationCenterModal />
      <TouchableOpacity
        style={profileHeaderStyles.moreButton}
        onPress={() => setMenuVisible(true)}
        accessibilityLabel="Account actions"
        accessibilityRole="button"
      >
        <MoreVerticalIcon color="#ffffff" size={22} />
      </TouchableOpacity>
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={profileHeaderStyles.backdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={profileHeaderStyles.menu} onPress={(event) => event.stopPropagation()}>
            <TouchableOpacity style={profileHeaderStyles.menuRow} onPress={() => { setMenuVisible(false); logout(); }}>
              <Text style={profileHeaderStyles.menuText}>Log out</Text>
            </TouchableOpacity>
            <View style={profileHeaderStyles.divider} />
            <TouchableOpacity style={profileHeaderStyles.menuRow} onPress={confirmDeleteAccount}>
              <TrashIcon color="#dc2626" size={16} />
              <Text style={profileHeaderStyles.deleteText}>Delete account</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const profileHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 10
  },
  moreButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)'
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.18)'
  },
  menu: {
    position: 'absolute',
    top: 58,
    right: 12,
    width: 190,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8
  },
  menuRow: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9
  },
  menuText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700'
  },
  deleteText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800'
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 10
  }
});
export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = subscribeToUnreadCountUpdates((count) => {
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#15803d' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        headerRight: () => (
          <View style={{ marginRight: 14 }}>
            <NotificationCenterModal />
          </View>
        ),
        tabBarActiveTintColor: '#15803d',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { display: 'none' }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => <HomeHeaderTitle />,
          tabBarIcon: ({ color }: { color: string }) => <HomeIcon color={color} size={22} />
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          href: null,
          headerTitle: () => <NotesPdfHeaderTitle />,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          headerTitle: () => <DownloadsHeaderTitle />,
          tabBarIcon: ({ color }: { color: string }) => <DownloadIcon color={color} size={22} />
        }}
      />
      <Tabs.Screen
        name="rentals"
        options={{
          href: null,
          headerTitle: () => <RentalsHeaderTitle />,
        }}
      />
      <Tabs.Screen
        name="messages"
        listeners={{
          tabPress: () => {
            getStoredCommunityMessages().then((msgs) => {
              if (msgs && msgs.length > 0) {
                const latestId = msgs[msgs.length - 1].id || msgs[msgs.length - 1]._id;
                if (latestId) saveLastReadCommunityMsgId(latestId);
              }
            });
          }
        }}
        options={{
          title: 'Community',
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: '900',
            lineHeight: 15,
            marginTop: -2
          },
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <Image
              source={require('../../assets/splash-icon.png')}
              style={{
                width: 24,
                height: 24,
                opacity: focused ? 1 : 0.55
              }}
              resizeMode="contain"
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerTitle: () => <ProfileHeaderTitle />,
          headerRight: () => <ProfileHeaderActions />,
        }}
      />
    </Tabs>
  );
}
