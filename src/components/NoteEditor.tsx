import type { NoteColor, Folder } from '../types/note';
import type { AppSettings } from '../types/settings';
import { BUILTIN_TEMPLATES } from '../utils/templates';
import { renderSimpleMarkdown } from '../utils/format';
import ColorPicker from './ColorPicker';
import SelectMenu from './SelectMenu';

export interface NoteFormState {
  link: string;
  title: string;
  note: string;
  tags: string;
  folderId: string;
  color: NoteColor | '';
  reminderAt: string;
}

export const EMPTY_FORM: NoteFormState = {
  link: '',
  title: '',
  note: '',
  tags: '',
  folderId: '',
  color: '',
  reminderAt: '',
};

interface NoteEditorProps {
  form: NoteFormState;
  settings: AppSettings;
  folders: Folder[];
  editing: boolean;
  onChange: (form: NoteFormState) => void;
  onSave: () => void;
  onCaptureTab: () => void;
  onScreenshot?: () => void;
  onCancel?: () => void;
}

export default function NoteEditor({
  form,
  settings,
  folders,
  editing,
  onChange,
  onSave,
  onCaptureTab,
  onScreenshot,
  onCancel,
}: NoteEditorProps) {
  const set = (patch: Partial<NoteFormState>) => onChange({ ...form, ...patch });

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <section className="space-y-2">
      {editing && onCancel && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/25 px-3 py-2">
          <span className="text-xs font-medium text-amber-300">Editing note</span>
          <button type="button" onClick={onCancel} className="text-xs text-amber-200 hover:text-white">Cancel</button>
        </div>
      )}

      {settings.features.templates && !editing && (
        <div className="flex flex-wrap gap-1">
          {BUILTIN_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set({ note: t.note, tags: t.tags.join(', ') })}
              className="chip text-slate-400 hover:border-violet-500/30 hover:text-violet-200 hover:bg-violet-500/10"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <input type="text" placeholder="Page title (optional)" value={form.title}
        onChange={(e) => set({ title: e.target.value })} onKeyDown={onKeyDown} className="input-field" />

      <div className="flex gap-2">
        <input type="text" placeholder="Link URL" value={form.link}
          onChange={(e) => set({ link: e.target.value })} onKeyDown={onKeyDown} className="input-field flex-1" />
        <button type="button" onClick={onCaptureTab} className="btn-secondary shrink-0 px-3" title="Capture current tab">🔗</button>
        {settings.features.screenshot && onScreenshot && (
          <button type="button" onClick={onScreenshot} className="btn-secondary shrink-0 px-3" title="Attach screenshot">📷</button>
        )}
      </div>

      <textarea placeholder="Your note… (supports **bold**, *italic*, `code`)" value={form.note}
        onChange={(e) => set({ note: e.target.value })} onKeyDown={onKeyDown} rows={3}
        className="input-field resize-none" />

      {settings.features.markdownPreview && form.note && (
        <div
          className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs text-slate-300 prose-preview"
          dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(form.note) }}
        />
      )}

      <input type="text" placeholder="Tags (comma separated)" value={form.tags}
        onChange={(e) => set({ tags: e.target.value })} onKeyDown={onKeyDown} className="input-field" />

      <div className="flex gap-2 flex-wrap">
        {settings.features.folders && folders.length > 0 && (
          <SelectMenu
            value={form.folderId}
            onChange={(folderId) => set({ folderId })}
            placeholder="No folder"
            className="flex-1 min-w-[140px]"
            options={[
              { value: '', label: 'No folder' },
              ...folders.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
        )}

        {settings.features.reminders && (
          <input type="datetime-local" value={form.reminderAt} onChange={(e) => set({ reminderAt: e.target.value })}
            className="input-field flex-1 min-w-[160px]" title="Reminder" />
        )}
      </div>

      {settings.features.colorLabels && (
        <ColorPicker value={form.color} onChange={(color) => set({ color })} />
      )}

      <button type="button" onClick={onSave} className="btn-primary w-full">
        {editing ? 'Update Note' : 'Save Note'}
        <span className="text-[10px] opacity-70 ml-1">Ctrl+Enter</span>
      </button>
    </section>
  );
}
