import type { SnipNote, Folder, SortOption } from '../types/note';
import type { AppSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

const NOTES_KEY = 'notes';
const FOLDERS_KEY = 'folders';
const SETTINGS_KEY = 'settings';
const SYNC_QUOTA = 90000;

function normalizeNote(item: Record<string, unknown>, index: number): SnipNote {
  const now = Date.now() - index;
  return {
    id: String(item.id ?? `legacy-${index}-${now}`),
    link: String(item.link ?? ''),
    title: String(item.title ?? ''),
    note: String(item.note ?? ''),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    createdAt: Number(item.createdAt ?? now),
    updatedAt: Number(item.updatedAt ?? item.createdAt ?? now),
    pinned: Boolean(item.pinned),
    starred: Boolean(item.starred),
    archived: Boolean(item.archived),
    folderId: item.folderId ? String(item.folderId) : null,
    color: (item.color as SnipNote['color']) ?? null,
    sortOrder: Number(item.sortOrder ?? index),
    selectedText: item.selectedText ? String(item.selectedText) : undefined,
    screenshot: item.screenshot ? String(item.screenshot) : undefined,
    reminderAt: item.reminderAt != null ? Number(item.reminderAt) : null,
  };
}

export function migrateLegacyNotes(raw: unknown): SnipNote[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (item && typeof item === 'object') {
      return normalizeNote(item as Record<string, unknown>, index);
    }
    return normalizeNote({}, index);
  });
}

export async function loadNotes(): Promise<SnipNote[]> {
  const result = await chrome.storage.local.get(NOTES_KEY);
  return migrateLegacyNotes(result[NOTES_KEY]);
}

export async function loadFolders(): Promise<Folder[]> {
  const result = await chrome.storage.local.get(FOLDERS_KEY);
  const folders = result[FOLDERS_KEY];
  return Array.isArray(folders) ? folders : [];
}

export async function loadSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY];
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_SETTINGS, features: { ...DEFAULT_SETTINGS.features } };
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    features: { ...DEFAULT_SETTINGS.features, ...(stored as AppSettings).features },
  };
}

export async function saveNotes(notes: SnipNote[], settings?: AppSettings): Promise<void> {
  await chrome.storage.local.set({ [NOTES_KEY]: notes });
  const active = settings ?? (await loadSettings());
  if (active.syncEnabled && active.features.syncNotes) {
    await syncNotesToCloud(notes);
  }
  notifyBadge(notes);
  scheduleReminders(notes, active);
}

export async function saveFolders(folders: Folder[]): Promise<void> {
  await chrome.storage.local.set({ [FOLDERS_KEY]: folders });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  chrome.runtime.sendMessage({ action: 'settingsUpdated', settings }).catch(() => {});
}

async function syncNotesToCloud(notes: SnipNote[]): Promise<void> {
  const slim = notes.map(({ screenshot, ...rest }) => {
    void screenshot;
    return rest;
  });
  const json = JSON.stringify(slim);
  if (json.length > SYNC_QUOTA) {
    console.warn('SnipNote: notes exceed sync quota; sync skipped');
    return;
  }
  await chrome.storage.sync.set({ [NOTES_KEY]: slim });
}

export async function pullSyncNotes(): Promise<SnipNote[] | null> {
  const result = await chrome.storage.sync.get(NOTES_KEY);
  if (!result[NOTES_KEY]) return null;
  return migrateLegacyNotes(result[NOTES_KEY]);
}

function notifyBadge(notes: SnipNote[]): void {
  const count = notes.filter((n) => !n.archived).length;
  chrome.runtime.sendMessage({ action: 'updateBadge', count }).catch(() => {});
}

function scheduleReminders(notes: SnipNote[], settings: AppSettings): void {
  if (!settings.features.reminders) return;
  chrome.runtime.sendMessage({ action: 'scheduleReminders', notes }).catch(() => {});
}

export function sortNotes(notes: SnipNote[], sortBy: SortOption = 'newest'): SnipNote[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.starred !== b.starred) return a.starred ? -1 : 1;

    switch (sortBy) {
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'title':
        return (a.title || a.link).localeCompare(b.title || b.link);
      case 'updated':
        return b.updatedAt - a.updatedAt;
      case 'manual':
        return a.sortOrder - b.sortOrder;
      default:
        return b.createdAt - a.createdAt;
    }
  });
}

export function findDuplicate(notes: SnipNote[], link: string, excludeId?: string): SnipNote | undefined {
  const normalized = link.trim().toLowerCase();
  if (!normalized) return undefined;
  return notes.find(
    (n) => n.id !== excludeId && !n.archived && n.link.trim().toLowerCase() === normalized,
  );
}

export function createNote(input: Partial<SnipNote> & Pick<SnipNote, 'link' | 'note'>, sortOrder = 0): SnipNote {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    link: input.link,
    title: input.title ?? '',
    note: input.note,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
    pinned: input.pinned ?? false,
    starred: input.starred ?? false,
    archived: input.archived ?? false,
    folderId: input.folderId ?? null,
    color: input.color ?? null,
    sortOrder,
    selectedText: input.selectedText,
    screenshot: input.screenshot,
    reminderAt: input.reminderAt ?? null,
  };
}

export async function importNotesFromJson(json: string, merge: boolean): Promise<SnipNote[]> {
  const parsed = JSON.parse(json) as unknown;
  const imported = migrateLegacyNotes(Array.isArray(parsed) ? parsed : (parsed as { notes?: unknown }).notes ?? []);
  if (!merge) return imported;
  const existing = await loadNotes();
  const ids = new Set(existing.map((n) => n.id));
  const merged = [...existing, ...imported.filter((n) => !ids.has(n.id))];
  return merged;
}

export async function getStorageUsage(): Promise<{ localBytes: number; syncBytes: number }> {
  const local = await new Promise<number>((resolve) => {
    chrome.storage.local.getBytesInUse(null, (bytes) => resolve(bytes ?? 0));
  });
  const sync = await new Promise<number>((resolve) => {
    chrome.storage.sync.getBytesInUse(null, (bytes) => resolve(bytes ?? 0));
  });
  return { localBytes: local, syncBytes: sync };
}
