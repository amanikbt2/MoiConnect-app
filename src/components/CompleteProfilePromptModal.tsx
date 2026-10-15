import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform
} from 'react-native';
import { SparklesIcon, CloseIcon, ChevronRightIcon, CheckIcon, AcademicCapIcon } from './Icons';

interface CompleteProfilePromptModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 380);

export const CompleteProfilePromptModal: React.FC<CompleteProfilePromptModalProps> = ({
  visible,
  onClose,
  onComplete
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <CloseIcon color="#64748b" size={18} />
          </TouchableOpacity>

          {/* Glowing Icon Header */}
          <View style={styles.iconContainer}>
            <View style={styles.iconInner}>
              <SparklesIcon color="#15803d" size={28} />
            </View>
          </View>

          {/* Headline */}
          <Text style={styles.title}>Complete Your Profile</Text>

          {/* Prompt Message */}
          <Text style={styles.message}>
            Complete your profile to get more personalized revision materials, past papers, and CATs matched to your course and year.
          </Text>

          {/* Feature highlights */}
          <View style={styles.perksCard}>
            <View style={styles.perkRow}>
              <View style={styles.checkCircle}>
                <CheckIcon color="#15803d" size={13} />
              </View>
              <Text style={styles.perkText}>Past exam papers with unit & year matches</Text>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.checkCircle}>
                <CheckIcon color="#15803d" size={13} />
              </View>
              <Text style={styles.perkText}>CATs, quizzes & revision study notes</Text>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.checkCircle}>
                <CheckIcon color="#15803d" size={13} />
              </View>
              <Text style={styles.perkText}>Personalized home feed & smart search</Text>
            </View>
          </View>

          {/* Primary Action Button (Matches the suggested materials button) */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={onComplete}
          >
            <SparklesIcon color="#ffffff" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Complete Profile</Text>
            <ChevronRightIcon color="#ffffff" size={16} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Secondary Dismiss Button */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={styles.secondaryBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...((Platform.OS === 'web' ? { boxShadow: '0px 12px 32px rgba(15, 23, 42, 0.2)' } : {}) as any),
    elevation: 8
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...((Platform.OS === 'web' ? { boxShadow: '0px 4px 14px rgba(21, 128, 61, 0.15)' } : {}) as any),
    elevation: 2
  },
  iconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 6
  },
  perksCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  perkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    ...((Platform.OS === 'web' ? { boxShadow: '0px 4px 14px rgba(21, 128, 61, 0.35)' } : {}) as any),
    elevation: 3
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  secondaryBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600'
  }
});
