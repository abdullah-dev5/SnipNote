import { useCallback, useEffect, useRef, useState } from 'react';
import type { SnipNote, Folder } from '../types/note';
import type { AppSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';
import {
  createNote,
  findDuplicate,
  loadFolders,
  loadNotes,
  loadSettings,
  saveFolders,
  saveNotes,
  saveSettings,
} from '../utils/storage';
import { decryptNotes, encryptNotes } from '../utils/crypto';

type ToastFn = (msg: string, type?: 'success' | 'error' | 'info') => void;

export function useAppData(showToast?: ToastFn) {
  const [notes, setNotes] = useState<SnipNote[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(true);
  const undoRef = useRef<{ note: SnipNote; timer: ReturnType<typeof setTimeout> } | null>(null);

  const refresh = useCallback(async (password?: string) => {
    const [storedNotes, storedFolders, storedSettings] = await Promise.all([
      loadNotes(),
      loadFolders(),
      loadSettings(),
    ]);

    let displayNotes = storedNotes;
    if (storedSettings.encryptionEnabled && storedSettings.features.encryption && password) {
      displayNotes = structuredClone(storedNotes);
      await decryptNotes(displayNotes, password);
      setUnlocked(true);
    } else if (storedSettings.encryptionEnabled && storedSettings.features.encryption) {
      setUnlocked(false);
    } else {
      setUnlocked(true);
    }

    setNotes(displayNotes);
    setFolders(storedFolders);
    setSettings(storedSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onChanged = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && (changes.notes || changes.folders || changes.settings)) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [refresh]);

  const persist = useCallback(
    async (updated: SnipNote[], pwd?: string) => {
      let toSave = updated;
      if (settings.encryptionEnabled && settings.features.encryption && pwd) {
        toSave = structuredClone(updated);
        await encryptNotes(toSave, pwd);
      }
      setNotes(updated);
      await saveNotes(toSave, settings);
    },
    [settings],
  );

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = {
      ...settings,
      ...patch,
      features: patch.features ? { ...settings.features, ...patch.features } : settings.features,
    };
    setSettings(next);
    await saveSettings(next);
    showToast?.('Settings saved', 'info');
  }, [settings, showToast]);

  const addNote = useCallback(
    async (input: Parameters<typeof createNote>[0], pwd?: string) => {
      if (settings.features.duplicateDetection && input.link) {
        const dup = findDuplicate(notes, input.link);
        if (dup) {
          showToast?.('Duplicate URL — note saved anyway', 'info');
        }
      }
      const newNote = createNote(input, notes.length);
      await persist([...notes, newNote], pwd);
      return newNote;
    },
    [notes, persist, settings.features.duplicateDetection, showToast],
  );

  const updateNote = useCallback(
    async (id: string, patch: Partial<SnipNote>, pwd?: string) => {
      const updated = notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
      );
      await persist(updated, pwd);
    },
    [notes, persist],
  );

  const deleteNote = useCallback(
    async (id: string, pwd?: string) => {
      const removed = notes.find((n) => n.id === id);
      if (!removed) return;

      const updated = notes.filter((n) => n.id !== id);
      await persist(updated, pwd);

      if (settings.features.undoDelete) {
        if (undoRef.current) clearTimeout(undoRef.current.timer);
        undoRef.current = {
          note: removed,
          timer: setTimeout(() => {
            undoRef.current = null;
          }, 5000),
        };
        showToast?.('Deleted — click Undo in manager', 'info');
      }
    },
    [notes, persist, settings.features.undoDelete, showToast],
  );

  const undoDelete = useCallback(
    async (pwd?: string) => {
      if (!undoRef.current) return;
      const { note } = undoRef.current;
      clearTimeout(undoRef.current.timer);
      undoRef.current = null;
      await persist([...notes, note], pwd);
      showToast?.('Restored');
    },
    [notes, persist, showToast],
  );

  const canUndo = () => undoRef.current !== null;

  const upsertFolder = useCallback(async (folder: Folder) => {
    const exists = folders.find((f) => f.id === folder.id);
    const next = exists
      ? folders.map((f) => (f.id === folder.id ? folder : f))
      : [...folders, folder];
    setFolders(next);
    await saveFolders(next);
  }, [folders]);

  const unlock = useCallback(async (password: string) => {
    await refresh(password);
  }, [refresh]);

  return {
    notes,
    folders,
    settings,
    loading,
    unlocked,
    refresh,
    persist,
    addNote,
    updateNote,
    deleteNote,
    undoDelete,
    canUndo,
    updateSettings,
    upsertFolder,
    setFolders,
    unlock,
  };
}
