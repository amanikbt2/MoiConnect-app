import { apiRequest } from './api';

export type SearchReportSource = 'home' | 'notes' | 'past_papers' | 'cats';

export async function reportMaterialSearch(
  query: string,
  source: SearchReportSource,
  found?: boolean
): Promise<void> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return;
  await apiRequest('/search-reports', {
    method: 'POST',
    body: JSON.stringify({ query: cleanQuery, source, ...(typeof found === 'boolean' ? { found } : {}) })
  });
}
