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

export function getGlobalSearchDestination(query: string, materialTypeOverride?: string): string {
  const encodedQuery = encodeURIComponent(query.trim());
  const parsed = parseSmartSearchQuery(query);
  const materialType = materialTypeOverride || parsed.materialType;

  // If parsed intent specifically found a material type:
  if (materialType === 'cat') return `/cat-papers?search=${encodedQuery}`;
  if (materialType === 'past_paper') return `/past-papers?search=${encodedQuery}`;
  if (materialType === 'notes') return `/(tabs)/academics?search=${encodedQuery}`;
  if (materialType === 'solution') return `/past-papers?search=${encodedQuery}`;

  const idCategory = getMaterialCategoryFromId(query);
  if (idCategory === 'past_paper') return `/past-papers?search=${encodedQuery}`;
  if (idCategory === 'notes') return `/(tabs)/academics?search=${encodedQuery}`;
  if (idCategory === 'cat') return `/cat-papers?search=${encodedQuery}`;

  const hasPhrase = (words: string[]) => words.some((word) => {
    const escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(query);
  });
  if (hasPhrase(['rent', 'rental', 'house', 'hostel', 'accommodation', 'room', 'bedsitter', 'apartment', 'housing', 'landlord', 'stage', 'kesses', 'mabs'])) {
    return `/rentals?search=${encodedQuery}`;
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

export const SEARCH_STOP_WORDS = new Set([
  'and', 'the', 'of', 'in', 'for', 'to', 'with', 'a', 'an', 'at', 'by', 'from',
  'on', 'or', 'as', 'is', 'it', 'all', 'any', 'are', 'be', 'but', 'not', 'that', 'this'
]);

export function extractMeaningfulSearchTokens(query: string): { allTokens: string[]; meaningfulTokens: string[] } {
  const norm = normalize(query);
  const allTokens = norm.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
  const meaningful = allTokens.filter((t) => !SEARCH_STOP_WORDS.has(t));
  return {
    allTokens,
    meaningfulTokens: meaningful.length > 0 ? meaningful : allTokens
  };
}

export interface MaterialMatchMetrics {
  exactMtid: boolean;
  exactUnitCode: boolean;
  exactPhraseInTitle: boolean;
  titleStartsWithQuery: boolean;
  matchedTitleWordsCount: number;
  matchedCodeWordsCount: number;
  matchedTotalWordsCount: number;
  meaningfulQueryWordsCount: number;
  matchScore: number | null;
}

export interface CompiledSearchQueryContext {
  q: string;
  normalizedQueryId: string;
  intent: ParsedSearchIntent;
  meaningfulTokens: string[];
  meaningfulRegexes: RegExp[];
  activeTokens: string[];
  activeTokenRegexes: RegExp[];
  intentSchoolNorm: string;
  intentDeptNorm: string;
  intentPrefix: string;
  targetCodeNorm: string;
  targetNameNorm: string;
}

export function compileSearchQueryContext(query: string, parsedIntent?: ParsedSearchIntent): CompiledSearchQueryContext {
  const q = normalize(query);
  const intent = parsedIntent || parseSmartSearchQuery(query);
  const { meaningfulTokens } = extractMeaningfulSearchTokens(query);

  const meaningfulRegexes = meaningfulTokens.map((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  });

  const queryTokens = q.split(/\s+/).filter((token) => token.length > 1 && !SEARCH_STOP_WORDS.has(token));
  const activeTokens = queryTokens.length > 0 ? queryTokens : q.split(/\s+/).filter((t) => t.length > 1);
  const activeTokenRegexes = activeTokens.map((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s|[._-])${escaped}`, 'i');
  });

  return {
    q,
    normalizedQueryId: normalizeId(q),
    intent,
    meaningfulTokens,
    meaningfulRegexes,
    activeTokens,
    activeTokenRegexes,
    intentSchoolNorm: intent.school ? normalizeSchoolName(intent.school) : '',
    intentDeptNorm: intent.department ? normalize(intent.department) : '',
    intentPrefix: (intent.unitCode || '').replace(/[^a-zA-Z]/g, '').toUpperCase(),
    targetCodeNorm: intent.unitCode ? normalizeId(intent.unitCode) : '',
    targetNameNorm: intent.unitName ? normalize(intent.unitName) : ''
  };
}

/**
 * Calculates exact word match counts and priority tiers for an item against a search query.
 * Counts how many meaningful query words match in the Title, Unit Code, and other fields.
 */
export function calculateMaterialMatchMetrics(
  item: MaterialSearchFields,
  query: string,
  parsedIntent?: ParsedSearchIntent,
  compiledContext?: CompiledSearchQueryContext
): MaterialMatchMetrics {
  const ctx = compiledContext || compileSearchQueryContext(query, parsedIntent);
  const { q, normalizedQueryId, intent, meaningfulTokens, meaningfulRegexes } = ctx;

  const id = normalizeId(item.mtid);
  const exactMtid = Boolean(id && normalizedQueryId && id === normalizedQueryId);

  const itemUnitCodeNorm = normalizeId(item.unitCode);
  const itemCourseCodeNorm = normalizeId(item.courseCode);
  const exactUnitCode = Boolean(
    (normalizedQueryId && (itemUnitCodeNorm === normalizedQueryId || itemCourseCodeNorm === normalizedQueryId)) ||
    (ctx.targetCodeNorm && (itemUnitCodeNorm === ctx.targetCodeNorm || itemCourseCodeNorm === ctx.targetCodeNorm))
  );

  const itemTitle = normalize(item.title);
  const itemUnitName = normalize(item.unitName);
  const exactPhraseInTitle = Boolean(
    q.length >= 3 && (itemTitle.includes(q) || itemUnitName.includes(q))
  );
  const titleStartsWithQuery = Boolean(
    q.length >= 3 && (itemTitle.startsWith(q) || itemUnitName.startsWith(q))
  );

  const itemUnitCodeRaw = normalize(item.unitCode);
  const itemCourseCodeRaw = normalize(item.courseCode);
  const allFieldsText = `${itemTitle} ${itemUnitCodeRaw} ${itemCourseCodeRaw} ${itemUnitName} ${normalize(item.school)} ${normalize(item.department)} ${normalize(item.description)}`;

  let matchedTitleWordsCount = 0;
  let matchedCodeWordsCount = 0;
  let matchedTotalWordsCount = 0;

  for (let i = 0; i < meaningfulRegexes.length; i++) {
    const wordBoundaryRegex = meaningfulRegexes[i];
    const inTitleOrUnit = wordBoundaryRegex.test(itemTitle) || wordBoundaryRegex.test(itemUnitName);
    const inCode = wordBoundaryRegex.test(itemUnitCodeRaw) || wordBoundaryRegex.test(itemCourseCodeRaw);
    const inAny = inTitleOrUnit || inCode || wordBoundaryRegex.test(allFieldsText);

    if (inTitleOrUnit) matchedTitleWordsCount += 1;
    if (inCode) matchedCodeWordsCount += 1;
    if (inAny) matchedTotalWordsCount += 1;
  }

  const matchScore = getMaterialSearchScore(item, query, intent, ctx);

  return {
    exactMtid,
    exactUnitCode,
    exactPhraseInTitle,
    titleStartsWithQuery,
    matchedTitleWordsCount,
    matchedCodeWordsCount,
    matchedTotalWordsCount,
    meaningfulQueryWordsCount: meaningfulTokens.length,
    matchScore
  };
}

/** Lower scores are better. Exact MTID, Canonical Unit Code, and title keyword matches are ranked ahead of generic school fallbacks. */
export function getMaterialSearchScore(
  item: MaterialSearchFields,
  query: string,
  parsedIntent?: ParsedSearchIntent,
  compiledContext?: CompiledSearchQueryContext
): number | null {
  const ctx = compiledContext || compileSearchQueryContext(query, parsedIntent);
  const { q, normalizedQueryId, intent, activeTokens, activeTokenRegexes } = ctx;
  if (!q) return 0;

  const id = normalizeId(item.mtid);
  if (id && normalizedQueryId && id === normalizedQueryId) return 0;

  const itemUnitCodeNorm = normalizeId(item.unitCode);
  const itemCourseCodeNorm = normalizeId(item.courseCode);
  const itemSchoolNorm = normalizeSchoolName(item.school);
  const intentSchoolNorm = ctx.intentSchoolNorm;
  const itemDeptNorm = normalize(item.department);
  const intentDeptNorm = ctx.intentDeptNorm;

  const itemUnitCodeRaw = String(item.unitCode || item.courseCode || '').toLowerCase();
  const itemTitle = normalize(item.title);
  const itemUnitName = normalize(item.unitName);
  const itemExamYear = String(item.examYear || '');
  const itemSemester = normalize(item.semester);
  const itemPrefix = (item.unitCode || item.courseCode || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const intentPrefix = ctx.intentPrefix;

  // 1. Exact Course Code / Unit Code Match (HIGHEST PRIORITY)
  // e.g. "MAT 210", "MAT210", "CSC 214"
  if (normalizedQueryId && (itemUnitCodeNorm === normalizedQueryId || itemCourseCodeNorm === normalizedQueryId)) {
    return 1;
  }
  if (ctx.targetCodeNorm) {
    if (itemUnitCodeNorm === ctx.targetCodeNorm || itemCourseCodeNorm === ctx.targetCodeNorm) {
      return 1;
    }
  }

  // 2. Unit Code Prefix or Sub-Code Match
  // e.g. "CSC 2" or "MAT"
  if (normalizedQueryId && normalizedQueryId.length >= 2) {
    if (itemUnitCodeNorm.startsWith(normalizedQueryId) || itemCourseCodeNorm.startsWith(normalizedQueryId)) {
      return 2;
    }
  }

  // 3. Document Title / Unit Name Exact or Starts-With Match (SECOND PRIORITY)
  // e.g. "Formal Language and Automata theory"
  if (itemTitle === q || itemUnitName === q) {
    return 3;
  }
  if (itemTitle.startsWith(q) || itemUnitName.startsWith(q)) {
    return 4;
  }
  if (itemTitle.includes(q) || itemUnitName.includes(q)) {
    return 5;
  }

  // If parsed intent matched a unit name from dictionary
  if (ctx.targetNameNorm) {
    if (itemTitle.includes(ctx.targetNameNorm) || itemUnitName.includes(ctx.targetNameNorm)) {
      return 5;
    }
  }

  // 4. Same unit prefix (e.g. searching "CSC 111", item is "CSC 214")
  if (intentPrefix && itemPrefix && itemPrefix === intentPrefix) {
    if (intentSchoolNorm && itemSchoolNorm && intentSchoolNorm === itemSchoolNorm) {
      return 6;
    }
    return 7;
  }

  // Word boundary regex matching to evaluate query keywords BEFORE school fallback
  const fields = [
    item.title, item.unitCode, item.unitName, item.school, item.department,
    item.courseCode, item.semester, item.academicYear, item.examYear,
    item.type, item.description, item.author
  ].map(normalize).filter(Boolean);

  let matchedTokensCount = 0;
  let titleOrCodeTokensCount = 0;

  for (let i = 0; i < activeTokenRegexes.length; i++) {
    const wordRegex = activeTokenRegexes[i];
    if (fields.some((field) => wordRegex.test(field))) {
      matchedTokensCount += 1;
    }
    if (wordRegex.test(itemTitle) || wordRegex.test(itemUnitCodeRaw) || wordRegex.test(itemUnitName)) {
      titleOrCodeTokensCount += 1;
    }
  }

  const hasYearIntent = Boolean(intent.examYear && itemExamYear === String(intent.examYear));
  const hasSemesterIntent = Boolean(intent.semester && itemSemester.includes(normalize(intent.semester)));
  const hasSchoolOrDeptIntent = Boolean(intentSchoolNorm || intentDeptNorm);
  const schoolConflicts = hasSchoolOrDeptIntent && itemSchoolNorm && intentSchoolNorm && itemSchoolNorm !== intentSchoolNorm;

  // 5. Keyword Matching in Title / Unit Code (THIRD PRIORITY)
  if (activeTokens.length > 0 && matchedTokensCount === activeTokens.length) {
    let score = titleOrCodeTokensCount === activeTokens.length ? 5 : 6;
    if (hasYearIntent || hasSemesterIntent) score -= 1;
    return schoolConflicts ? score + 6 : score;
  }

  if (activeTokens.length > 0 && matchedTokensCount >= Math.max(1, Math.ceil(activeTokens.length / 2))) {
    let score = titleOrCodeTokensCount > 0 ? 6 : 7;
    if (hasYearIntent || hasSemesterIntent) score -= 1;
    return schoolConflicts ? score + 6 : score;
  }

  // 6. School and Department match (Only when user explicitly targeted school or as loose fallback)
  const userExplicitSchool = intent.school && q.includes(normalize(intent.school).slice(0, 8));
  const userExplicitDept = intent.department && q.includes(normalize(intent.department).slice(0, 8));
  const schoolMatches = Boolean(intentSchoolNorm && itemSchoolNorm && intentSchoolNorm === itemSchoolNorm);
  const deptMatches = Boolean(intentDeptNorm && itemDeptNorm && (itemDeptNorm.includes(intentDeptNorm) || intentDeptNorm.includes(itemDeptNorm)));

  if ((userExplicitSchool || userExplicitDept) && schoolMatches && deptMatches) return 6;
  if (userExplicitDept && deptMatches) return 7;
  if (userExplicitSchool && schoolMatches) return 8;

  if (schoolMatches && deptMatches) return 8;
  if (deptMatches) return 9;
  if (schoolMatches && !schoolConflicts) return 9;

  if (hasYearIntent || hasSemesterIntent) {
    return schoolConflicts ? null : 10;
  }

  return null;
}

/**
 * Smart Multi-Tiered Search Ranker:
 * Counts matching words smartly and ranks strictly from most matching words to least.
 * 1. Exact MTID / Exact Unit Code
 * 2. Exact Title Phrase Match
 * 3. Title Starts-With
 * 4. Title / Unit Code Meaningful Word Match Count (DESCENDING - 5 words > 4 words > 3 words > 2 words > 1 word)
 * 5. Total Word Match Count (DESCENDING)
 * 6. Match Score (lower score is better)
 * 7. Downloads & Rating (tie-breaker only when words matched and tiers are identical)
 * 8. Stable index (NEVER randomly shuffled)
 */
export function rankMaterials<T extends MaterialSearchFields>(
  items: T[],
  query: string,
  parsedIntent?: ParsedSearchIntent,
  compiledContext?: CompiledSearchQueryContext
): T[] {
  if (!query.trim()) return items;
  const cleanQ = query.trim();
  const intent = parsedIntent || parseSmartSearchQuery(cleanQ);
  const ctx = compiledContext || compileSearchQueryContext(cleanQ, intent);

  return items
    .map((item, index) => {
      const metrics = calculateMaterialMatchMetrics(item, cleanQ, intent, ctx);
      if (
        metrics.matchScore === null &&
        metrics.matchedTotalWordsCount === 0 &&
        !metrics.exactUnitCode &&
        !metrics.exactMtid
      ) {
        return null;
      }

      const downloads = Number((item as any).downloads || (item as any).downloadsCount || 0);
      const rating = Number((item as any).ratingScore || (item as any).rating || 4.0);

      return {
        item,
        index,
        metrics,
        downloads,
        rating
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => {
      // 1. Exact MTID
      if (a.metrics.exactMtid !== b.metrics.exactMtid) {
        return a.metrics.exactMtid ? -1 : 1;
      }

      // 2. Exact Unit Code
      if (a.metrics.exactUnitCode !== b.metrics.exactUnitCode) {
        return a.metrics.exactUnitCode ? -1 : 1;
      }

      // 3. Exact Phrase in Title / Unit Name
      if (a.metrics.exactPhraseInTitle !== b.metrics.exactPhraseInTitle) {
        return a.metrics.exactPhraseInTitle ? -1 : 1;
      }

      // 4. Starts with in Title
      if (a.metrics.titleStartsWithQuery !== b.metrics.titleStartsWithQuery) {
        return a.metrics.titleStartsWithQuery ? -1 : 1;
      }

      // 5. WORD COUNT MATCH in Title / Code (DESCENDING - Most words matched wins!)
      const titleWordDiff = (b.metrics.matchedTitleWordsCount + b.metrics.matchedCodeWordsCount) -
                            (a.metrics.matchedTitleWordsCount + a.metrics.matchedCodeWordsCount);
      if (titleWordDiff !== 0) return titleWordDiff;

      // 6. TOTAL WORD COUNT MATCH across all fields (DESCENDING)
      const totalWordDiff = b.metrics.matchedTotalWordsCount - a.metrics.matchedTotalWordsCount;
      if (totalWordDiff !== 0) return totalWordDiff;

      // 7. Match Score (lower score is better)
      const aScore = a.metrics.matchScore ?? 99;
      const bScore = b.metrics.matchScore ?? 99;
      if (aScore !== bScore) return aScore - bScore;

      // 8. Tie-breaker when word matches and scores are identical:
      const dlDiff = b.downloads - a.downloads;
      if (Math.abs(dlDiff) > 50) return dlDiff;

      const ratingDiff = b.rating - a.rating;
      if (Math.abs(ratingDiff) > 0.05) return ratingDiff;

      // 9. Deterministic tie-breaker: NEVER shuffle or randomize
      return a.index - b.index;
    })
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
// Known mappings between Moi University course keywords and unit code prefixes.
const MOI_COURSE_PREFIX_MAP: Array<{ keywords: string[]; prefixes: string[] }> = [
  {
    keywords: ['computer', 'computing', 'software', 'informatics', 'csc'],
    prefixes: ['CSC', 'COM', 'INF', 'INS']
  },
  {
    keywords: ['information sciences', 'information science', 'it', 'informatics', 'media', 'publishing', 'sis'],
    prefixes: ['INS', 'INF', 'COM', 'LIS', 'PUB']
  },
  {
    keywords: ['electrical', 'electronics', 'telecommunication', 'telecom', 'ece'],
    prefixes: ['ECE', 'TEL', 'EEE', 'ENG']
  },
  {
    keywords: ['mechanical', 'production', 'civil', 'mechatronics', 'engineering'],
    prefixes: ['MEC', 'CIV', 'ENG']
  },
  {
    keywords: ['mathematics', 'maths', 'statistics', 'actuarial', 'math'],
    prefixes: ['MAT', 'STA', 'ACS']
  },
  {
    keywords: ['chemistry', 'biochemistry', 'analytical chemistry'],
    prefixes: ['CHE', 'BCH']
  },
  {
    keywords: ['physics', 'renewable energy'],
    prefixes: ['PHY', 'REN']
  },
  {
    keywords: ['education', 'teaching', 'pedagogy', 'curriculum'],
    prefixes: ['EDE', 'EDF', 'EDK', 'EDC', 'CIM', 'PSY']
  },
  {
    keywords: ['business', 'commerce', 'accounting', 'finance', 'management', 'economics', 'marketing', 'hr'],
    prefixes: ['BBM', 'ECO', 'ACC', 'FIN', 'HRM', 'MKT']
  },
  {
    keywords: ['law', 'legal', 'sol'],
    prefixes: ['LAW', 'BLL']
  },
  {
    keywords: ['medicine', 'surgery', 'mbchb', 'medical', 'som'],
    prefixes: ['MED', 'SUR', 'ANA', 'PAT']
  },
  {
    keywords: ['nursing', 'son'],
    prefixes: ['NUR']
  },
  {
    keywords: ['public health', 'sph', 'environmental health'],
    prefixes: ['SPH', 'EHS']
  },
  {
    keywords: ['kiswahili', 'swahili'],
    prefixes: ['KIS', 'BKS']
  },
  {
    keywords: ['literature', 'french', 'linguistics', 'languages', 'film'],
    prefixes: ['LIT', 'FRE', 'LIN', 'BLL', 'FMS']
  },
  {
    keywords: ['anthropology', 'sociology', 'social work', 'community development'],
    prefixes: ['ANT', 'SOC', 'SWK', 'CMD']
  }
];

/** Extract all relevant course prefixes and keywords from user's course string. */
function extractUserCoursePrefixes(rawCourse?: string): { prefixes: string[]; meaningfulWords: string[] } {
  const norm = normalize(rawCourse);
  if (!norm || norm === 'unset') return { prefixes: [], meaningfulWords: [] };

  const prefixes = new Set<string>();

  // 1. Direct 2-4 uppercase letter prefixes if present (e.g. "CSC", "ECE", "BBM")
  const directCodeMatches = String(rawCourse || '').match(/\b([A-Z]{2,4})\b/g);
  if (directCodeMatches) {
    directCodeMatches.forEach((code) => prefixes.add(code.toUpperCase()));
  }

  // 2. Keyword-based matching from master map
  for (const entry of MOI_COURSE_PREFIX_MAP) {
    if (entry.keywords.some((kw) => norm.includes(kw))) {
      entry.prefixes.forEach((p) => prefixes.add(p));
    }
  }

  // 3. Meaningful words for text matching
  const stopWords = new Set(['bsc', 'bachelor', 'of', 'in', 'and', 'degree', 'studies', 'unset', 'moi', 'university', 'science']);
  const meaningfulWords = norm
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return { prefixes: Array.from(prefixes), meaningfulWords };
}

/**
 * Smart Multi-Tiered Profile Recommendation Algorithm:
 * 1. Course Code / Course Unit Match (Priority #1 - 100% Top Matches, with Year level on top)
 * 2. School / Faculty Match (Priority #2)
 * 3. Search History / Active Revision Match (Priority #3)
 * 4. General Popular Campus Materials (Priority #4)
 * Strict descending waterfall (no random shuffling).
 */
export function rankMaterialsForProfile<T extends MaterialSearchFields>(
  items: T[],
  profile?: { school?: string; course?: string; yearOfStudy?: string } | null,
  searchHistory: Array<string | MaterialSearchHistoryEntry> = []
): T[] {
  const userSchool = profile?.school && profile.school !== 'Unset' ? normalizeSchoolName(profile.school) : '';
  const { prefixes: targetPrefixes, meaningfulWords: courseWords } = extractUserCoursePrefixes(profile?.course);
  const userYearMatch = String(profile?.yearOfStudy || '').match(/[1-6]/);
  const userYearDigit = userYearMatch ? userYearMatch[0] : null;

  return items
    .map((item, index) => {
      const itemCode = normalize(item.unitCode || item.courseCode || (item as any).code);
      const itemCodeDense = itemCode.replace(/[^a-z0-9]/g, '').toUpperCase();
      const itemPrefix = itemCode.replace(/[^a-z]/g, '').toUpperCase();
      const itemYearDigitMatch = itemCode.match(/\d/);
      const itemYearDigit = itemYearDigitMatch ? itemYearDigitMatch[0] : null;
      const itemSchool = normalizeSchoolName(item.school || item.department);
      const itemTitleNorm = normalize(item.title);
      const itemUnitNameNorm = normalize(item.unitName);
      const itemFullText = [item.title, item.unitCode, item.unitName, item.department, item.courseCode, (item as any).code]
        .map(normalize)
        .join(' ');

      let tierScore = 900;
      let matchLabel = '✨ Recommended';
      let matched = 0;

      // --- TIER 1: COURSE MATCH (HIGHEST PRIORITY) ---
      const hasPrefixMatch = targetPrefixes.length > 0 && targetPrefixes.some((p) => itemPrefix === p || itemCodeDense.startsWith(p));
      const hasCourseWordMatch = courseWords.length > 0 && courseWords.every((w) => itemFullText.includes(w));
      const hasPartialCourseWordMatch = courseWords.length > 0 && courseWords.some((w) => itemTitleNorm.includes(w) || itemUnitNameNorm.includes(w));

      if (hasPrefixMatch && userYearDigit && itemYearDigit === userYearDigit) {
        // TIER 1A: 100% Perfect Match - Course Code AND Year of Study match
        tierScore = 10;
        matchLabel = `🎯 100% Match • Yr ${userYearDigit}`;
        matched = 4;
      } else if (hasPrefixMatch) {
        // TIER 1B: Course Code Match (Other years of the same course)
        tierScore = 50;
        matchLabel = '📚 Course Unit';
        matched = 3;
      } else if (hasCourseWordMatch) {
        // TIER 1C: All course title words match item
        tierScore = 80;
        matchLabel = '📚 Course Match';
        matched = 3;
      } else if (hasPartialCourseWordMatch) {
        // TIER 1D: Partial course title word match
        tierScore = 120;
        matchLabel = '📚 Course Related';
        matched = 2;
      }
      // --- TIER 2: SCHOOL / FACULTY MATCH ---
      else if (userSchool && itemSchool && (itemSchool === userSchool || itemSchool.includes(userSchool) || userSchool.includes(itemSchool))) {
        tierScore = 250;
        matchLabel = '🏫 Faculty Match';
        matched = 2;
      }

      // --- TIER 3: SEARCH HISTORY MATCH ---
      if (searchHistory.length > 0) {
        const historyHits = searchHistory.filter((entry) => {
          const qText = normalize(typeof entry === 'string' ? entry : entry.query);
          return qText.length > 2 && (itemFullText.includes(qText) || qText.includes(itemCode));
        });
        if (historyHits.length > 0) {
          if (tierScore > 350) {
            tierScore = 350;
            matchLabel = '🔍 From Search';
          }
          matched += 1;
        }
      }

      // --- TIER 4: GENERAL CAMPUS POPULAR ---
      if (tierScore >= 900) {
        matchLabel = (item as any).mtid ? `MTID: ${(item as any).mtid}` : '🔥 Campus Popular';
      }

      const downloads = Number((item as any).downloads || (item as any).downloadsCount || 0);
      const rating = Number((item as any).ratingScore || (item as any).rating || 4.5);

      // Clone item with dynamically assigned recommendation tag
      const enrichedItem = {
        ...item,
        recommendationTag: matchLabel
      };

      return {
        item: enrichedItem,
        index,
        tierScore,
        matched,
        downloads,
        rating
      };
    })
    // Strict Downwards Waterfall: Tier Score FIRST -> Downloads SECOND -> Rating THIRD
    .sort((a, b) => a.tierScore - b.tierScore || b.downloads - a.downloads || b.rating - a.rating || a.index - b.index)
    .map(({ item }) => item);
}

export interface SearchRecommendationBlock<T> {
  kind: 'grid' | 'carousel';
  title?: string;
  subtitle?: string;
  items: T[];
}

export interface SearchRecommendationSections<T> {
  youMayAlsoLike: T[];
  continuationFeed: T[];
  feedBlocks: SearchRecommendationBlock<T>[];
  contextLabel: string;
}

/**
 * YouTube-style smart search recommendation engine:
 * At the end of matching search results, generates:
 * 1. "You May Also Like" - Auto-scrolling horizontal cards of closest related materials (same school, dept, prefix).
 * 2. "Continuation Feed" - Endless grid continuation so the feed never abruptly stops.
 */
export function getSearchRecommendationSections<T extends MaterialSearchFields>(
  allPool: T[],
  matchingItems: T[],
  query: string,
  parsedIntent?: ParsedSearchIntent,
  profile?: { school?: string; course?: string; yearOfStudy?: string } | null,
  searchHistory: Array<string | MaterialSearchHistoryEntry> = []
): SearchRecommendationSections<T> {
  const intent = parsedIntent || parseSmartSearchQuery(query);
  const matchedIds = new Set(matchingItems.map((m) => String((m as any).id || (m as any)._id || m.mtid || '')));

  // Deduplicated pool excluding direct search matches
  const remaining: T[] = [];
  const seenIds = new Set<string>();
  allPool.forEach((item) => {
    const id = String((item as any).id || (item as any)._id || item.mtid || '');
    if (!id || matchedIds.has(id) || seenIds.has(id)) return;
    seenIds.add(id);
    remaining.push(item);
  });

  // Identify dominant context school & department from intent or top matching items
  const primarySchool = normalizeSchoolName(intent.school || (matchingItems[0]?.school ? normalizeSchoolName(matchingItems[0].school) : ''));
  const primaryDept = normalize(intent.department || matchingItems[0]?.department || '');
  const primaryPrefix = (intent.unitCode || matchingItems[0]?.unitCode || matchingItems[0]?.courseCode || '').replace(/[^a-zA-Z]/g, '').toUpperCase();

  const contextLabel = intent.school
    ? intent.school
    : (intent.unitCode || intent.department || (primarySchool ? primarySchool : 'your search'));

  // Relatedness scoring: Closest to the search context
  const scoredRemaining = remaining.map((item, index) => {
    const itemSchool = normalizeSchoolName(item.school);
    const itemDept = normalize(item.department);
    const itemPrefix = (item.unitCode || item.courseCode || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const downloads = Number((item as any).downloads || (item as any).downloadsCount || 0);
    const rating = Number((item as any).ratingScore || (item as any).rating || 4.5);

    let relatedScore = 1000;

    // 1. Same School bonus
    if (primarySchool && itemSchool && (itemSchool === primarySchool || itemSchool.includes(primarySchool) || primarySchool.includes(itemSchool))) {
      relatedScore -= 500;
    }
    // 2. Same unit prefix or department bonus
    if (primaryPrefix && itemPrefix && (itemPrefix === primaryPrefix || primaryPrefix.slice(0, 2) === itemPrefix.slice(0, 2))) {
      relatedScore -= 300;
    }
    if (primaryDept && itemDept && (itemDept.includes(primaryDept) || primaryDept.includes(itemDept))) {
      relatedScore -= 200;
    }

    return { item, index, relatedScore, downloads, rating };
  });

  // Sort by relatedness, then downloads/ratings
  const sortedByRelatedness = [...scoredRemaining].sort((a, b) =>
    a.relatedScore - b.relatedScore || b.downloads - a.downloads || b.rating - a.rating || a.index - b.index
  );

  // Intelligently distribute between "You May Also Like" carousel and the continuation feed
  // so BOTH sections are guaranteed to have content whenever materials exist.
  const totalCount = sortedByRelatedness.length;
  let carouselCount = 0;
  if (totalCount >= 10) {
    carouselCount = 6;
  } else if (totalCount >= 6) {
    carouselCount = Math.min(4, Math.floor(totalCount / 2));
  } else if (totalCount >= 2) {
    carouselCount = Math.floor(totalCount / 2);
  } else if (totalCount === 1) {
    // Keep the only available recommendation in the scrolling continuation
    // so search never ends with a lone carousel card and no follow-on feed.
    carouselCount = 0;
  }

  const youMayAlsoLike = sortedByRelatedness.slice(0, carouselCount).map((e) => e.item);
  const carouselIds = new Set(youMayAlsoLike.map((item) => String((item as any).id || (item as any)._id || item.mtid || '')));

  // The rest form the endless continuation feed, personalized by profile and popularity
  let continuationPool = remaining.filter((item) => !carouselIds.has(String((item as any).id || (item as any)._id || item.mtid || '')));

  // If continuation feed would be empty but carousel has more than 1 item, share with continuation feed
  if (continuationPool.length === 0 && youMayAlsoLike.length > 1) {
    const moved = youMayAlsoLike.pop()!;
    continuationPool.push(moved);
  }

  const continuationFeed = rankMaterialsForProfile(continuationPool, profile, searchHistory);

  // Break up long endless grid into engaging rhythm of grid blocks interspersed with horizontal carousels
  const carouselThemes = [
    { title: 'Based on Your Profile', subtitle: 'Personalized recommendations for your course and year' },
    { title: 'Recently Searched & Related', subtitle: 'Topics connected to your active revision searches' },
    { title: 'Top Rated by Campus Students', subtitle: 'Highest community ratings and revision guides' },
    { title: 'Popular Examination Materials', subtitle: 'Most downloaded resources across university faculties' }
  ];

  const feedBlocks: SearchRecommendationBlock<T>[] = [];
  let feedCursor = 0;
  let themeIndex = 0;
  const GRID_CHUNK_SIZE = 6;
  const CAROUSEL_CHUNK_SIZE = 4;

  while (feedCursor < continuationFeed.length) {
    // 1. First append a grid chunk
    const gridChunk = continuationFeed.slice(feedCursor, feedCursor + GRID_CHUNK_SIZE);
    feedBlocks.push({
      kind: 'grid',
      items: gridChunk
    });
    feedCursor += gridChunk.length;

    // 2. In search recommendations, insert at most 1 curated carousel section to avoid multi-interval layout thrashing
    if (feedCursor < continuationFeed.length && themeIndex < 1) {
      const carouselChunk = continuationFeed.slice(feedCursor, feedCursor + CAROUSEL_CHUNK_SIZE);
      if (carouselChunk.length >= 2) {
        const theme = carouselThemes[themeIndex % carouselThemes.length];
        feedBlocks.push({
          kind: 'carousel',
          title: theme.title,
          subtitle: theme.subtitle,
          items: carouselChunk
        });
        themeIndex += 1;
        feedCursor += carouselChunk.length;
      }
    }
  }

  return {
    youMayAlsoLike,
    continuationFeed,
    feedBlocks,
    contextLabel
  };
}
