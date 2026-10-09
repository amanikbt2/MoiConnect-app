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

export function getGlobalSearchDestination(query: string): string {
  const value = normalize(query);
  const encodedQuery = encodeURIComponent(query.trim());
  const hasAny = (words: string[]) => words.some((word) => value.includes(word));

  const idCategory = getMaterialCategoryFromId(query);
  if (idCategory === 'past_paper') return `/past-papers?search=${encodedQuery}`;
  if (idCategory === 'notes') return `/(tabs)/academics?search=${encodedQuery}`;
  if (idCategory === 'cat') return `/cat-papers?search=${encodedQuery}`;

  if (hasAny(['cat', 'continuous assessment', 'quiz', 'test'])) {
    return `/cat-papers?search=${encodedQuery}`;
  }
  if (hasAny(['rent', 'rental', 'house', 'hostel', 'accommodation', 'room', 'bedsitter', 'apartment', 'housing', 'landlord'])) {
    return `/rentals?search=${encodedQuery}`;
  }
  if (hasAny(['exam', 'past paper', 'pastpaper', 'revision', 'semester exam', 'final paper'])) {
    return `/past-papers?search=${encodedQuery}`;
  }
  return `/(tabs)/academics?search=${encodedQuery}`;
}

/** Lower scores are better. Exact MTID is always ranked ahead of ordinary text matches. */
export function getMaterialSearchScore(item: MaterialSearchFields, query: string): number | null {
  const q = normalize(query);
  if (!q) return 0;

  const id = normalizeId(item.mtid);
  const normalizedQueryId = normalizeId(q);
  if (id && normalizedQueryId && id === normalizedQueryId) return 0;

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
  if (idText && idText.startsWith(q)) return 1;
  if (id && normalizedQueryId && id.includes(normalizedQueryId)) return 2;

  const title = normalize(item.title);
  const unitCode = normalize(item.unitCode);
  const unitName = normalize(item.unitName);
  if (title === q || unitCode === q || unitName === q) return 3;
  if ([title, unitCode, unitName].some((field) => field.startsWith(q))) return 4;
  if ([title, unitCode, unitName].some((field) => field.includes(q))) return 5;

  // Search by meaningful words, not only by the exact sentence/order. A query
  // such as "language automata theory" therefore matches "Formal Language
  // and Automata Theory" strongly even though the full phrase is different.
  if (queryTokens.length > 0 && matchedTokens.length === queryTokens.length) {
    return primaryMatchedTokens.length === queryTokens.length ? 5 : 6;
  }

  // Keep partial word matches as related material instead of dropping them.
  // This is useful for course initials, a unit keyword, semester, or year.
  if (matchedTokens.length >= Math.max(1, Math.ceil(queryTokens.length / 2))) return 8;
  if (matchedTokens.length > 0) return 9;

  return fields.some((field) => field.includes(q)) ? 10 : null;
}

export function rankMaterials<T extends MaterialSearchFields>(items: T[], query: string): T[] {
  if (!query.trim()) return items;
  return items
    .map((item, index) => ({ item, index, score: getMaterialSearchScore(item, query) }))
    .filter((entry): entry is { item: T; index: number; score: number } => entry.score !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ item }) => item);
}

/** Rank every material for a student profile, keeping unmatched materials as a useful fallback. */
export function rankMaterialsForProfile<T extends MaterialSearchFields>(
  items: T[],
  profile?: { school?: string; course?: string; yearOfStudy?: string } | null,
  searchHistory: string[] = []
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

      const historyMatchIndex = searchHistory.findIndex((query) => {
        const tokens = normalize(query).split(/\s+/).filter(Boolean);
        return tokens.length > 0 && tokens.every((token) => itemCourseText.includes(token) || itemSchool.includes(token) || itemYearText.includes(token));
      });
      if (historyMatchIndex >= 0) {
        score -= Math.max(40, 150 - historyMatchIndex * 10);
        matched++;
      }

      const downloads = Number((item as any).downloads || (item as any).downloadsCount || 0);
      return { item, index, score, matched, downloads };
    })
    .sort((a, b) => b.matched - a.matched || a.score - b.score || b.downloads - a.downloads || a.index - b.index)
    .map(({ item }) => item);
}
