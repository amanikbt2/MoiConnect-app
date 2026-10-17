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
  const showAutoPivot = isAutoPivoted && intent.didYouMeanText;
  const showDidYouMean = !isAutoPivoted && hasCorrection && intent.didYouMeanText;

  if (!showAutoPivot && !showDidYouMean) {
    return null;
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* 1. Google-Style: Auto-Pivoted Mode ("Showing results for...") */}
      {showAutoPivot && (
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
      {showDidYouMean && (
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
  textDark: {
    color: '#e2e8f0'
  },
  textMutedDark: {
    color: '#94a3b8'
  }
});
