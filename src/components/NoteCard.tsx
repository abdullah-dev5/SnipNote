import type { ReactNode } from 'react';
import type { SnipNote } from '../types/note';
import type { AppSettings } from '../types/settings';
import { NOTE_COLORS } from '../types/note';
import { formatRelativeTime, faviconUrl, truncate } from '../utils/format';
import HighlightText from './HighlightText';

interface NoteCardProps {
  note: SnipNote;
  settings: AppSettings;
  searchQuery?: string;
  selected?: boolean;
  compact?: boolean;
  draggable?: boolean;
  onSelect?: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onEdit: (note: SnipNote) => void;
  onCopy: (note: SnipNote, asMarkdown?: boolean) => void;
  onRefreshTitle?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void;
}

export default function NoteCard({
  note,
  settings,
  searchQuery = '',
  selected,
  compact,
  draggable,
  onSelect,
  onDelete,
  onTogglePin,
  onToggleStar,
  onToggleArchive,
  onEdit,
  onCopy,
  onRefreshTitle,
  onDragStart,
  onDragOver,
  onDrop,
}: NoteCardProps) {
  const displayTitle = note.title || truncate(note.link, 56) || 'Untitled';
  const colorClass = NOTE_COLORS.find((c) => c.id === note.color)?.className ?? '';
  const density = compact || settings.density === 'compact' ? 'p-2' : 'p-3';
  const favicon = settings.features.linkPreviews && note.link ? faviconUrl(note.link) : '';

  return (
    <article
      draggable={draggable}
      onDragStart={() => onDragStart?.(note.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(note.id); }}
      onDrop={() => onDrop?.(note.id)}
      className={`note-card group relative border-l-4 ${colorClass || 'border-l-transparent'} ${density} ${
        note.pinned
          ? '!border-amber-500/35 bg-amber-500/8'
          : note.starred
            ? '!border-yellow-500/30 bg-yellow-500/8'
            : ''
      } ${selected ? 'ring-2 ring-violet-500/40' : ''} ${note.archived ? 'opacity-60' : ''}`}
    >
      {onSelect && settings.features.multiSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(note.id)}
          className="absolute top-2 left-2 accent-violet-500"
          aria-label="Select note"
        />
      )}

      <div className={`flex items-start gap-2 ${onSelect && settings.features.multiSelect ? 'pl-6' : ''} pr-2`}>
        {favicon && (
          <img src={favicon} alt="" className="mt-0.5 h-4 w-4 shrink-0 rounded" loading="lazy" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {note.pinned && <Badge label="Pinned" tone="amber" />}
            {note.starred && settings.features.starred && <Badge label="Starred" tone="yellow" />}
            {note.archived && settings.features.archive && <Badge label="Archived" tone="gray" />}
            <span className="text-[11px] text-slate-500">{formatRelativeTime(note.updatedAt)}</span>
          </div>

          <h3 className="text-sm font-semibold text-slate-100 leading-snug break-words">
            <HighlightText text={displayTitle} query={searchQuery} enabled={settings.features.searchHighlight} />
          </h3>

          {note.link && (
            <a
              href={note.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-xs text-violet-300 hover:text-violet-200 break-all line-clamp-2"
            >
              <HighlightText text={note.link} query={searchQuery} enabled={settings.features.searchHighlight} />
            </a>
          )}

          {note.selectedText && (
            <blockquote className="mt-2 border-l-2 border-violet-500/40 pl-2 text-xs italic text-slate-400 line-clamp-2">
              {note.selectedText}
            </blockquote>
          )}

          {note.note && (
            <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap break-words line-clamp-4">
              <HighlightText text={note.note} query={searchQuery} enabled={settings.features.searchHighlight} />
            </p>
          )}

          {note.screenshot && settings.features.screenshot && (
            <img
              src={note.screenshot}
              alt="Screenshot"
              className="mt-2 max-h-24 rounded border border-white/10 object-cover"
              loading="lazy"
            />
          )}

          {note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {note.reminderAt && settings.features.reminders && note.reminderAt > Date.now() && (
            <p className="mt-1 text-[10px] text-amber-400">
              Reminder: {new Date(note.reminderAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <IconButton label="Pin" onClick={() => onTogglePin(note.id)} active={note.pinned}><PinIcon filled={note.pinned} /></IconButton>
        {settings.features.starred && (
          <IconButton label="Star" onClick={() => onToggleStar(note.id)} active={note.starred}><StarIcon filled={note.starred} /></IconButton>
        )}
        {settings.features.archive && (
          <IconButton label="Archive" onClick={() => onToggleArchive(note.id)} active={note.archived}><ArchiveIcon /></IconButton>
        )}
        <IconButton label="Copy" onClick={() => onCopy(note)}><CopyIcon /></IconButton>
        {settings.features.markdownExport && (
          <IconButton label="Copy MD" onClick={() => onCopy(note, true)}><MdIcon /></IconButton>
        )}
        {settings.features.titleRefresh && onRefreshTitle && note.link && (
          <IconButton label="Refresh title" onClick={() => onRefreshTitle(note.id)}><RefreshIcon /></IconButton>
        )}
        <IconButton label="Edit" onClick={() => onEdit(note)}><EditIcon /></IconButton>
        <IconButton label="Delete" onClick={() => onDelete(note.id)} danger><TrashIcon /></IconButton>
      </div>
    </article>
  );
}

function Badge({ label, tone }: { label: string; tone: 'amber' | 'yellow' | 'gray' }) {
  const cls = {
    amber: 'text-amber-400',
    yellow: 'text-yellow-400',
    gray: 'text-slate-400',
  }[tone];
  return <span className={`text-[10px] uppercase tracking-wider font-semibold ${cls}`}>{label}</span>;
}

function IconButton({ label, onClick, children, active, danger }: {
  label: string; onClick: () => void; children: ReactNode; active?: boolean; danger?: boolean;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors ${
        danger ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
          : active ? 'text-amber-400 bg-amber-500/10'
          : 'text-slate-400 hover:text-violet-300 hover:bg-violet-500/10'
      }`}>{children}</button>
  );
}

function PinIcon({ filled }: { filled: boolean }) {
  return <svg className="w-3.5 h-3.5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5l7 7-2 9 4-4 7-7-9-2-7-7z" /></svg>;
}
function StarIcon({ filled }: { filled: boolean }) {
  return <svg className="w-3.5 h-3.5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
}
function ArchiveIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
}
function CopyIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
}
function MdIcon() {
  return <span className="text-[10px] font-bold">MD</span>;
}
function RefreshIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function EditIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function TrashIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
