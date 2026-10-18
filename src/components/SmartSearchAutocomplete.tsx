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
import { parseSmartSearchQuery } from '../utils/smartSearchParser';
import { SearchIcon, SparklesIcon, ClockIcon, ChevronRightIcon } from './Icons';
import { useTheme } from '../context/ThemeContext';
import { HighlightText } from './HighlightText';

export interface AutocompleteSuggestion {
  id: string;
  type: 'unit' | 'school' | 'department' | 'acronym' | 'history' | 'trending' | 'material';
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
  showMaterialTypeSuggestion?: boolean;
  onSelectMaterialTypeSuggestion?: (query: string) => void;
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
  showMaterialTypeSuggestion = false,
  onSelectMaterialTypeSuggestion,
  onClearHistory,
  containerStyle
}) => {
  const { isDark } = useTheme();
  const trimmed = query.trim().toLowerCase();

  const queryTokens = useMemo(() => {
    return trimmed.split(/[^a-z0-9]+/i).filter(Boolean);
  }, [trimmed]);

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

    if (queryTokens.length === 0) {
      return [];
    }

    const cleanNoSpace = trimmed.replace(/[^a-z0-9]/g, '');

    interface CandidateItem {
      item: AutocompleteSuggestion;
      matchedTokenCount: number;
      totalScore: number;
    }

    const candidates: CandidateItem[] = [];

    // 2. Acronym Match (e.g. "os", "dbms", "dsa", "ai", "oop")
    if (ACADEMIC_ACRONYMS[trimmed]) {
      const exp = ACADEMIC_ACRONYMS[trimmed];
      candidates.push({
        item: {
          id: `acronym-${trimmed}`,
          type: 'acronym',
          title: exp,
          subtitle: `Acronym for "${trimmed.toUpperCase()}"`,
          badge: '⚡ ACRONYM',
          queryValue: exp
        },
        matchedTokenCount: queryTokens.length,
        totalScore: 14000
      });
    }

    // 3. Academic Units (Out-of-order word matching & token scoring)
    for (const unit of MOI_ACADEMIC_UNITS) {
      const codeLower = unit.code.toLowerCase();
      const codeClean = codeLower.replace(/[^a-z0-9]/g, '');
      const codeTokens = codeLower.split(/[^a-z0-9]+/).filter(Boolean);
      const nameLower = unit.name.toLowerCase();
      const nameWords = nameLower.split(/[^a-z0-9]+/).filter(Boolean);
      const deptSchoolLower = `${unit.department || ''} ${unit.school || ''}`.toLowerCase();
      const deptSchoolWords = deptSchoolLower.split(/[^a-z0-9]+/).filter(Boolean);

      let matchedTokenCount = 0;
      let unitScore = 0;

      // Exact code match bonus across full query (e.g. "sas 101" or "sas101")
      if (cleanNoSpace === codeClean) {
        unitScore += 8000;
      } else if (codeClean.startsWith(cleanNoSpace)) {
        unitScore += 4000;
      }

      for (const tok of queryTokens) {
        let bestTokenScore = 0;

        // Code match: exact token or prefix
        if (codeTokens.includes(tok) || codeClean === tok) {
          bestTokenScore = Math.max(bestTokenScore, 3500);
        } else if (codeClean.startsWith(tok) || codeTokens.some((ct) => ct.startsWith(tok))) {
          bestTokenScore = Math.max(bestTokenScore, 2500);
        }

        // Title word match: exact word or prefix
        if (nameWords.includes(tok)) {
          bestTokenScore = Math.max(bestTokenScore, 1800);
        } else if (nameWords.some((w) => w.startsWith(tok))) {
          bestTokenScore = Math.max(bestTokenScore, 1200);
        }

        // Department & School words
        if (deptSchoolWords.includes(tok)) {
          bestTokenScore = Math.max(bestTokenScore, 600);
        } else if (deptSchoolWords.some((w) => w.startsWith(tok))) {
          bestTokenScore = Math.max(bestTokenScore, 400);
        }

        // Past paper / aliases
        if (unit.aliases && unit.aliases.length > 0) {
          for (const alias of unit.aliases) {
            const aLower = alias.toLowerCase();
            if (aLower.includes(tok)) {
              bestTokenScore = Math.max(bestTokenScore, 300);
              break;
            }
          }
        }

        // Internal substring fallback (e.g. "sas" inside "disasters")
        // Minimal score (+15) ensures it never ranks above genuine prefix or word matches
        if (bestTokenScore === 0 && tok.length >= 3) {
          if (nameLower.includes(tok) || deptSchoolLower.includes(tok)) {
            bestTokenScore = 15;
          }
        }

        if (bestTokenScore > 0) {
          matchedTokenCount++;
          unitScore += bestTokenScore;
        }
      }

      if (matchedTokenCount > 0) {
        // Bonus if ALL query tokens matched this unit (regardless of word order)
        if (matchedTokenCount === queryTokens.length) {
          unitScore += 3000;
        }

        candidates.push({
          item: {
            id: `unit-${unit.code}`,
            type: 'unit',
            title: `${unit.code} • ${unit.name}`,
            subtitle: `${unit.department || unit.school}`,
            badge: 'UNIT',
            queryValue: `${unit.code} ${unit.name}`
          },
          matchedTokenCount,
          totalScore: unitScore
        });
      }
    }

    // 4. Academic Schools
    for (const sch of MOI_ACADEMIC_SCHOOLS) {
      const schCodeLower = sch.code.toLowerCase();
      const schCodeClean = schCodeLower.replace(/[^a-z0-9]/g, '');
      const schNameLower = sch.name.toLowerCase();
      const schNameWords = schNameLower.split(/[^a-z0-9]+/).filter(Boolean);
      const schAliases = sch.aliases || [];

      let matchedTokenCount = 0;
      let schScore = 0;

      if (cleanNoSpace === schCodeClean) {
        schScore += 6000;
      }

      for (const tok of queryTokens) {
        let bestTokenScore = 0;

        if (schCodeClean === tok) {
          bestTokenScore = Math.max(bestTokenScore, 3000);
        } else if (schCodeClean.startsWith(tok)) {
          bestTokenScore = Math.max(bestTokenScore, 2000);
        }

        if (schNameWords.includes(tok)) {
          bestTokenScore = Math.max(bestTokenScore, 1500);
        } else if (schNameWords.some((w) => w.startsWith(tok))) {
          bestTokenScore = Math.max(bestTokenScore, 1000);
        }

        if (schAliases.some((a) => a.toLowerCase().includes(tok))) {
          bestTokenScore = Math.max(bestTokenScore, 800);
        }

        if (bestTokenScore === 0 && tok.length >= 3 && schNameLower.includes(tok)) {
          bestTokenScore = 15;
        }

        if (bestTokenScore > 0) {
          matchedTokenCount++;
          schScore += bestTokenScore;
        }
      }

      if (matchedTokenCount > 0) {
        if (matchedTokenCount === queryTokens.length) {
          schScore += 2500;
        }

        candidates.push({
          item: {
            id: `school-${sch.code}`,
            type: 'school',
            title: sch.name,
            subtitle: `${sch.code} • Faculty`,
            badge: 'SCHOOL',
            queryValue: sch.name
          },
          matchedTokenCount,
          totalScore: schScore
        });
      }
    }

    // 5. Academic Departments
    for (const dept of MOI_ACADEMIC_DEPARTMENTS) {
      const deptNameLower = dept.name.toLowerCase();
      const deptWords = deptNameLower.split(/[^a-z0-9]+/).filter(Boolean);
      const deptSchoolLower = (dept.school || '').toLowerCase();
      const deptSchoolWords = deptSchoolLower.split(/[^a-z0-9]+/).filter(Boolean);

      let matchedTokenCount = 0;
      let deptScore = 0;

      for (const tok of queryTokens) {
        let bestTokenScore = 0;

        if (deptWords.includes(tok)) {
          bestTokenScore = Math.max(bestTokenScore, 1400);
        } else if (deptWords.some((w) => w.startsWith(tok))) {
          bestTokenScore = Math.max(bestTokenScore, 900);
        }

        if (deptSchoolWords.includes(tok)) {
          bestTokenScore = Math.max(bestTokenScore, 400);
        }

        if (bestTokenScore === 0 && tok.length >= 3 && deptNameLower.includes(tok)) {
          bestTokenScore = 15;
        }

        if (bestTokenScore > 0) {
          matchedTokenCount++;
          deptScore += bestTokenScore;
        }
      }

      if (matchedTokenCount > 0) {
        if (matchedTokenCount === queryTokens.length) {
          deptScore += 2000;
        }

        candidates.push({
          item: {
            id: `dept-${dept.name}`,
            type: 'department',
            title: dept.name,
            subtitle: dept.school,
            badge: 'DEPT',
            queryValue: dept.name
          },
          matchedTokenCount,
          totalScore: deptScore
        });
      }
    }

    // 6. Deterministic Smart Sorting:
    // Ranked strictly by most matched words (descending), then relevance score (descending)
    candidates.sort((a, b) => {
      // 1. Most matching words ranked top coming downwards
      if (b.matchedTokenCount !== a.matchedTokenCount) {
        return b.matchedTokenCount - a.matchedTokenCount;
      }
      // 2. Highest total score first
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // 3. For units with identical scores, sort by unit code naturally (e.g. SAS 101 before SAS 302)
      if (a.item.type === 'unit' && b.item.type === 'unit') {
        const codeCmp = a.item.title.localeCompare(b.item.title, undefined, { numeric: true });
        if (codeCmp !== 0) return codeCmp;
      }
      // 4. Shorter title for cleaner matches
      return a.item.title.length - b.item.title.length;
    });

    // 7. Deduplicate and return top 6
    const seen = new Set<string>();
    const topSuggestions: AutocompleteSuggestion[] = [];

    for (const cand of candidates) {
      const key = cand.item.queryValue.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        topSuggestions.push(cand.item);
      }
      if (topSuggestions.length >= 6) {
        break;
      }
    }

    if (showMaterialTypeSuggestion) {
      const intent = parseSmartSearchQuery(query.trim());
      const materialLabels: Record<string, { label: string; badge: string }> = {
        past_paper: { label: 'Past Papers', badge: 'EXAMS' },
        cat: { label: 'CATs', badge: 'CATs' },
        notes: { label: 'Notes PDF', badge: 'NOTES' },
        solution: { label: 'Exam Solutions', badge: 'SOLUTIONS' }
      };
      const material = intent.materialType ? materialLabels[intent.materialType] : undefined;
      if (material) {
        topSuggestions.unshift({
          id: `material-${intent.materialType}-${trimmed}`,
          type: 'material',
          title: `${query.trim()} | ${material.label}`,
          subtitle: `Search directly in ${material.label}`,
          badge: material.badge,
          queryValue: query.trim()
        });
      }
    }

    return topSuggestions.slice(0, 6);
  }, [trimmed, queryTokens, historyEntries, showMaterialTypeSuggestion, query]);

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
            onPress={() => item.type === 'material' && onSelectMaterialTypeSuggestion
              ? onSelectMaterialTypeSuggestion(item.queryValue)
              : onSelectSuggestion(item.queryValue)}
            style={[
              styles.itemRow,
              index !== suggestions.length - 1 && styles.itemBorder,
              isDark && styles.itemBorderDark
            ]}
          >
            <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
              {item.type === 'history' ? (
                <ClockIcon size={14} color="#64748b" />
              ) : item.type === 'unit' || item.type === 'material' ? (
                <SparklesIcon size={14} color="#15803d" />
              ) : (
                <SearchIcon size={14} color="#0284c7" />
              )}
            </View>

            <View style={styles.itemTextContainer}>
              <View style={styles.titleRow}>
                <HighlightText
                  text={item.title}
                  highlightWords={queryTokens}
                  style={[styles.itemTitle, isDark && styles.textDark]}
                  highlightStyle={{
                    color: isDark ? '#38bdf8' : '#0284c7',
                    fontWeight: '800',
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)',
                    borderRadius: 3
                  }}
                  numberOfLines={1}
                />
                {item.badge && (
                  <View
                    style={[
                      styles.badge,
                      item.type === 'unit' || item.type === 'material'
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
