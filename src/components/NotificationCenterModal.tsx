import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { apiRequest } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import {
  BellIcon,
  AcademicCapIcon,
  HouseIcon,
  AlertTriangleIcon,
  CloseIcon
} from './Icons';

export interface INotificationItem {
  _id: string;
  title: string;
  subtitle?: string;
  body: string;
  icon: 'bell' | 'academic' | 'house' | 'alert';
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenterModal() {
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Register device push token on app start
    registerForPushNotificationsAsync();
    fetchNotifications();

    // Refresh notification count periodically without interrupting app speed
    const interval = setInterval(() => {
      fetchNotificationsSilently();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{
        success: boolean;
        unreadCount: number;
        notifications: INotificationItem[];
      }>('/notifications', 'GET');

      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.log('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationsSilently = async () => {
    try {
      const res = await apiRequest<{
        success: boolean;
        unreadCount: number;
        notifications: INotificationItem[];
      }>('/notifications', 'GET');

      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, 'POST');
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const renderMonochromeIcon = (iconName: string) => {
    switch (iconName) {
      case 'academic':
        return <AcademicCapIcon color="#15803d" size={20} />;
      case 'house':
        return <HouseIcon color="#15803d" size={20} />;
      case 'alert':
        return <AlertTriangleIcon color="#d97706" size={20} />;
      default:
        return <BellIcon color="#15803d" size={20} />;
    }
  };

  return (
    <>
      {/* Bell Icon Trigger with Unread Badge */}
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => {
          setModalVisible(true);
          fetchNotifications();
        }}
        activeOpacity={0.7}
      >
        <BellIcon color="#0f172a" size={22} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification Center Modal Drawer */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleRow}>
                <BellIcon color="#15803d" size={22} />
                <Text style={styles.modalTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.headerCountBadge}>
                    <Text style={styles.headerCountText}>{unreadCount} new</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <CloseIcon color="#ef4444" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              {loading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator color="#15803d" size="large" />
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <BellIcon color="#94a3b8" size={36} />
                  <Text style={styles.emptyTitle}>No Notifications Yet</Text>
                  <Text style={styles.emptySub}>Official updates and campus notifications will appear here.</Text>
                </View>
              ) : (
                notifications.map(item => (
                  <TouchableOpacity
                    key={item._id}
                    style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
                    onPress={() => handleMarkRead(item._id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.iconContainer}>
                      {renderMonochromeIcon(item.icon)}
                    </View>

                    <View style={styles.textContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                      </View>

                      {item.subtitle ? (
                        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                      ) : null}

                      <Text style={styles.cardBody}>{item.body}</Text>
                      <Text style={styles.cardTime}>
                        {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff'
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  headerCountBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  scrollContent: {
    padding: 16,
    gap: 12
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 8
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155'
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  unreadCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0'
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textContainer: {
    flex: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803d'
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 4
  },
  cardBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginBottom: 6
  },
  cardTime: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600'
  }
});
