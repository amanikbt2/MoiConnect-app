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

  const itemUnitCodeRaw = String(item.unitCode || item.courseCode || '').toLowerCase();
  const itemTitle = normalize(item.title);
  const itemUnitName = normalize(item.unitName);
  const itemExamYear = String(item.examYear || '');
  const itemSemester = normalize(item.semester);
  const itemPrefix = (item.unitCode || item.courseCode || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const intentPrefix = (intent.unitCode || '').replace(/[^a-zA-Z]/g, '').toUpperCase();

  // 1. Exact Course Code / Unit Code Match (HIGHEST PRIORITY)
  // e.g. "MAT 210", "MAT210", "CSC 214"
  if (normalizedQueryId && (itemUnitCodeNorm === normalizedQueryId || itemCourseCodeNorm === normalizedQueryId)) {
    return 1;
  }
  if (intent.unitCode) {
    const targetCodeNorm = normalizeId(intent.unitCode);
    if (itemUnitCodeNorm === targetCodeNorm || itemCourseCodeNorm === targetCodeNorm) {
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
  if (intent.unitName) {
    const targetNameNorm = normalize(intent.unitName);
    if (itemTitle.includes(targetNameNorm) || itemUnitName.includes(targetNameNorm)) {
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

  // 5. School and Department match when school/department intent was recognized
  const schoolMatches = Boolean(intentSchoolNorm && itemSchoolNorm && intentSchoolNorm === itemSchoolNorm);
  const deptMatches = Boolean(intentDeptNorm && itemDeptNorm && (itemDeptNorm.includes(intentDeptNorm) || intentDeptNorm.includes(itemDeptNorm)));

  if (schoolMatches && deptMatches) return 6;
  if (deptMatches) return 7;
  if (schoolMatches) return 8;

  // 6. Year and Semester matches (THIRD PRIORITY)
  const hasYearIntent = Boolean(intent.examYear && itemExamYear === String(intent.examYear));
  const hasSemesterIntent = Boolean(intent.semester && itemSemester.includes(normalize(intent.semester)));

  // If user searched for a school or department, penalize or exclude papers from conflicting schools
  const hasSchoolOrDeptIntent = Boolean(intentSchoolNorm || intentDeptNorm);
  const schoolConflicts = hasSchoolOrDeptIntent && itemSchoolNorm && intentSchoolNorm && itemSchoolNorm !== intentSchoolNorm;

  const fields = [
    item.title, item.unitCode, item.unitName, item.school, item.department,
    item.courseCode, item.semester, item.academicYear, item.examYear,
    item.type, item.description, item.author
  ].map(normalize).filter(Boolean);

  const queryTokens = q.split(/\s+/).filter((token) => token.length > 1);
  
  // Word boundary regex matching to avoid arbitrary fragments matching (e.g. 'mat' in 'automata')
  const matchedTokens = queryTokens.filter((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = new RegExp(`(^|\\s|[._-])${escaped}`, 'i');
    return fields.some((field) => wordRegex.test(field));
  });

  const titleOrCodeTokens = queryTokens.filter((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = new RegExp(`(^|\\s|[._-])${escaped}`, 'i');
    return wordRegex.test(itemTitle) || wordRegex.test(itemUnitCodeRaw) || wordRegex.test(itemUnitName);
  });

  // 7. General Keywords Matching (FOURTH PRIORITY)
  if (queryTokens.length > 0 && matchedTokens.length === queryTokens.length) {
    let score = titleOrCodeTokens.length === queryTokens.length ? 7 : 8;
    if (hasYearIntent || hasSemesterIntent) score -= 1;
    return schoolConflicts ? score + 6 : score;
  }

  // Partial word matches
  if (matchedTokens.length >= Math.max(1, Math.ceil(queryTokens.length / 2))) {
    let score = titleOrCodeTokens.length > 0 ? 9 : 10;
    if (hasYearIntent || hasSemesterIntent) score -= 1;
    return schoolConflicts ? score + 6 : score;
  }

  if (hasYearIntent || hasSemesterIntent) {
    return schoolConflicts ? null : 10;
  }

  return null;
}

export function rankMaterials<T extends MaterialSearchFields>(items: T[], query: string, parsedIntent?: ParsedSearchIntent): T[] {
  if (!query.trim()) return items;
  const intent = parsedIntent || parseSmartSearchQuery(query);
  const currentYear = new Date().getFullYear();

  return items
    .map((item, index) => {
      const matchScore = getMaterialSearchScore(item, query, intent);
      if (matchScore === null) return null;

      const downloads = Number((item as any).downloads || (item as any).downloadsCount || 0);
      const rating = Number((item as any).ratingScore || (item as any).rating || 4.0);
      const examYear = Number(item.examYear || 0);

      // 1. Normalized Relevance: matchScore is 0..10 (0 is perfect MTID, 1 is exact code, 10 is loosest)
      // Convert to 0..1 scale where 1 is highest relevance
      const normRelevance = Math.max(0, 1 - (matchScore / 10));

      // 2. Normalized Popularity: log scale of downloads (0 to 10k+) + rating (0 to 10)
      const normDownloads = Math.min(1, Math.log10(Math.max(1, downloads) + 1) / 4); // 10,000 DLs = 1.0
      const normRating = Math.min(1, rating / 10);
      const normPopularity = (normDownloads * 0.7) + (normRating * 0.3);

      // 3. Normalized Freshness: recent exam years (2020 - 2026+) get high freshness score
      let normFreshness = 0.5;
      if (examYear >= 2000) {
        const yearDiff = currentYear - examYear;
        normFreshness = Math.max(0, Math.min(1, 1 - (yearDiff / 15)));
      }

      // Composite Weighted Score: 65% Relevance + 20% Popularity + 15% Freshness
      // Higher composite score ranks first
      const compositeScore = (normRelevance * 0.65) + (normPopularity * 0.20) + (normFreshness * 0.15);

      return {
        item,
        index,
        matchScore,
        downloads,
        compositeScore
      };
    })
    .filter((entry): entry is { item: T; index: number; matchScore: number; downloads: number; compositeScore: number } => entry !== null)
    .sort((a, b) => {
      // Primary tier check: if one is exact MTID/unitCode (matchScore <= 1) and other is not, exact always wins
      if (a.matchScore <= 1 && b.matchScore > 1) return -1;
      if (b.matchScore <= 1 && a.matchScore > 1) return 1;

      // Otherwise sort by composite score (descending)
      const diff = b.compositeScore - a.compositeScore;
      if (Math.abs(diff) > 0.005) return diff;
      return b.downloads - a.downloads || a.index - b.index;
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

export interface SearchRecommendationSections<T> {
  youMayAlsoLike: T[];
  continuationFeed: T[];
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

  // Top 4 to 8 closest items for "You May Also Like" carousel
  const youMayAlsoLike = sortedByRelatedness.slice(0, Math.min(8, sortedByRelatedness.length)).map((e) => e.item);
  const carouselIds = new Set(youMayAlsoLike.map((item) => String((item as any).id || (item as any)._id || item.mtid || '')));

  // The rest form the endless continuation feed, personalized by profile and popularity
  const continuationPool = remaining.filter((item) => !carouselIds.has(String((item as any).id || (item as any)._id || item.mtid || '')));
  const continuationFeed = rankMaterialsForProfile(continuationPool, profile, searchHistory);

  return {
    youMayAlsoLike,
    continuationFeed,
    contextLabel
  };
}
