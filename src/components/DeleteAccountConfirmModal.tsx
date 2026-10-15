import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { AlertTriangleIcon, TrashIcon } from './Icons';
import { apiRequest } from '../services/api';
import { showIceMessage } from './IceMessageCard';

interface DeleteAccountConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  userId?: string;
  userName?: string;
  userEmail?: string;
  isDeleting?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 390);

const DELETION_REASONS = [
  { id: 'found_bug_or_issue', label: 'Encountered bugs or technical issues' },
  { id: 'privacy_concerns', label: 'Privacy or personal data concerns' },
  { id: 'difficult_to_use', label: 'Difficulty using the application' },
  { id: 'no_longer_student', label: 'Graduated / No longer need campus services' },
  { id: 'other', label: 'Other Reason' }
];

export const DeleteAccountConfirmModal: React.FC<DeleteAccountConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  userId,
  userName = 'your account',
  userEmail,
  isDeleting = false
}) => {
  const [showReportView, setShowReportView] = useState(false);
  const [reportReason, setReportReason] = useState<string>('found_bug_or_issue');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  if (!visible) return null;

  const handleClose = () => {
    if (isDeleting || isSubmittingReport) return;
    setShowReportView(false);
    setReportDetails('');
    onClose();
  };

  const handleSubmitDeletionFeedback = async () => {
    setIsSubmittingReport(true);
    try {
      const selectedItem = DELETION_REASONS.find((r) => r.id === reportReason);
      const reasonLabel = selectedItem ? selectedItem.label : reportReason;

      const res = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'account_deletion',
          targetId: userId || 'account_deletion',
          reason: reasonLabel,
          details: reportDetails.trim() || `Account deletion feedback from ${userName}${userEmail ? ` (${userEmail})` : ''}`
        })
      });

      setIsSubmittingReport(false);
      if (res && res.success) {
        showIceMessage(
          'Feedback Submitted 🚩',
          'Thank you! Your feedback has been sent directly to the admin team.'
        );
        setShowReportView(false);
        setReportDetails('');
      } else {
        showIceMessage('Submission Failed', res?.error || 'Could not submit feedback.');
      }
    } catch (err: any) {
      setIsSubmittingReport(false);
      showIceMessage('Submission Error', err?.message || 'Could not submit feedback. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isDeleting ? undefined : handleClose}
    >
      <Pressable style={styles.overlay} onPress={isDeleting || isSubmittingReport ? undefined : handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              style={styles.scrollArea}
            >
              {showReportView ? (
                /* Report / Feedback View (Reused Report Card UI) */
                <View style={styles.reportContainer}>
                  <Text style={styles.reportTitle}>🚩 Report Deletion Reason</Text>
                  <Text style={styles.reportSubtitle}>
                    Help us understand why you are leaving. Your feedback is sent directly to the admin team.
                  </Text>

                  {DELETION_REASONS.map((item) => {
                    const isSelected = reportReason === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.reportReasonRow, isSelected && styles.reportReasonRowSelected]}
                        onPress={() => setReportReason(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.reportReasonText}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TextInput
                    style={styles.reportDetailsInput}
                    placeholder="Provide optional additional details for the admin..."
                    placeholderTextColor="#94a3b8"
                    value={reportDetails}
                    onChangeText={setReportDetails}
                    multiline
                  />
                </View>
              ) : (
                /* Default Delete Confirmation View */
                <View style={styles.defaultContainer}>
                  {/* Centered Warning Icon Circle */}
                  <View style={styles.iconCircle}>
                    <AlertTriangleIcon color="#dc2626" size={24} />
                  </View>

                  {/* Title */}
                  <Text style={styles.title}>Permanently Delete Account?</Text>

                  {/* Subtitle / User identity */}
                  <Text style={styles.leadText}>
                    Are you sure you want to permanently delete{' '}
                    <Text style={styles.boldText}>{userName}</Text>
                    {userEmail ? `\n(${userEmail})` : ''}?
                  </Text>

                  {/* Main Description */}
                  <Text style={styles.bodyText}>
                    This will permanently erase your profile and credentials from the system. You will be logged out immediately.
                  </Text>

                  {/* Preservation & Local Wipe Note */}
                  <View style={styles.preservationBadge}>
                    <Text style={styles.preservationText}>
                      ✓ All locally stored messages, downloaded materials, search history, and caches on this device will be completely erased.
                    </Text>
                  </View>

                  {/* Warning */}
                  <Text style={styles.warningText}>This action cannot be undone.</Text>

                  {/* Report an Issue Link */}
                  <TouchableOpacity
                    style={styles.reportIssueLink}
                    onPress={() => setShowReportView(true)}
                    activeOpacity={0.7}
                    disabled={isDeleting}
                  >
                    <Text style={styles.reportIssueLinkText}>
                      Facing an issue? <Text style={styles.reportIssueLinkHighlight}>Report an issue / Give feedback</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Pinned Action Buttons Footer - Always 100% visible */}
            <View style={styles.footerContainer}>
              {showReportView ? (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setShowReportView(false);
                      setReportDetails('');
                    }}
                    disabled={isSubmittingReport}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteBtn, isSubmittingReport && styles.deleteBtnDisabled]}
                    onPress={handleSubmitDeletionFeedback}
                    disabled={isSubmittingReport}
                    activeOpacity={0.8}
                  >
                    {isSubmittingReport ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.deleteBtnText}>Submit Feedback</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.75}
                    onPress={handleClose}
                    disabled={isDeleting}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={onConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                    ) : (
                      <TrashIcon color="#ffffff" size={14} style={{ marginRight: 6 }} />
                    )}
                    <Text style={styles.deleteBtnText}>
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Pressable>
        </KeyboardAvoidingView>
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
    padding: 14
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: MODAL_WIDTH,
    maxHeight: Math.min(SCREEN_HEIGHT * 0.86, 560),
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderTopWidth: 4,
    borderTopColor: '#dc2626',
    ...((Platform.OS === 'web' ? { boxShadow: '0px 10px 30px rgba(15, 23, 42, 0.22)' } : {}) as any),
    elevation: 10,
    overflow: 'hidden'
  },
  scrollArea: {
    flexShrink: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10
  },
  defaultContainer: {
    alignItems: 'center',
    width: '100%'
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6
  },
  leadText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 8,
    paddingHorizontal: 4
  },
  boldText: {
    fontWeight: '800',
    color: '#0f172a'
  },
  bodyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
    paddingHorizontal: 4
  },
  preservationBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
    width: '100%'
  },
  preservationText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15
  },
  warningText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 8
  },
  reportIssueLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 6
  },
  reportIssueLinkText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
  },
  reportIssueLinkHighlight: {
    color: '#0284c7',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  footerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff'
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%'
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13
  },
  deleteBtn: {
    flex: 1.2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...((Platform.OS === 'web' ? { boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)' } : {}) as any),
    elevation: 3
  },
  deleteBtnDisabled: {
    opacity: 0.7
  },
  deleteBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  /* Reused Report Form Styles */
  reportContainer: {
    width: '100%'
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12
  },
  reportReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
    backgroundColor: '#ffffff'
  },
  reportReasonRowSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fff1f2'
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleSelected: {
    borderColor: '#ef4444'
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444'
  },
  reportReasonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b'
  },
  reportDetailsInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#0f172a',
    minHeight: 56,
    maxHeight: 76,
    marginTop: 6,
    marginBottom: 8,
    textAlignVertical: 'top'
  }
});
