import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
  Dimensions,
  TextInput
} from 'react-native';
import { useAppNavigation } from '../utils/navigation';
import { saveDismissedPopupId, submitPopupResponse } from '../services/popupService';
import { CloseIcon, ChevronRightIcon, SparklesIcon, DownloadIcon } from './Icons';

export interface PopupItem {
  _id: string;
  popupId: string;
  type: 'normal' | 'update' | 'interactive';
  title: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  hasCancelButton?: boolean;
  actionTarget?: string;
  actionButtonText?: string;
  actions?: { label: string; target: string; type: 'in_app' | 'external' }[];
  inputs?: { id: string; label: string; type: 'text' | 'radio' | 'toggle' | 'checkbox'; required: boolean; options?: string[]; placeholder?: string }[];
  minAppVersion?: string;
  playStoreUrl?: string;
  isForceUpdate?: boolean;
}

interface InAppPopupModalProps {
  visible: boolean;
  popup: PopupItem | null;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.88, 380);

export const InAppPopupModal: React.FC<InAppPopupModalProps> = ({
  visible,
  popup,
  onClose
}) => {
  const [inputValues, setInputValues] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const router = useAppNavigation();

  useEffect(() => {
    setInputValues({});
    setSubmitting(false);
  }, [popup?.popupId]);

  if (!popup || !visible) return null;
  const isUpdateType = popup.type === 'update';

  const legacyAction = popup.actionTarget
    ? [{
        label: popup.actionButtonText || (isUpdateType ? 'Update via Google Play' : 'Explore Now'),
        target: popup.actionTarget,
        type: popup.actionTarget.startsWith('http://') || popup.actionTarget.startsWith('https://') ? 'external' as const : 'in_app' as const
      }]
    : [];
  const popupActions = isUpdateType
    ? [{
        label: 'Update via Google Play',
        target: popup.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.amanikbt1.moiconnect',
        type: 'external' as const
      }]
    : popup.actions?.length
      ? popup.actions
      : legacyAction;

  const handleAction = async (action: { target: string }) => {
    if (popup.popupId) {
      await saveDismissedPopupId(popup.popupId);
    }
    onClose();

    if (isUpdateType) {
      const url = popup.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.amanikbt1.moiconnect';
      Linking.openURL(url).catch(() => {});
      return;
    }

    if (action.target.startsWith('http://') || action.target.startsWith('https://')) {
      Linking.openURL(action.target).catch(() => {});
    } else {
      router.push(action.target);
    }
  };
  const handleInteractiveSubmit = async () => {
    if (!popup.inputs?.length || submitting) return;
    const missing = popup.inputs.find((input) => input.required && (inputValues[input.id] === undefined || inputValues[input.id] === ''));
    if (missing) return;
    setSubmitting(true);
    const result = await submitPopupResponse(popup.popupId, inputValues);
    setSubmitting(false);
    if (result.success) {
      await saveDismissedPopupId(popup.popupId);
      onClose();
    }
  };
  const handleDismiss = async () => {
    if (popup.popupId) {
      await saveDismissedPopupId(popup.popupId);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (!popup.isForceUpdate) {
          handleDismiss();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Header Banner Image */}
          {!!popup.imageUrl && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: popup.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            </View>
          )}

          {/* Dismiss button at top right */}
          {popup.hasCancelButton && !popup.isForceUpdate && (
            <TouchableOpacity style={styles.topCloseBtn} onPress={handleDismiss} activeOpacity={0.8}>
              <CloseIcon color="#64748b" size={18} />
            </TouchableOpacity>
          )}

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.cardBody}>
            {/* Type Tag */}
            <View style={styles.typeBadgeRow}>
              {isUpdateType ? (
                <View style={styles.updateBadge}>
                  <SparklesIcon color="#2563eb" size={12} />
                  <Text style={styles.updateBadgeText}>New App Update Available</Text>
                </View>
              ) : (
                <View style={styles.normalBadge}>
                  <Text style={styles.normalBadgeText}>MConnect Announcement</Text>
                </View>
              )}
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.titleText}>{popup.title}</Text>
            {!!popup.subtitle && <Text style={styles.subtitleText}>{popup.subtitle}</Text>}

            {/* Detailed Body */}
            {!!popup.body && (
              <View style={styles.bodyBox}>
                <Text style={styles.bodyText}>{popup.body}</Text>
              </View>
            )}

            {popup.type === 'interactive' && popup.inputs?.map((input) => (
              <View key={input.id} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{input.label}{input.required ? ' *' : ''}</Text>
                {input.type === 'text' && (
                  <TextInput
                    value={String(inputValues[input.id] || '')}
                    onChangeText={(value) => setInputValues((current) => ({ ...current, [input.id]: value }))}
                    placeholder={input.placeholder || 'Type your response'}
                    placeholderTextColor="#94a3b8"
                    style={styles.textInput}
                  />
                )}
                {input.type === 'radio' && (input.options || []).map((option) => (
                  <TouchableOpacity key={option} style={styles.choiceRow} onPress={() => setInputValues((current) => ({ ...current, [input.id]: option }))}>
                    <View style={[styles.choiceCircle, inputValues[input.id] === option && styles.choiceCircleSelected]} />
                    <Text style={styles.choiceText}>{option}</Text>
                  </TouchableOpacity>
                ))}
                {(input.type === 'toggle' || input.type === 'checkbox') && (
                  <TouchableOpacity style={styles.choiceRow} onPress={() => setInputValues((current) => ({ ...current, [input.id]: !current[input.id] }))}>
                    <View style={[styles.checkBox, Boolean(inputValues[input.id]) && styles.checkBoxSelected]}><Text style={styles.checkMark}>{inputValues[input.id] ? '✓' : ''}</Text></View>
                    <Text style={styles.choiceText}>{input.type === 'toggle' ? 'Yes' : 'Select this option'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {popup.type === 'interactive' && (
              <TouchableOpacity style={styles.mainActionBtn} onPress={handleInteractiveSubmit} activeOpacity={0.88} disabled={submitting}>
                <Text style={styles.mainActionText}>{submitting ? 'Submitting...' : 'Submit Response'}</Text>
                <ChevronRightIcon color="#ffffff" size={16} />
              </TouchableOpacity>
            )}
            {/* Smart Action Buttons */}
            {popupActions.map((action, index) => (
              <TouchableOpacity
                key={`${action.target}-${index}`}
                style={[styles.mainActionBtn, isUpdateType && styles.updateActionBtn]}
                onPress={() => handleAction(action)}
                activeOpacity={0.88}
              >
                {isUpdateType ? (
                  <DownloadIcon color="#ffffff" size={18} />
                ) : (
                  <SparklesIcon color="#ffffff" size={16} />
                )}
                <Text style={styles.mainActionText}>{action.label}</Text>
                <ChevronRightIcon color="#ffffff" size={16} />
              </TouchableOpacity>
            ))}

            {/* Optional Dismiss button at bottom */}
            {popup.hasCancelButton && !popup.isForceUpdate && (
              <TouchableOpacity style={styles.cancelTextBtn} onPress={handleDismiss}>
                <Text style={styles.cancelTextBtnText}>Dismiss / Close</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  cardContainer: {
    width: MODAL_WIDTH,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative'
  },
  imageWrapper: {
    height: 150,
    width: '100%',
    backgroundColor: '#0f172a'
  },
  bannerImage: {
    width: '100%',
    height: '100%'
  },
  topCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  scrollBody: {
    flexGrow: 0
  },
  cardBody: {
    padding: 20,
    alignItems: 'center'
  },
  typeBadgeRow: {
    marginBottom: 10
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  updateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8'
  },
  normalBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  normalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  titleText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 6
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12
  },
  bodyBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  bodyText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    textAlign: 'center'
  },
  inputGroup: {
    width: '100%',
    marginBottom: 12
  },
  inputLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 13,
    backgroundColor: '#ffffff'
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8
  },
  choiceCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8'
  },
  choiceCircleSelected: {
    borderColor: '#15803d',
    backgroundColor: '#15803d'
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkBoxSelected: {
    backgroundColor: '#15803d',
    borderColor: '#15803d'
  },
  checkMark: {
    color: '#ffffff',
    fontWeight: '900'
  },
  choiceText: {
    color: '#334155',
    fontSize: 13,
    flex: 1
  },  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 13,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 8
  },
  updateActionBtn: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb'
  },
  mainActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  cancelTextBtn: {
    marginTop: 12,
    paddingVertical: 4
  },
  cancelTextBtnText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700'
  }
});
