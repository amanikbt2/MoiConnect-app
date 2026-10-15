export interface MaterialSearchFields {
  mtid?: string;
  title?: string;
  unitCode?: string;
  unitName?: string;
  school?: string;
  department?: string;
  courseCode?: string;
  semester?: string;
  academicYear?: string;
  examYear?: string | number;
  type?: string;
  description?: string;
  author?: string;
}

export interface MaterialSearchHistoryEntry {
  query: string;
  school?: string;
  course?: string;
  yearOfStudy?: string;
  searchedAt?: number;
}

const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase();
const normalizeId = (value: unknown) => normalize(value).replace(/[^a-z0-9]/g, '');

/**
 * Material IDs are deliberately category-prefixed by the backend:
 * P = past paper, N = notes, C = CAT. Keep this detection strict so a
 * normal keyword such as "physics" is never redirected unexpectedly.
 */
export function getMaterialCategoryFromId(query: string): 'past_paper' | 'notes' | 'cat' | null {
  const id = normalizeId(query);
  if (/^p\d+$/.test(id) || /^past(?:paper)?\d+$/.test(id)) return 'past_paper';
  if (/^n\d+$/.test(id) || /^notes?\d+$/.test(id)) return 'notes';
  if (/^c\d+$/.test(id) || /^cat\d+$/.test(id)) return 'cat';
  return null;
}

import { parseSmartSearchQuery, ParsedSearchIntent } from './smartSearchParser';

export function getGlobalSearchDestination(query: string): string {
  const value = normalize(query);
  const encodedQuery = encodeURIComponent(query.trim());
  const parsed = parseSmartSearchQuery(query);

  // If parsed intent specifically found a material type:
  if (parsed.materialType === 'cat') return `/cat-papers?search=${encodedQuery}`;
  if (parsed.materialType === 'past_paper') return `/past-papers?search=${encodedQuery}`;
  if (parsed.materialType === 'notes') return `/(tabs)/academics?search=${encodedQuery}`;

  const hasAny = (words: string[]) => words.some((word) => value.includes(word));

  const idCategory = getMaterialCategoryFromId(query);
  if (idCategory === 'past_paper') return `/past-papers?search=${encodedQuery}`;
  if (idCategory === 'notes') return `/(tabs)/academics?search=${encodedQuery}`;
  if (idCategory === 'cat') return `/cat-papers?search=${encodedQuery}`;

  if (hasAny(['cat', 'continuous assessment', 'quiz', 'test'])) {
    return `/cat-papers?search=${encodedQuery}`;
  }
  if (hasAny(['rent', 'rental', 'house', 'hostel', 'accommodation', 'room', 'bedsitter', 'apartment', 'housing', 'landlord', 'stage', 'kesses', 'mabs'])) {
    return `/rentals?search=${encodedQuery}`;
  }
  if (hasAny(['exam', 'past paper', 'pastpaper', 'revision', 'semester exam', 'final paper', 'solution', 'marking scheme'])) {
    return `/past-papers?search=${encodedQuery}`;
  }
  return `/(tabs)/academics?search=${encodedQuery}`;
}

export function normalizeSchoolName(school?: string): string {
  const s = String(school || '').toLowerCase().trim();
  if (s.includes('science') && (s.includes('aerospace') || s.includes('aviation'))) {
    return 'School of Science and Aerospace Studies';
  }
  if (s.includes('arts') && s.includes('social')) {
    return 'School of Arts and Social Sciences';
  }
  if (s.includes('information')) {
    return 'School of Information Sciences';
  }
  if (s.includes('business') || s.includes('economics')) {
    return 'School of Business & Economics';
  }
  if (s.includes('education')) {
    return 'School of Education';
  }
  if (s.includes('law')) {
    return 'School of Law';
  }
  if (s.includes('engineering')) {
    return 'School of Engineering';
  }
  if (s.includes('medicine')) {
    return 'School of Medicine';
  }
  if (s.includes('nursing')) {
    return 'School of Nursing';
  }
  if (s.includes('public health')) {
    return 'School of Public Health';
  }
  if (s.includes('agriculture')) {
    return 'School of Agriculture & Natural Resources';
  }
  if (s.includes('dentistry')) {
    return 'School of Dentistry';
  }
  if (s.includes('tourism')) {
    return 'School of Tourism & Hospitality';
  }
  return s;
}

