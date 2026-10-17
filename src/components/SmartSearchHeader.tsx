import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SparklesIcon, SearchIcon } from './Icons';
import { useTheme } from '../context/ThemeContext';
import { ParsedSearchIntent } from '../utils/smartSearchParser';

export interface SmartSearchHeaderProps {
  intent: ParsedSearchIntent;
  isAutoPivoted?: boolean;
  totalResultsCount?: number;
  onAcceptSuggestion: (suggestion: string) => void;
  onSearchInsteadOriginal?: () => void;
  onChipPress?: (chipLabel: string) => void;
  onRemoveChip?: (chipLabel: string) => void;
}

export function SmartSearchHeader({
  intent,
  isAutoPivoted,
  totalResultsCount = 0,
  onAcceptSuggestion,
  onSearchInsteadOriginal,
  onChipPress,
  onRemoveChip
}: SmartSearchHeaderProps) {
  const { isDark } = useTheme();

  // If there's no query or no intent, render nothing
  if (!intent.rawQuery || intent.rawQuery.trim().length < 2) {
    return null;
  }

  const hasCorrection = intent.hasCorrection && intent.didYouMeanText;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* 1. Google-Style: Auto-Pivoted Mode ("Showing results for...") */}
      {isAutoPivoted && intent.didYouMeanText && (
        <View style={styles.autoPivotBox}>
          <View style={styles.inlineRow}>
            <SparklesIcon size={16} color="#15803d" />
            <Text style={[styles.autoPivotTitle, isDark && styles.textDark]}>
              {' '}Showing results for{' '}
              <Text style={styles.highlightedText}>{intent.didYouMeanText}</Text>
            </Text>
          </View>

          {onSearchInsteadOriginal && intent.rawQuery !== intent.didYouMeanText && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSearchInsteadOriginal}
              style={styles.searchInsteadButton}
            >
              <Text style={styles.searchInsteadText}>
                Search instead for <Text style={styles.strikethroughOriginal}>"{intent.rawQuery}"</Text>?
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 2. Suggestion Mode: "Did you mean...?" */}
      {!isAutoPivoted && hasCorrection && intent.didYouMeanText && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onAcceptSuggestion(intent.autoPivotSuggestion || intent.didYouMeanText!)}
          style={[styles.didYouMeanCard, isDark && styles.didYouMeanCardDark]}
        >
          <View style={styles.sparkleBadge}>
            <SparklesIcon size={14} color="#166534" />
          </View>
          <View style={styles.didYouMeanBody}>
            <Text style={[styles.didYouMeanPrefix, isDark && styles.textMutedDark]}>
              Did you mean:{' '}
              <Text style={styles.didYouMeanSuggestion}>
                {intent.didYouMeanText}
              </Text>
            </Text>
            <Text style={styles.tapToSearchHint}>Tap to switch query ➔</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 3. Smart Detected Chips (Intent Breakdown) */}
      {intent.chips.length > 0 && (
        <View style={styles.chipsContainer}>
          <Text style={[styles.chipsHeading, isDark && styles.textMutedDark]}>
            Recognized Intent:
          </Text>
          <View style={styles.chipsRow}>
            {intent.chips.map((chip, index) => {
              const chipColorStyle =
                chip.type === 'unit'
                  ? styles.chipUnit
                  : chip.type === 'semester'
                  ? styles.chipSemester
                  : chip.type === 'material'
                  ? styles.chipMaterial
                  : styles.chipDefault;

              return (
                <View
                  key={`${chip.label}-${index}`}
                  style={[styles.chip, chipColorStyle, isDark && styles.chipDark, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onChipPress?.(chip.label)}
                  >
                    <Text style={[styles.chipText, isDark && styles.textDark]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                  {onRemoveChip && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      onPress={() => onRemoveChip(chip.label)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748b', marginLeft: 2 }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  containerDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b'
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  autoPivotBox: {
    marginBottom: 6
  },
  autoPivotTitle: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500'
  },
  highlightedText: {
    fontWeight: '700',
    color: '#15803d'
  },
  searchInsteadButton: {
    marginTop: 4,
    paddingVertical: 2
  },
  searchInsteadText: {
    fontSize: 12,
    color: '#64748b'
  },
  strikethroughOriginal: {
    color: '#2563eb',
    textDecorationLine: 'underline'
  },
  didYouMeanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6
  },
  didYouMeanCardDark: {
    backgroundColor: '#052e16',
    borderColor: '#166534'
  },
  sparkleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  didYouMeanBody: {
    flex: 1
  },
  didYouMeanPrefix: {
    fontSize: 13,
    color: '#1e293b'
  },
  didYouMeanSuggestion: {
    fontWeight: '700',
    color: '#15803d'
  },
  tapToSearchHint: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 2,
    fontWeight: '500'
  },
  chipsContainer: {
    marginTop: 4
  },
  chipsHeading: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  chipDark: {
    backgroundColor: '#1e293b'
  },
  chipUnit: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe'
  },
  chipSemester: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff'
  },
  chipMaterial: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a'
  },
  chipDefault: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155'
  },
  textDark: {
    color: '#f8fafc'
  },
  textMutedDark: {
    color: '#94a3b8'
  }
});
