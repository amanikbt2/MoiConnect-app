import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CloseIcon, SparklesIcon, StarIcon } from './Icons';

interface RewardMilestone {
  pts: number;
  labelPts: string;
  rewardKsh: string;
}

const REWARD_MILESTONES: RewardMilestone[] = [
  { pts: 6, labelPts: '6+ pts', rewardKsh: 'Ksh 5' },
  { pts: 8, labelPts: '8+ pts', rewardKsh: 'Ksh 1' },
  { pts: 10, labelPts: '10+ pts', rewardKsh: 'Ksh 1' },
  { pts: 100, labelPts: '100+ pts', rewardKsh: 'Ksh 450' },
  { pts: 1000, labelPts: '1000+ pts', rewardKsh: 'Ksh 2,500' }
];

interface StudentRewardsModalProps {
  visible?: boolean;
  onClose?: () => void;
}

export function StudentRewardsModal({ visible = false, onClose }: StudentRewardsModalProps) {
  const { userPoints } = useAuth();

  // Calculate overall progress percentage for the progress line
  // Find which step user is at
  let currentStepIndex = -1;
  for (let i = 0; i < REWARD_MILESTONES.length; i++) {
    if (userPoints >= REWARD_MILESTONES[i].pts) {
      currentStepIndex = i;
    }
  }

  // Next milestone calculation
  const nextMilestone = REWARD_MILESTONES.find(m => userPoints < m.pts);

  // Line progress percentage across the 5 nodes (0% to 100%)
  let progressPercent = 0;
  if (currentStepIndex >= 0) {
    if (currentStepIndex === REWARD_MILESTONES.length - 1) {
      progressPercent = 100;
    } else {
      const currentPts = REWARD_MILESTONES[currentStepIndex].pts;
      const nextPts = REWARD_MILESTONES[currentStepIndex + 1].pts;
      const stepProgress = Math.min(1, Math.max(0, (userPoints - currentPts) / (nextPts - currentPts)));
      progressPercent = ((currentStepIndex + stepProgress) / (REWARD_MILESTONES.length - 1)) * 100;
    }
  } else {
    // Before first node (0 to 6 pts)
    progressPercent = Math.min(1, userPoints / REWARD_MILESTONES[0].pts) * (100 / (REWARD_MILESTONES.length - 1)) * 0.5;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button Header */}
          <View style={styles.topCloseRow}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <CloseIcon color="#64748b" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Round Icon & Titles */}
            <View style={styles.headerSection}>
              <View style={styles.starCircle}>
                <Text style={{ fontSize: 24 }}>🌟</Text>
              </View>
              <Text style={styles.mainTitle}>Student Rewards</Text>
              <Text style={styles.subTitle}>MoiConnect Points System</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceHeader}>YOUR POINTS</Text>
              <Text style={styles.balanceAmount}>{userPoints} pts</Text>
              <Text style={styles.balanceSub}>Earn points by contributing study materials!</Text>
            </View>

            {/* Progress Section Container */}
            <View style={styles.progressContainerCard}>
              <Text style={styles.progressCardSub}>
                {nextMilestone
                  ? `Reach ${nextMilestone.labelPts} to unlock ${nextMilestone.rewardKsh}`
                  : '🎉 Max level reached! You unlocked all top rewards!'}
              </Text>

              {/* Step Progress Line Component */}
              <View style={styles.milestoneTracker}>
                {/* Connecting Bar */}
                <View style={styles.trackLineBackground}>
                  <View style={[styles.trackLineFill, { width: `${progressPercent}%` }]} />
                </View>

                {/* Nodes & Labels */}
                <View style={styles.nodesRow}>
                  {REWARD_MILESTONES.map((item, index) => {
                    const isReached = userPoints >= item.pts;
                    const isNext = nextMilestone?.pts === item.pts;

                    return (
                      <View key={item.pts} style={styles.nodeColumn}>
                        {/* Top Label: Points */}
                        <Text style={[styles.ptsTopLabel, isReached ? styles.textActive : styles.textInactive]}>
                          {item.labelPts}
                        </Text>

                        {/* Node Circle */}
                        <View
                          style={[
                            styles.nodeDot,
                            isReached
                              ? styles.nodeDotReached
                              : isNext
                              ? styles.nodeDotNext
                              : styles.nodeDotInactive
                          ]}
                        >
                          {isReached ? (
                            <Text style={styles.checkmarkText}>✓</Text>
                          ) : (
                            <View style={isNext ? styles.innerNextDot : null} />
                          )}
                        </View>

                        {/* Bottom Label: Reward Money */}
                        <Text style={[styles.kshBottomLabel, isReached ? styles.kshActive : styles.kshInactive]}>
                          {item.rewardKsh}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* How to earn points info footer */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 How points work</Text>
              <Text style={styles.infoBody}>
                • <Text style={{ fontWeight: '700' }}>+5 pts</Text> bonus upon registration.{'\n'}
                • <Text style={{ fontWeight: '700' }}>+10 pts</Text> for uploading verified past papers or CAT notes.{'\n'}
                • Points build up your campus status and unlock student reward tiers!
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function PointsHeaderButton() {
  const { userPoints } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.pointsBadgeBtn}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.pointsBadgeStar}>🌟</Text>
        <Text style={styles.pointsBadgeText}>{userPoints} pts</Text>
      </TouchableOpacity>

      <StudentRewardsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pointsBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pointsBadgeStar: {
    fontSize: 12,
  },
  pointsBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  topCloseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 14,
    paddingBottom: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  starCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 2,
  },
  balanceCard: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 18,
  },
  balanceHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#15803d',
    marginBottom: 4,
  },
  balanceSub: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainerCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  progressCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressCardSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 20,
  },
  milestoneTracker: {
    position: 'relative',
    paddingVertical: 10,
    marginBottom: 8,
  },
  trackLineBackground: {
    position: 'absolute',
    top: 36,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    zIndex: 1,
  },
  trackLineFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 2,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 58,
  },
  ptsTopLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  textActive: {
    color: '#15803d',
  },
  textInactive: {
    color: '#94a3b8',
  },
  nodeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  nodeDotReached: {
    backgroundColor: '#16a34a',
    borderColor: '#15803d',
  },
  nodeDotNext: {
    backgroundColor: '#ffffff',
    borderColor: '#16a34a',
  },
  nodeDotInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  innerNextDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  kshBottomLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
  },
  kshActive: {
    color: '#15803d',
  },
  kshInactive: {
    color: '#64748b',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 18,
  },
});