/** Lower scores are better. Exact MTID, Canonical Unit Code, School & Department are always ranked ahead of ordinary text matches. */
export function getMaterialSearchScore(item: MaterialSearchFields, query: string, parsedIntent?: ParsedSearchIntent): number | null {
  const q = normalize(query);
  if (!q) return 0;

  const id = normalizeId(item.mtid);
  const normalizedQueryId = normalizeId(q);
  if (id && normalizedQueryId && id === normalizedQueryId) return 0;

  const intent = parsedIntent || parseSmartSearchQuery(query);

  const itemUnitCodeNorm = normalizeId(item.unitCode);
  const itemCourseCodeNorm = normalizeId(item.courseCode);
  const itemSchoolNorm = normalizeSchoolName(item.school);
  const intentSchoolNorm = intent.school ? normalizeSchoolName(intent.school) : '';
  const itemDeptNorm = normalize(item.department);
  const intentDeptNorm = intent.department ? normalize(intent.department) : '';

  const itemPrefix = (item.unitCode || item.courseCode || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const intentPrefix = (intent.unitCode || '').replace(/[^a-zA-Z]/g, '').toUpperCase();

  // 1. Matched by canonical unit code from intent parser (e.g. "CSC 111", "CSC 112", "EDE 211")
  if (intent.unitCode) {
    const targetCodeNorm = normalizeId(intent.unitCode);
    if (itemUnitCodeNorm === targetCodeNorm || itemCourseCodeNorm === targetCodeNorm) {
      return 1;
    }
  }

  // 2. Direct exact match on unitCode with space stripped (e.g. "com110" matches "COM 110")
  if (normalizedQueryId && (itemUnitCodeNorm === normalizedQueryId || itemCourseCodeNorm === normalizedQueryId)) {
    return 1;
  }

  // 3. Matched by parsed unit name (e.g. "Differential Calculus")
  if (intent.unitName) {
    const targetNameNorm = normalize(intent.unitName);
    const itemTitleNorm = normalize(item.title);
    const itemUnitNameNorm = normalize(item.unitName);
    if (itemTitleNorm.includes(targetNameNorm) || itemUnitNameNorm.includes(targetNameNorm)) {
      return 2;
    }
  }

  // 4. Same unit prefix + same school or department (e.g. search has "CSC 111", item is "CSC 211" in Science)
  if (intentPrefix && itemPrefix && itemPrefix === intentPrefix) {
    if (intentSchoolNorm && itemSchoolNorm && intentSchoolNorm === itemSchoolNorm) {
      return 2;
    }
    return 3;
  }

  // 5. School and Department match when school/department intent was recognized
  const schoolMatches = Boolean(intentSchoolNorm && itemSchoolNorm && intentSchoolNorm === itemSchoolNorm);
  const deptMatches = Boolean(intentDeptNorm && itemDeptNorm && (itemDeptNorm.includes(intentDeptNorm) || intentDeptNorm.includes(itemDeptNorm)));

  if (schoolMatches && deptMatches) {
    return 2;
  }
  if (deptMatches) {
    return 3;
  }
  if (schoolMatches) {
    return 3;
  }

  // If user searched for a school or department, penalize or exclude papers from conflicting schools
  const hasSchoolOrDeptIntent = Boolean(intentSchoolNorm || intentDeptNorm);
  const schoolConflicts = hasSchoolOrDeptIntent && itemSchoolNorm && intentSchoolNorm && itemSchoolNorm !== intentSchoolNorm;

  const fields = [
    item.title, item.unitCode, item.unitName, item.school, item.department,
    item.courseCode, item.semester, item.academicYear, item.examYear,
    item.type, item.description, item.author
  ].map(normalize).filter(Boolean);

  const primaryFields = [item.title, item.unitCode, item.unitName, item.courseCode]
    .map(normalize)
    .filter(Boolean);
  const queryTokens = q.split(/\s+/).filter((token) => token.length > 1);
  const matchedTokens = queryTokens.filter((token) => fields.some((field) => field.includes(token)));
  const primaryMatchedTokens = queryTokens.filter((token) => primaryFields.some((field) => field.includes(token)));

  const idText = normalize(item.mtid);
  if (idText && idText.startsWith(q)) return 2;
  if (id && normalizedQueryId && id.includes(normalizedQueryId)) return 2;

  const title = normalize(item.title);
  const unitCode = normalize(item.unitCode);
  const unitName = normalize(item.unitName);

  if (q.length <= 2) {
    const wordBoundaryRegex = new RegExp(`(^|\\s)${q}`, 'i');
    const matchesCodeOrWord = Boolean(
      (idText && idText.startsWith(q)) ||
      (unitCode && (unitCode.startsWith(q) || unitCode.replace(/[^a-z0-9]/g, '').startsWith(q))) ||
      (title && (title === q || wordBoundaryRegex.test(title))) ||
      (unitName && (unitName === q || wordBoundaryRegex.test(unitName)))
    );
    if (matchesCodeOrWord) {
      return schoolConflicts ? 12 : 4;
    }
    return null;
  }

  if (title === q || unitCode === q || unitName === q) return 3;
  if ([title, unitCode, unitName].some((field) => field.startsWith(q))) return 4;
  if ([title, unitCode, unitName].some((field) => field.includes(q))) return 5;

  // Search by meaningful words, not only by exact sentence/order
  if (queryTokens.length > 0 && matchedTokens.length === queryTokens.length) {
    const base = primaryMatchedTokens.length === queryTokens.length ? 5 : 6;
    return schoolConflicts ? base + 10 : base;
  }

  // Partial word matches
  if (matchedTokens.length >= Math.max(1, Math.ceil(queryTokens.length / 2))) {
    return schoolConflicts ? 18 : 8;
  }
  if (matchedTokens.length > 0) {
    return schoolConflicts ? null : 9;
  }

  return fields.some((field) => field.includes(q)) ? (schoolConflicts ? null : 10) : null;
}

export function rankMaterials<T extends MaterialSearchFields>(items: T[], query: string, parsedIntent?: ParsedSearchIntent): T[] {
  if (!query.trim()) return items;
  const intent = parsedIntent || parseSmartSearchQuery(query);
  return items
    .map((item, index) => ({
      item,
      index,
      score: getMaterialSearchScore(item, query, intent),
      downloads: Number((item as any).downloads || (item as any).downloadsCount || 0)
    }))
    .filter((entry): entry is { item: T; index: number; score: number; downloads: number } => entry.score !== null)
    .sort((a, b) => a.score - b.score || b.downloads - a.downloads || a.index - b.index)
    .map(({ item }) => item);
}

export interface SmartSearchResult<T> {
  results: T[];
  intent: ParsedSearchIntent;
  isAutoPivoted: boolean;
  effectiveQuery: string;
}

/**
 * Smart Search Engine: Google-Style Auto-Pivot & Never-Empty Fallback.
 * If raw query gives 0 results, automatically tests the corrected term or unit code.
 */
export function smartSearchMaterials<T extends MaterialSearchFields>(
  items: T[],
  query: string
): SmartSearchResult<T> {
  const clean = query.trim();
  const intent = parseSmartSearchQuery(clean);

  if (!clean) {
    return {
      results: items,
      intent,
      isAutoPivoted: false,
      effectiveQuery: ''
    };
  }

  // 1. Run direct ranking with raw query
  const directResults = rankMaterials(items, clean, intent);

  if (directResults.length > 0) {
    return {
      results: directResults,
      intent,
      isAutoPivoted: false,
      effectiveQuery: clean
    };
  }

  // 2. Exact match yielded 0 results: Check if Smart Parser has a corrected query or unit code!
  const fallbackQuery = intent.autoPivotSuggestion || intent.unitCode || intent.correctedQuery;
  if (fallbackQuery && fallbackQuery.toLowerCase() !== clean.toLowerCase()) {
    const autoPivotedResults = rankMaterials(items, fallbackQuery);
    if (autoPivotedResults.length > 0) {
      return {
        results: autoPivotedResults,
        intent,
        isAutoPivoted: true,
        effectiveQuery: fallbackQuery
      };
    }
  }

  // 3. Fallback: Return empty or closest partial matches
  return {
    results: [],
    intent,
    isAutoPivoted: false,
    effectiveQuery: clean
  };
}

/** Rank every material for a student profile, keeping unmatched materials as a useful fallback. */
export function rankMaterialsForProfile<T extends MaterialSearchFields>(
  items: T[],
  profile?: { school?: string; course?: string; yearOfStudy?: string } | null,
  searchHistory: Array<string | MaterialSearchHistoryEntry> = []
): T[] {
  const school = normalize(profile?.school);
  const courseTokens = normalize(profile?.course).split(/\s+/).filter((token) => token && token !== 'unset');
  const yearTokens = normalize(profile?.yearOfStudy).match(/\d+/g) || [];

  return items
    .map((item, index) => {
      const itemSchool = normalize(item.school || item.department);
      const itemCourseText = [item.courseCode, item.unitCode, item.unitName, item.department, item.title]
        .map(normalize)
        .join(' ');
      const itemYearText = [item.academicYear, item.examYear].map(normalize).join(' ');
      let score = 1000;
      let matched = 0;

      if (school && school !== 'unset' && itemSchool && (itemSchool === school || itemSchool.includes(school) || school.includes(itemSchool))) {
        score -= 450;
        matched++;
      }
      if (courseTokens.length > 0 && courseTokens.every((token) => itemCourseText.includes(token))) {
        score -= 420;
        matched++;
      } else if (courseTokens.some((token) => itemCourseText.includes(token))) {
        score -= 180;
        matched++;
      }
      if (yearTokens.length > 0 && yearTokens.some((token) => itemYearText.includes(token))) {
        score -= 160;
        matched++;
      }

      const historyMatch = searchHistory
        .map((entry, historyIndex) => {
          const context = typeof entry === 'string' ? { query: entry } : entry;
          const historyText = [context.query, context.school, context.course, context.yearOfStudy]
            .map(normalize)
            .filter(Boolean)
            .join(' ');
          const tokens = historyText.split(/\s+/).filter((token) => token.length > 1 && token !== 'unset');
          const matchedTokens = tokens.filter((token) => itemCourseText.includes(token) || itemSchool.includes(token) || itemYearText.includes(token));
          return { historyIndex, matchRatio: tokens.length ? matchedTokens.length / tokens.length : 0, matchedTokens: matchedTokens.length };
        })
        .filter((match) => match.matchedTokens > 0)
        .sort((a, b) => b.matchRatio - a.matchRatio || a.historyIndex - b.historyIndex)[0];
      if (historyMatch) {
        score -= Math.round(80 * historyMatch.matchRatio) + Math.max(20, 80 - historyMatch.historyIndex * 5);
        matched++;
      }

      const downloads = Number((item as any).downloads || (item as any).downloadsCount || 0);
      return { item, index, score, matched, downloads };
    })
    .sort((a, b) => b.matched - a.matched || a.score - b.score || b.downloads - a.downloads || a.index - b.index)
    .map(({ item }) => item);
}
