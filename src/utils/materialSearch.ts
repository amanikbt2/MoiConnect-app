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
