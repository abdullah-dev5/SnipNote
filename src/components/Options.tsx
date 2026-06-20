import { useCallback, useEffect, useState } from 'react';
import type { AppSettings } from '../types/settings';
import { FEATURE_GROUPS, FEATURE_LABELS, DEFAULT_SETTINGS, PRESET_LABELS, applyPreset, detectPreset, type SettingsPreset } from '../types/settings';
import type { SortOption } from '../types/note';
import { loadSettings, saveSettings, getStorageUsage, pullSyncNotes, saveNotes } from '../utils/storage';
import { formatBytes, estimateStorageBytes } from '../utils/format';
import { useTheme } from '../hooks/useTheme';
import { triggerDownload } from '../utils/export';
import Toast from './Toast';

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null;

export default function Options() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [usage, setUsage] = useState({ localBytes: 0, syncBytes: 0 });
  const [noteBytes, setNoteBytes] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [encryptPwd, setEncryptPwd] = useState('');

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type: type ?? 'success' });
  }, []);

  useEffect(() => {
    loadSettings().then(setSettings);
    getStorageUsage().then(setUsage);
    chrome.storage.local.get('notes', (r) => {
      setNoteBytes(estimateStorageBytes(r.notes ?? []));
    });
  }, []);

  useTheme(settings, true);

  const save = async (patch: Partial<AppSettings>) => {
    const next = {
      ...settings,
      ...patch,
      features: patch.features ? { ...settings.features, ...patch.features } : settings.features,
    };
    setSettings(next);
    await saveSettings(next);
    showToast('Saved', 'info');
  };

  const toggleFeature = (key: keyof AppSettings['features']) => {
    save({ features: { ...settings.features, [key]: !settings.features[key] } });
  };

  const applyMode = async (preset: SettingsPreset) => {
    const patch = applyPreset(preset);
    const next = {
      ...settings,
      ...patch,
      features: { ...settings.features, ...patch.features! },
    };
    setSettings(next);
    await saveSettings(next);
    showToast(`${PRESET_LABELS[preset].title} mode applied`);
  };

  const activePreset = detectPreset(settings);

  const pullSync = async () => {
    const synced = await pullSyncNotes();
    if (!synced) { showToast('No sync data found', 'info'); return; }
    await saveNotes(synced, settings);
    showToast(`Pulled ${synced.length} notes from sync`);
  };

  const exportBackup = async () => {
    const r = await chrome.storage.local.get('notes');
    triggerDownload(JSON.stringify(r.notes ?? [], null, 2), `snipnote-backup-${Date.now()}.json`, 'application/json');
    showToast('Backup downloaded');
  };

  return (
    <div className="page-shell min-h-screen max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">SnipNote Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Enable only what you need — keeps the extension fast and lightweight.</p>
      </header>

      <section className="rounded-2xl border border-violet-500/20 bg-violet-950/25 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Quick presets</h2>
          {activePreset === 'custom' && (
            <span className="text-[11px] rounded-full bg-white/10 px-2 py-0.5 text-slate-400">Custom mix</span>
          )}
        </div>
        <p className="text-sm text-slate-400">One click to configure all feature modules. You can still tweak individual toggles below.</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {(['minimal', 'balanced', 'full'] as SettingsPreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyMode(preset)}
              className={`rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                activePreset === preset
                  ? 'border-violet-400/50 bg-violet-500/15 ring-2 ring-violet-500/25'
                  : 'border-violet-500/15 bg-violet-950/20 hover:border-violet-400/30 hover:bg-violet-900/25'
              }`}
            >
              <p className="text-sm font-semibold">{PRESET_LABELS[preset].title}</p>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">{PRESET_LABELS[preset].description}</p>
              {activePreset === preset && (
                <span className="mt-2 inline-block text-[10px] font-medium text-violet-300">Active</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-inset p-4 space-y-3">
        <h2 className="font-semibold">Appearance</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Theme
            <select value={settings.theme} onChange={(e) => save({ theme: e.target.value as AppSettings['theme'] })} className="input-field mt-1">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </label>
          <label className="text-sm">Density
            <select value={settings.density} onChange={(e) => save({ density: e.target.value as AppSettings['density'] })} className="input-field mt-1">
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label className="text-sm">Default sort
            <select value={settings.sortBy} onChange={(e) => save({ sortBy: e.target.value as SortOption })} className="input-field mt-1">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
              <option value="updated">Updated</option>
              <option value="manual">Manual</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.autoCaptureTab} onChange={(e) => save({ autoCaptureTab: e.target.checked })} className="accent-violet-500" />
          Auto-fill current tab in popup
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.showArchived} onChange={(e) => save({ showArchived: e.target.checked })} className="accent-violet-500" />
          Show archived notes by default
        </label>
      </section>

      {FEATURE_GROUPS.map((group) => (
        <section key={group.title} className="surface-inset p-4 space-y-2">
          <h2 className="font-semibold">{group.title}</h2>
          {group.keys.map((key) => (
            <label key={key} className="flex items-start gap-2 text-sm py-1 cursor-pointer">
              <input type="checkbox" checked={settings.features[key]} onChange={() => toggleFeature(key)} className="accent-violet-500 mt-0.5" />
              <span>{FEATURE_LABELS[key]}</span>
            </label>
          ))}
        </section>
      ))}

      <section className="rounded-xl border border-white/5 p-4 space-y-3">
        <h2 className="font-semibold">Data & backup</h2>
        <p className="text-xs text-slate-400">Notes: {formatBytes(noteBytes)} · Local storage: {formatBytes(usage.localBytes)} · Sync: {formatBytes(usage.syncBytes)}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportBackup} className="btn-secondary text-xs">Download backup</button>
          {settings.features.syncNotes && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.syncEnabled} onChange={(e) => save({ syncEnabled: e.target.checked })} className="accent-violet-500" />
                Enable Chrome sync (no screenshots)
              </label>
              <button type="button" onClick={pullSync} className="btn-secondary text-xs">Pull from sync</button>
            </>
          )}
          {settings.features.autoBackup && (
            <label className="text-sm">Backup every
              <select value={settings.autoBackupDays} onChange={(e) => save({ autoBackupDays: Number(e.target.value) })} className="input-field ml-2 inline-block w-20">
                {[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d}d</option>)}
              </select>
            </label>
          )}
        </div>
        {settings.features.encryption && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.encryptionEnabled} onChange={(e) => save({ encryptionEnabled: e.target.checked })} className="accent-violet-500" />
              Encrypt note text at rest
            </label>
            {settings.encryptionEnabled && (
              <input type="password" placeholder="Encryption password" value={encryptPwd} onChange={(e) => setEncryptPwd(e.target.value)} className="input-field" />
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <h2 className="font-semibold text-amber-200">Performance tip</h2>
        <p className="text-sm text-slate-300 mt-1">Keep screenshot, sync, and encryption off unless you need them. Use the popup for quick capture and the Manager for heavy tasks.</p>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
