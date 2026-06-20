import type { NoteFilters } from '../utils/filter';
import type { AppSettings } from '../types/settings';
import type { SortOption } from '../types/note';
import { getTopTags, getUniqueDomains } from '../utils/format';
import type { SnipNote } from '../types/note';
import type { Folder } from '../types/note';
import SelectMenu from './SelectMenu';

interface FilterBarProps {
  filters: NoteFilters;
  settings: AppSettings;
  notes: SnipNote[];
  folders: Folder[];
  onChange: (patch: Partial<NoteFilters>) => void;
  onSortChange: (sort: SortOption) => void;
}

export default function FilterBar({ filters, settings, notes, folders, onChange, onSortChange }: FilterBarProps) {
  const topTags = getTopTags(notes.filter((n) => !n.archived));
  const domains = getUniqueDomains(notes);

  return (
    <section className="space-y-2">
      <input type="search" placeholder="Search notes…" value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })} className="input-field" />

      <div className="flex flex-wrap gap-1.5 items-center">
        <SelectMenu
          value={settings.sortBy}
          onChange={(v) => onSortChange(v as SortOption)}
          size="sm"
          className="w-auto min-w-[130px]"
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'title', label: 'A–Z' },
            { value: 'updated', label: 'Recently updated' },
            ...(settings.features.dragReorder ? [{ value: 'manual', label: 'Manual order' }] : []),
          ]}
        />

        {settings.features.starred && (
          <FilterChip label="★ Starred" active={filters.starredOnly} onClick={() => onChange({ starredOnly: !filters.starredOnly })} />
        )}
        {settings.features.archive && (
          <FilterChip label="Archive" active={filters.archivedOnly} onClick={() => onChange({ archivedOnly: !filters.archivedOnly, starredOnly: false })} />
        )}
      </div>

      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <FilterChip label="All tags" active={!filters.tag} onClick={() => onChange({ tag: null })} />
          {topTags.map((tag) => (
            <FilterChip key={tag} label={`#${tag}`} active={filters.tag === tag}
              onClick={() => onChange({ tag: filters.tag === tag ? null : tag })} />
          ))}
        </div>
      )}

      {settings.features.domainFilter && domains.length > 1 && (
        <SelectMenu
          value={filters.domain ?? ''}
          onChange={(domain) => onChange({ domain: domain || null })}
          placeholder="All domains"
          size="sm"
          options={[{ value: '', label: 'All domains' }, ...domains.map((d) => ({ value: d, label: d }))]}
        />
      )}

      {settings.features.folders && folders.length > 0 && (
        <SelectMenu
          value={filters.folderId ?? ''}
          onChange={(folderId) => onChange({ folderId: folderId || null })}
          placeholder="All folders"
          size="sm"
          options={[{ value: '', label: 'All folders' }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
        />
      )}
    </section>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`chip ${active ? 'chip-active' : 'text-slate-400 hover:border-violet-500/25 hover:text-slate-200'}`}
    >{label}</button>
  );
}
