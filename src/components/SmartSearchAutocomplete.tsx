import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import {
  MOI_ACADEMIC_UNITS,
  MOI_ACADEMIC_SCHOOLS,
  MOI_ACADEMIC_DEPARTMENTS,
  AcademicUnitEntry
} from '../data/moiAcademicDictionary';
import { ACADEMIC_ACRONYMS } from '../utils/academicAcronyms';
import { SearchIcon, SparklesIcon, ClockIcon, ChevronRightIcon } from './Icons';
import { useTheme } from '../context/ThemeContext';

export interface AutocompleteSuggestion {
  id: string;
  type: 'unit' | 'school' | 'department' | 'acronym' | 'history' | 'trending';
  title: string;
  subtitle?: string;
  badge?: string;
  queryValue: string;
}

export interface SmartSearchAutocompleteProps {
  query: string;
  visible: boolean;
  historyEntries?: string[];
  onSelectSuggestion: (query: string) => void;
  onClearHistory?: () => void;
  containerStyle?: object;
}

export const POPULAR_CAMPUS_SEARCHES = [
  'CSC 214 Automata',
  'Operating Systems Notes',
  'Calculus 1 Past Papers',
  'BBM 201 Financial Accounting',
  'COM 110 Communication Skills',
  'School of Engineering'
];

/**
 * Google & Spotlight-style Instant Autocomplete Dropdown (100% Offline)
 * Matches units, departments, schools, acronyms, and recent queries in < 1ms.
 */
export const SmartSearchAutocomplete: React.FC<SmartSearchAutocompleteProps> = React.memo(({
  query,
  visible,
  historyEntries = [],
  onSelectSuggestion,
  onClearHistory,
  containerStyle
}) => {
  const { isDark } = useTheme();
  const trimmed = query.trim().toLowerCase();

  const suggestions = useMemo<AutocompleteSuggestion[]>(() => {
    // 1. If query is empty: Show Recent Searches & Popular Campus Searches
    if (!trimmed) {
      const items: AutocompleteSuggestion[] = [];

      // Add recent history items (up to 4)
      historyEntries.slice(0, 4).forEach((h, idx) => {
        items.push({
          id: `hist-${idx}-${h}`,
          type: 'history',
          title: h,
          subtitle: 'Recent Search',
          queryValue: h
        });
      });

      // Add popular trending topics (up to 3)
      POPULAR_CAMPUS_SEARCHES.slice(0, 3).forEach((pop, idx) => {
        items.push({
          id: `pop-${idx}-${pop}`,
          type: 'trending',
          title: pop,
          subtitle: 'Popular across Campus',
          badge: '🔥 TRENDING',
          queryValue: pop
        });
      });

      return items;
    }

    const results: AutocompleteSuggestion[] = [];
    const cleanNoSpace = trimmed.replace(/[^a-z0-9]/g, '');

    // 2. Acronym Match (e.g. "os", "dbms", "dsa", "ai", "oop")
    if (ACADEMIC_ACRONYMS[trimmed]) {
      const exp = ACADEMIC_ACRONYMS[trimmed];
      results.push({
        id: `acronym-${trimmed}`,
        type: 'acronym',
        title: exp,
        subtitle: `Acronym for "${trimmed.toUpperCase()}"`,
        badge: '⚡ ACRONYM',
        queryValue: exp
      });
    }

    // 3. Exact & Prefix Unit Code Matches (e.g. "csc 21", "com 110", "ant")
    const unitMatches: AcademicUnitEntry[] = [];
    for (const unit of MOI_ACADEMIC_UNITS) {
      const unitCodeClean = unit.code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const unitNameLower = unit.name.toLowerCase();

      if (unitCodeClean.startsWith(cleanNoSpace) || unitCodeClean.includes(cleanNoSpace)) {
        unitMatches.push(unit);
      } else if (unitNameLower.includes(trimmed)) {
        unitMatches.push(unit);
      }

      if (unitMatches.length >= 5) break;
    }

    unitMatches.forEach((unit) => {
      results.push({
        id: `unit-${unit.code}`,
        type: 'unit',
        title: `${unit.code} • ${unit.name}`,
        subtitle: `${unit.department || unit.school}`,
        badge: 'UNIT',
        queryValue: `${unit.code} ${unit.name}`
      });
    });

    // 4. School Matches (e.g. "engineering", "ssas", "law")
    for (const sch of MOI_ACADEMIC_SCHOOLS) {
      if (
        sch.name.toLowerCase().includes(trimmed) ||
        sch.code.toLowerCase() === trimmed ||
        sch.aliases.some((a) => a.includes(trimmed))
      ) {
        results.push({
          id: `school-${sch.code}`,
          type: 'school',
          title: sch.name,
          subtitle: `${sch.code} • Faculty`,
          badge: 'SCHOOL',
          queryValue: sch.name
        });
        break;
      }
    }

    // 5. Department Matches
    if (results.length < 5) {
      for (const dept of MOI_ACADEMIC_DEPARTMENTS) {
        if (dept.name.toLowerCase().includes(trimmed)) {
          results.push({
            id: `dept-${dept.name}`,
            type: 'department',
            title: dept.name,
            subtitle: dept.school,
            badge: 'DEPT',
            queryValue: dept.name
          });
          if (results.length >= 6) break;
        }
      }
    }

    return results.slice(0, 6);
  }, [trimmed, historyEntries]);

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.dropdownContainer, isDark && styles.dropdownDark, containerStyle]}>
      {/* Header if empty query with history */}
      {!trimmed && historyEntries.length > 0 && onClearHistory && (
        <View style={styles.dropdownHeader}>
          <Text style={[styles.dropdownHeaderText, isDark && styles.textMutedDark]}>
            RECENT SEARCHES
          </Text>
          <TouchableOpacity onPress={onClearHistory} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearHistoryText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        style={styles.list}
      >
        {suggestions.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => onSelectSuggestion(item.queryValue)}
            style={[
              styles.itemRow,
              index !== suggestions.length - 1 && styles.itemBorder,
              isDark && styles.itemBorderDark
            ]}
          >
            <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
              {item.type === 'history' ? (
                <ClockIcon size={14} color="#64748b" />
              ) : item.type === 'unit' ? (
                <SparklesIcon size={14} color="#15803d" />
              ) : (
                <SearchIcon size={14} color="#0284c7" />
              )}
            </View>

            <View style={styles.itemTextContainer}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.itemTitle, isDark && styles.textDark]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.badge && (
                  <View
                    style={[
                      styles.badge,
                      item.type === 'unit'
                        ? styles.badgeUnit
                        : item.type === 'acronym'
                        ? styles.badgeAcronym
                        : styles.badgeTrending
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              {item.subtitle && (
                <Text
                  style={[styles.itemSubtitle, isDark && styles.textMutedDark]}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              )}
            </View>

            <ChevronRightIcon size={14} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
    marginHorizontal: 16,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 9999,
    overflow: 'hidden'
  },
  dropdownDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155'
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6
  },
  dropdownHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#64748b'
  },
  clearHistoryText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700'
  },
  list: {
    paddingVertical: 2
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9'
  },
  itemBorderDark: {
    borderBottomColor: '#1e293b'
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  iconCircleDark: {
    backgroundColor: '#1e293b'
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 8
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    flexShrink: 1
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  badgeUnit: {
    backgroundColor: '#dcfce7'
  },
  badgeAcronym: {
    backgroundColor: '#fef3c7'
  },
  badgeTrending: {
    backgroundColor: '#fee2e2'
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a'
  },
  textDark: {
    color: '#f8fafc'
  },
  textMutedDark: {
    color: '#94a3b8'
  }
});
