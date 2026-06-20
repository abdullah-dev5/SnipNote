import type { SnipNote } from './types/note';
import { migrateLegacyNotes } from './utils/storage';
import { loadSettings } from './utils/storage';
import type { AppSettings } from './types/settings';

const MENUS = {
  savePage: 'snipnote-save-page',
  saveSelection: 'snipnote-save-selection',
  saveScreenshot: 'snipnote-save-screenshot',
} as const;

async function getNotes(): Promise<SnipNote[]> {
  const result = await chrome.storage.local.get('notes');
  return migrateLegacyNotes(result.notes);
}

async function getSettings(): Promise<AppSettings> {
  return loadSettings();
}

async function updateBadge(): Promise<void> {
  const notes = await getNotes();
  const count = notes.filter((n) => !n.archived).length;
  await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#7c5ce7' });
}

async function rebuildContextMenus(settings: AppSettings): Promise<void> {
  await chrome.contextMenus.removeAll();
  await chrome.contextMenus.create({
    id: MENUS.savePage,
    title: 'Save page to SnipNote',
    contexts: ['page'],
  });
  if (settings.features.textSelection) {
    await chrome.contextMenus.create({
      id: MENUS.saveSelection,
      title: 'Save selection to SnipNote',
      contexts: ['selection'],
    });
  }
  if (settings.features.screenshot) {
    await chrome.contextMenus.create({
      id: MENUS.saveScreenshot,
      title: 'Save page + screenshot to SnipNote',
      contexts: ['page'],
    });
  }
}

async function addNote(note: SnipNote): Promise<void> {
  const notes = await getNotes();
  await chrome.storage.local.set({ notes: [...notes, note] });
  await updateBadge();
}

async function quickSaveTab(tab: chrome.tabs.Tab, extra: Partial<SnipNote> = {}): Promise<void> {
  if (!tab.url || tab.url.startsWith('chrome://')) return;
  await addNote({
    id: crypto.randomUUID(),
    link: tab.url,
    title: tab.title ?? '',
    note: '',
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false,
    starred: false,
    archived: false,
    folderId: null,
    color: null,
    sortOrder: 0,
    ...extra,
  });
}

async function captureTabScreenshot(tabId?: number): Promise<string | undefined> {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'jpeg', quality: 60 });
    return dataUrl;
  } catch {
    if (tabId) {
      try {
        return await chrome.tabs.captureVisibleTab(undefined, { format: 'jpeg', quality: 60 });
      } catch { /* ignore */ }
    }
    return undefined;
  }
}

async function scheduleReminders(notes: SnipNote[]): Promise<void> {
  await chrome.alarms.clearAll();
  const settings = await getSettings();
  if (!settings.features.reminders) return;

  notes.forEach((note) => {
    if (note.reminderAt && note.reminderAt > Date.now()) {
      chrome.alarms.create(`reminder-${note.id}`, { when: note.reminderAt });
    }
  });
}

async function setupAutoBackup(settings: AppSettings): Promise<void> {
  await chrome.alarms.clear('auto-backup');
  if (settings.features.autoBackup) {
    chrome.alarms.create('auto-backup', {
      periodInMinutes: Math.max(60, settings.autoBackupDays * 24 * 60),
    });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await rebuildContextMenus(settings);
  await updateBadge();
  await setupAutoBackup(settings);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.settings) {
    const settings = (changes.settings.newValue as AppSettings) ?? await getSettings();
    await rebuildContextMenus(settings);
    await setupAutoBackup(settings);
  }
  if (area === 'local' && changes.notes) {
    await updateBadge();
    const notes = migrateLegacyNotes(changes.notes.newValue);
    await scheduleReminders(notes);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab) return;
  const settings = await getSettings();

  if (info.menuItemId === MENUS.savePage) {
    await quickSaveTab(tab);
    return;
  }

  if (info.menuItemId === MENUS.saveSelection && info.selectionText) {
    await quickSaveTab(tab, { note: info.selectionText, selectedText: info.selectionText });
    return;
  }

  if (info.menuItemId === MENUS.saveScreenshot && settings.features.screenshot) {
    const screenshot = await captureTabScreenshot(tab.id);
    await quickSaveTab(tab, { screenshot });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const settings = await getSettings();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (command === 'quick-save' && settings.features.quickShortcut && tab) {
    await quickSaveTab(tab);
  }
  if (command === 'open-manager') {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'auto-backup') {
    const notes = await getNotes();
    const blob = JSON.stringify(notes, null, 2);
    const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(blob);
    await chrome.downloads.download({
      url,
      filename: `snipnote-backup-${Date.now()}.json`,
      saveAs: false,
    });
    return;
  }

  if (alarm.name.startsWith('reminder-')) {
    const id = alarm.name.replace('reminder-', '');
    const notes = await getNotes();
    const note = notes.find((n) => n.id === id);
    if (note) {
      chrome.notifications.create(id, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'SnipNote reminder',
        message: note.title || note.note.slice(0, 80) || 'Review your note',
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'updateBadge') {
    updateBadge().then(() => sendResponse({ status: 'ok' }));
    return true;
  }
  if (message.action === 'scheduleReminders') {
    scheduleReminders(message.notes ?? []).then(() => sendResponse({ status: 'ok' }));
    return true;
  }
  if (message.action === 'captureScreenshot') {
    captureTabScreenshot().then((dataUrl) => sendResponse({ dataUrl }));
    return true;
  }
  if (message.action === 'settingsUpdated') {
    rebuildContextMenus(message.settings).then(() => sendResponse({ status: 'ok' }));
    return true;
  }
  return false;
});
