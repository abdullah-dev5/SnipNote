import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SnipNote } from '../types/note';
import { parseTags } from '../utils/format';
import { filterNotes, EMPTY_FILTERS } from '../utils/filter';
import { noteToMarkdownSingle, notesToJson, notesToMarkdown, notesToTxt, triggerDownload } from '../utils/export';
import { useAppData } from '../hooks/useAppData';
import { useTheme, openPage } from '../hooks/useTheme';
import NoteCard from './NoteCard';
import NoteEditor, { EMPTY_FORM, type NoteFormState } from './NoteEditor';
import FilterBar from './FilterBar';
import Toast from './Toast';
import OnboardingTour, { shouldShowOnboarding } from './OnboardingTour';
import { applyPreset, detectPreset } from '../types/settings';

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null;
const POPUP_LIMIT = 25;

export default function Popup() {
  const [form, setForm] = useState<NoteFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type: type ?? 'success' });
  }, []);

  const { notes, folders, settings, loading, addNote, updateNote, deleteNote, persist, updateSettings } =
    useAppData(showToast);

  useTheme(settings);

  useEffect(() => {
    if (!loading && shouldShowOnboarding(settings)) setShowTour(true);
  }, [loading, settings]);

  useEffect(() => {
    if (!settings.autoCaptureTab) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.url || tab.url.startsWith('chrome://')) return;
      setForm((prev) => ({
        ...prev,
        link: prev.link || tab.url || '',
        title: prev.title || tab.title || '',
      }));
    });
  }, [settings.autoCaptureTab]);

  const filtered = useMemo(() => filterNotes(notes, filters, settings), [notes, filters, settings]);
  const displayed = filtered.slice(0, POPUP_LIMIT);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const handleSave = async () => {
    if (!form.link.trim() && !form.note.trim()) {
      showToast('Add a link or note first', 'error');
      return;
    }
    const payload = {
      link: form.link.trim(),
      title: form.title.trim(),
      note: form.note.trim(),
      tags: parseTags(form.tags),
      folderId: form.folderId || null,
      color: form.color || null,
      reminderAt: form.reminderAt ? new Date(form.reminderAt).getTime() : null,
    };

    if (editingId) {
      await updateNote(editingId, payload);
      showToast('Note updated');
    } else {
      await addNote(payload);
      showToast('Note saved');
    }
    resetForm();
  };

  const handleCaptureTab = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.url) { showToast('Could not read tab', 'error'); return; }
      setForm((p) => ({ ...p, link: tab.url ?? p.link, title: tab.title ?? p.title }));
      showToast('Page captured', 'info');
    });
  };

  const handleScreenshot = () => {
    chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (res) => {
      if (res?.dataUrl) showToast('Screenshot attached on save — enable in form', 'info');
      else showToast('Screenshot failed', 'error');
    });
  };

  const handleCopy = async (note: SnipNote, asMarkdown?: boolean) => {
    const text = asMarkdown ? noteToMarkdownSingle(note) : [
      note.title && `Title: ${note.title}`, note.link && `Link: ${note.link}`,
      note.note && `Note: ${note.note}`, note.tags.length && `Tags: ${note.tags.join(', ')}`,
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast(asMarkdown ? 'Markdown copied' : 'Copied');
    } catch { showToast('Copy failed', 'error'); }
  };

  const handleEdit = (note: SnipNote) => {
    setEditingId(note.id);
    setForm({
      link: note.link, title: note.title, note: note.note, tags: note.tags.join(', '),
      folderId: note.folderId ?? '', color: note.color ?? '',
      reminderAt: note.reminderAt ? new Date(note.reminderAt).toISOString().slice(0, 16) : '',
    });
  };

  const finishTour = () => {
    setShowTour(false);
    updateSettings({ onboardingDone: true });
  };

  const applyMinimalMode = () => {
    updateSettings(applyPreset('minimal'));
    showToast('Minimal mode — fast & lightweight', 'info');
  };

  const isMinimal = detectPreset(settings) === 'minimal';

  return (
    <div className="popup-shell flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-violet-500/10 bg-gradient-to-b from-violet-900/25 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-900/40">📝</div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">SnipNote</h1>
              <p className="text-[11px] text-slate-400">{notes.filter((n) => !n.archived).length} snippets</p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {!isMinimal && (
              <button type="button" onClick={applyMinimalMode} className="btn-secondary text-[10px] px-2 py-1" title="Disable heavy features">
                ⚡ Minimal
              </button>
            )}
            <button type="button" onClick={() => openPage('manager')} className="btn-secondary text-[10px] px-2 py-1">Manager</button>
            <button type="button" onClick={() => openPage('options')} className="btn-secondary text-[10px] px-2 py-1">⚙</button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollable px-4 py-3 space-y-3">
        <NoteEditor form={form} settings={settings} folders={folders} editing={!!editingId}
          onChange={setForm} onSave={handleSave} onCaptureTab={handleCaptureTab}
          onScreenshot={settings.features.screenshot ? handleScreenshot : undefined} onCancel={resetForm} />

        {notes.length > 0 && (
          <FilterBar filters={filters} settings={settings} notes={notes} folders={folders}
            onChange={(p) => setFilters({ ...filters, ...p })}
            onSortChange={(sortBy) => updateSettings({ sortBy })} />
        )}

        <section className="space-y-2 pb-2">
          {loading ? <p className="text-center text-sm text-slate-500 py-6">Loading…</p>
            : displayed.length === 0 ? <EmptyState hasNotes={notes.length > 0} />
            : displayed.map((note) => (
              <NoteCard key={note.id} note={note} settings={settings} searchQuery={filters.search} compact
                onDelete={deleteNote} onTogglePin={(id) => updateNote(id, { pinned: !notes.find((n) => n.id === id)!.pinned })}
                onToggleStar={(id) => updateNote(id, { starred: !notes.find((n) => n.id === id)!.starred })}
                onToggleArchive={(id) => updateNote(id, { archived: !notes.find((n) => n.id === id)!.archived })}
                onEdit={handleEdit} onCopy={handleCopy} />
            ))}
          {filtered.length > POPUP_LIMIT && (
            <button type="button" onClick={() => openPage('manager')} className="w-full text-xs text-violet-400 hover:text-violet-300 py-2">
              Show all {filtered.length} notes in Manager →
            </button>
          )}
        </section>
      </div>

      {notes.length > 0 && (
        <footer className="px-4 py-3 border-t border-violet-500/10 space-y-2">
          <div className="flex gap-2">
            <button type="button" onClick={() => { triggerDownload(notesToTxt(notes), 'snipnote.txt', 'text/plain'); showToast('Exported'); }} className="btn-secondary flex-1 text-xs">TXT</button>
            <button type="button" onClick={() => { triggerDownload(notesToJson(notes), 'snipnote.json', 'application/json'); showToast('Exported'); }} className="btn-secondary flex-1 text-xs">JSON</button>
            {settings.features.markdownExport && (
              <button type="button" onClick={() => { triggerDownload(notesToMarkdown(notes), 'snipnote.md', 'text/markdown'); showToast('Exported'); }} className="btn-secondary flex-1 text-xs">MD</button>
            )}
          </div>
          <button type="button" onClick={async () => {
            if (!confirmClear) { setConfirmClear(true); return; }
            await persist([]); resetForm(); setConfirmClear(false); showToast('Cleared', 'info');
          }} onBlur={() => setConfirmClear(false)}
            className={`w-full rounded-lg py-2 text-xs font-medium ${confirmClear ? 'bg-red-600 text-white' : 'bg-red-500/10 text-red-400'}`}>
            {confirmClear ? 'Confirm clear all' : 'Clear all notes'}
          </button>
        </footer>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      {showTour && <OnboardingTour onComplete={finishTour} />}
    </div>
  );
}

function EmptyState({ hasNotes }: { hasNotes: boolean }) {
  return (
    <div className="text-center py-8 text-sm text-slate-500">
      {hasNotes ? 'No matches — adjust filters' : 'Save your first snippet above'}
    </div>
  );
}
