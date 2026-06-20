import { useCallback, useMemo, useRef, useState } from 'react';
import type { SnipNote, NoteColor } from '../types/note';
import { parseTags, formatBytes, estimateStorageBytes } from '../utils/format';
import { filterNotes, EMPTY_FILTERS, computeStats } from '../utils/filter';
import {
  noteToMarkdownSingle, notesToJson, notesToMarkdown, notesToTxt,
  openPrintView, parseImportFile, triggerDownload,
} from '../utils/export';
import { useAppData } from '../hooks/useAppData';
import { useTheme } from '../hooks/useTheme';
import NoteCard from './NoteCard';
import NoteEditor, { EMPTY_FORM, type NoteFormState } from './NoteEditor';
import FilterBar from './FilterBar';
import StatsPanel from './StatsPanel';
import Toast from './Toast';

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null;

export default function Manager() {
  const [form, setForm] = useState<NoteFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState>(null);
  const [showStats, setShowStats] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [encryptPwd, setEncryptPwd] = useState('');

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type: type ?? 'success' });
  }, []);

  const {
    notes, folders, settings, loading, unlocked, addNote, updateNote, deleteNote,
    persist, updateSettings, upsertFolder, undoDelete, canUndo, unlock,
  } = useAppData(showToast);

  useTheme(settings, true);

  const filtered = useMemo(() => filterNotes(notes, filters, settings), [notes, filters, settings]);
  const stats = useMemo(() => computeStats(notes), [notes]);
  const storageSize = useMemo(() => formatBytes(estimateStorageBytes(notes)), [notes]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const handleSave = async () => {
    if (!form.link.trim() && !form.note.trim()) { showToast('Add content first', 'error'); return; }
    const payload = {
      link: form.link.trim(), title: form.title.trim(), note: form.note.trim(),
      tags: parseTags(form.tags), folderId: form.folderId || null,
      color: (form.color || null) as NoteColor | null,
      reminderAt: form.reminderAt ? new Date(form.reminderAt).getTime() : null,
    };
    if (editingId) { await updateNote(editingId, payload, encryptPwd || undefined); showToast('Updated'); }
    else { await addNote(payload, encryptPwd || undefined); showToast('Saved'); }
    resetForm();
  };

  const handleCopy = async (note: SnipNote, asMarkdown?: boolean) => {
    const text = asMarkdown ? noteToMarkdownSingle(note) : [note.title, note.link, note.note].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(text);
    showToast(asMarkdown ? 'Markdown copied' : 'Copied');
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedNotes = notes.filter((n) => selected.has(n.id));

  const bulkDelete = async () => {
    await persist(notes.filter((n) => !selected.has(n.id)), encryptPwd || undefined);
    setSelected(new Set());
    showToast('Deleted selected', 'info');
  };

  const bulkArchive = async () => {
    await persist(notes.map((n) => selected.has(n.id) ? { ...n, archived: true } : n), encryptPwd || undefined);
    setSelected(new Set());
    showToast('Archived selected', 'info');
  };

  const exportSelected = (fmt: 'txt' | 'json' | 'md') => {
    const data = selected.size ? selectedNotes : filtered;
    if (fmt === 'txt') triggerDownload(notesToTxt(data), 'snipnote.txt', 'text/plain');
    else if (fmt === 'md') triggerDownload(notesToMarkdown(data), 'snipnote.md', 'text/markdown');
    else triggerDownload(notesToJson(data), 'snipnote.json', 'application/json');
    showToast('Exported');
  };

  const openAllLinks = () => {
    const links = (selected.size ? selectedNotes : filtered).map((n) => n.link).filter(Boolean);
    links.slice(0, 10).forEach((url) => chrome.tabs.create({ url }));
    if (links.length > 10) showToast('Opened first 10 links', 'info');
  };

  const handleImport = async (file: File, merge: boolean) => {
    try {
      const imported = await parseImportFile(file);
      const merged = merge ? [...notes, ...imported.filter((i) => !notes.some((n) => n.id === i.id))] : imported;
      await persist(merged, encryptPwd || undefined);
      showToast(`Imported ${imported.length} notes`);
    } catch { showToast('Import failed', 'error'); }
  };

  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId || !settings.features.dragReorder) return;
    const reordered = [...filtered];
    const fromIdx = reordered.findIndex((n) => n.id === dragId);
    const toIdx = reordered.findIndex((n) => n.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withOrder = notes.map((n) => {
      const idx = reordered.findIndex((r) => r.id === n.id);
      return idx >= 0 ? { ...n, sortOrder: idx } : n;
    });
    await updateSettings({ sortBy: 'manual' });
    await persist(withOrder, encryptPwd || undefined);
    setDragId(null);
  };

  const refreshTitle = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note?.link) return;
    try {
      const tab = await chrome.tabs.create({ url: note.link, active: false });
      await new Promise((r) => setTimeout(r, 2000));
      const [updated] = await chrome.tabs.query({ active: false, windowId: tab.windowId });
      if (updated?.title) await updateNote(id, { title: updated.title });
      if (tab.id) await chrome.tabs.remove(tab.id);
      showToast('Title refreshed');
    } catch { showToast('Refresh failed', 'error'); }
  };

  const addFolder = async () => {
    if (!newFolderName.trim()) return;
    await upsertFolder({ id: crypto.randomUUID(), name: newFolderName.trim(), color: null, sortOrder: folders.length });
    setNewFolderName('');
    showToast('Folder created');
  };

  if (settings.encryptionEnabled && settings.features.encryption && !unlocked) {
    return (
      <div className="page-shell flex items-center justify-center p-8">
        <div className="max-w-sm w-full space-y-3">
          <h1 className="text-xl font-bold">Unlock SnipNote</h1>
          <input type="password" placeholder="Password" value={encryptPwd} onChange={(e) => setEncryptPwd(e.target.value)} className="input-field" />
          <button type="button" onClick={() => unlock(encryptPwd)} className="btn-primary w-full">Unlock</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen flex flex-col">
      <header className="border-b border-white/5 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">SnipNote Manager</h1>
          <p className="text-sm text-slate-400">{stats.active} active · {storageSize} stored</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUndo() && settings.features.undoDelete && (
            <button type="button" onClick={() => undoDelete(encryptPwd || undefined)} className="btn-secondary text-xs">Undo delete</button>
          )}
          {settings.features.statistics && (
            <button type="button" onClick={() => setShowStats(!showStats)} className="btn-secondary text-xs">Stats</button>
          )}
          {settings.features.printView && (
            <button type="button" onClick={() => openPrintView(filtered)} className="btn-secondary text-xs">Print</button>
          )}
          {settings.features.openAllLinks && (
            <button type="button" onClick={openAllLinks} className="btn-secondary text-xs">Open links</button>
          )}
          {settings.features.bulkImport && (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs">Import</button>
              <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (f) handleImport(f, true);
              }} />
            </>
          )}
          <button type="button" onClick={() => chrome.runtime.openOptionsPage()} className="btn-secondary text-xs">Settings</button>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[360px_1fr] gap-0">
        <aside className="border-b lg:border-b-0 lg:border-r border-white/5 p-4 space-y-3 overflow-y-auto scrollable max-h-[50vh] lg:max-h-none">
          <NoteEditor form={form} settings={settings} folders={folders} editing={!!editingId}
            onChange={setForm} onSave={handleSave}
            onCaptureTab={() => chrome.tabs.query({ active: true, currentWindow: true }, (t) => {
              if (t[0]?.url) setForm((p) => ({ ...p, link: t[0].url!, title: t[0].title ?? p.title }));
            })}
            onCancel={resetForm} />

          {settings.features.folders && (
            <div className="flex gap-2">
              <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="New folder" className="input-field flex-1 text-xs" />
              <button type="button" onClick={addFolder} className="btn-secondary text-xs px-2">+</button>
            </div>
          )}
        </aside>

        <main className="p-4 space-y-3 overflow-y-auto scrollable">
          {showStats && settings.features.statistics && <StatsPanel stats={stats} />}

          <FilterBar filters={filters} settings={settings} notes={notes} folders={folders}
            onChange={(p) => setFilters({ ...filters, ...p })}
            onSortChange={(sortBy) => updateSettings({ sortBy })} />

          {selected.size > 0 && settings.features.multiSelect && (
            <div className="flex flex-wrap gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 p-2">
              <span className="text-xs text-violet-200">{selected.size} selected</span>
              <button type="button" onClick={bulkArchive} className="btn-secondary text-[10px]">Archive</button>
              <button type="button" onClick={bulkDelete} className="btn-secondary text-[10px]">Delete</button>
              <button type="button" onClick={() => exportSelected('json')} className="btn-secondary text-[10px]">Export</button>
              <button type="button" onClick={() => setSelected(new Set())} className="btn-secondary text-[10px]">Clear</button>
            </div>
          )}

          {loading ? <p className="text-slate-500">Loading…</p> : (
            <div className="space-y-2" tabIndex={0}
              onKeyDown={(e) => {
                if (!settings.features.keyboardNav) return;
                if (e.key === 'ArrowDown') setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
                if (e.key === 'ArrowUp') setFocusedIndex((i) => Math.max(i - 1, 0));
                if (e.key === 'Enter' && filtered[focusedIndex]) handleCopy(filtered[focusedIndex]);
              }}>
              {filtered.map((note) => (
                <NoteCard key={note.id} note={note} settings={settings} searchQuery={filters.search}
                  selected={selected.has(note.id)} draggable={settings.features.dragReorder}
                  onSelect={toggleSelect}
                  onDelete={(id) => deleteNote(id, encryptPwd || undefined)}
                  onTogglePin={(id) => updateNote(id, { pinned: !note.pinned }, encryptPwd || undefined)}
                  onToggleStar={(id) => updateNote(id, { starred: !note.starred }, encryptPwd || undefined)}
                  onToggleArchive={(id) => updateNote(id, { archived: !note.archived }, encryptPwd || undefined)}
                  onEdit={(n) => { setEditingId(n.id); setForm({ link: n.link, title: n.title, note: n.note, tags: n.tags.join(', '), folderId: n.folderId ?? '', color: n.color ?? '', reminderAt: n.reminderAt ? new Date(n.reminderAt).toISOString().slice(0, 16) : '' }); }}
                  onCopy={handleCopy} onRefreshTitle={refreshTitle}
                  onDragStart={setDragId} onDrop={handleDrop} />
              ))}
              {filtered.length === 0 && <p className="text-center text-slate-500 py-12">No notes match filters</p>}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-white/5 px-6 py-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => exportSelected('txt')} className="btn-secondary text-xs">Export TXT</button>
        <button type="button" onClick={() => exportSelected('json')} className="btn-secondary text-xs">Export JSON</button>
        {settings.features.markdownExport && (
          <button type="button" onClick={() => exportSelected('md')} className="btn-secondary text-xs">Export MD</button>
        )}
      </footer>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
