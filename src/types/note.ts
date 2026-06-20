export type NoteColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';
export type SortOption = 'newest' | 'oldest' | 'title' | 'updated' | 'manual';

export interface SnipNote {
  id: string;
  link: string;
  title: string;
  note: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  starred: boolean;
  archived: boolean;
  folderId: string | null;
  color: NoteColor | null;
  sortOrder: number;
  selectedText?: string;
  screenshot?: string;
  reminderAt?: number | null;
}

export interface Folder {
  id: string;
  name: string;
  color: NoteColor | null;
  sortOrder: number;
}

export interface NoteTemplate {
  id: string;
  name: string;
  note: string;
  tags: string[];
}

export type NoteInput = Pick<SnipNote, 'link' | 'title' | 'note' | 'tags' | 'folderId' | 'color'> & {
  selectedText?: string;
  screenshot?: string;
  reminderAt?: number | null;
};

export const NOTE_COLORS: { id: NoteColor; label: string; className: string; swatch: string }[] = [
  { id: 'red', label: 'Red', className: 'border-l-red-500', swatch: 'bg-red-500' },
  { id: 'orange', label: 'Orange', className: 'border-l-orange-500', swatch: 'bg-orange-500' },
  { id: 'yellow', label: 'Yellow', className: 'border-l-yellow-500', swatch: 'bg-yellow-400' },
  { id: 'green', label: 'Green', className: 'border-l-green-500', swatch: 'bg-emerald-500' },
  { id: 'blue', label: 'Blue', className: 'border-l-blue-500', swatch: 'bg-sky-500' },
  { id: 'purple', label: 'Purple', className: 'border-l-purple-500', swatch: 'bg-violet-500' },
  { id: 'gray', label: 'Slate', className: 'border-l-slate-400', swatch: 'bg-slate-400' },
];
