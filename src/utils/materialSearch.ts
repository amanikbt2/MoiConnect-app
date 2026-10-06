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

export function getGlobalSearchDestination(query: string): string {
  const value = normalize(query);
  const encodedQuery = encodeURIComponent(query.trim());
  const hasAny = (words: string[]) => words.some((word) => value.includes(word));

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

  const idText = normalize(item.mtid);
  if (idText && idText.startsWith(q)) return 1;
  if (id && normalizedQueryId && id.includes(normalizedQueryId)) return 2;

  const title = normalize(item.title);
  const unitCode = normalize(item.unitCode);
  const unitName = normalize(item.unitName);
  if (title === q || unitCode === q || unitName === q) return 3;
  if ([title, unitCode, unitName].some((field) => field.startsWith(q))) return 4;
  if ([title, unitCode, unitName].some((field) => field.includes(q))) return 5;
  if (fields.some((field) => field.includes(q))) return 6;

  const tokens = q.split(/\s+/).filter(Boolean);
  const allTokensFound = tokens.every((token) => fields.some((field) => field.includes(token)));
  return allTokensFound ? 7 : null;
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
