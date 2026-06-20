import type { SnipNote } from '../types/note';
import type { AppSettings } from '../types/settings';
import { getDomain } from './format';
import { sortNotes } from './storage';

export interface NoteFilters {
  search: string;
  tag: string | null;
  domain: string | null;
  folderId: string | null;
  starredOnly: boolean;
  archivedOnly: boolean;
}

export const EMPTY_FILTERS: NoteFilters = {
  search: '',
  tag: null,
  domain: null,
  folderId: null,
  starredOnly: false,
  archivedOnly: false,
};

export function filterNotes(
  notes: SnipNote[],
  filters: NoteFilters,
  settings: AppSettings,
): SnipNote[] {
  const query = filters.search.trim().toLowerCase();

  return sortNotes(
    notes.filter((n) => {
      if (filters.archivedOnly) {
        if (!n.archived) return false;
      } else if (!settings.showArchived && n.archived) {
        return false;
      }

      if (filters.starredOnly && !n.starred) return false;
      if (filters.tag && !n.tags.includes(filters.tag)) return false;
      if (filters.folderId && n.folderId !== filters.folderId) return false;
      if (filters.domain && getDomain(n.link) !== filters.domain) return false;

      if (!query) return true;

      return (
        n.title.toLowerCase().includes(query) ||
        n.link.toLowerCase().includes(query) ||
        n.note.toLowerCase().includes(query) ||
        n.tags.some((t) => t.includes(query)) ||
        (n.selectedText?.toLowerCase().includes(query) ?? false)
      );
    }),
    settings.sortBy,
  );
}

export interface NoteStats {
  total: number;
  active: number;
  archived: number;
  starred: number;
  pinned: number;
  thisWeek: number;
  topDomains: { domain: string; count: number }[];
  topTags: { tag: string; count: number }[];
}

export function computeStats(notes: SnipNote[]): NoteStats {
  const weekAgo = Date.now() - 7 * 86400000;
  const domainCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  notes.forEach((n) => {
    const d = getDomain(n.link);
    if (d) domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
    n.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1));
  });

  const top = (map: Map<string, number>, limit: number) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ domain: key, tag: key, count }))
      .map(({ domain, tag, count }) =>
        domain ? { domain, count } : { domain: tag, count },
      );

  return {
    total: notes.length,
    active: notes.filter((n) => !n.archived).length,
    archived: notes.filter((n) => n.archived).length,
    starred: notes.filter((n) => n.starred).length,
    pinned: notes.filter((n) => n.pinned).length,
    thisWeek: notes.filter((n) => n.createdAt >= weekAgo).length,
    topDomains: top(domainCounts, 5).map(({ domain, count }) => ({ domain, count })),
    topTags: [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count })),
  };
}
