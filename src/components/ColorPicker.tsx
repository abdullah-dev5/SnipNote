import type { NoteColor } from '../types/note';
import { NOTE_COLORS } from '../types/note';

interface ColorPickerProps {
  value: NoteColor | '';
  onChange: (color: NoteColor | '') => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="surface-inset p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Label color</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-violet-300 hover:text-violet-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {NOTE_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            aria-label={c.label}
            onClick={() => onChange(value === c.id ? '' : c.id)}
            className={`color-swatch ${c.swatch} ${value === c.id ? 'color-swatch-active' : ''}`}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-500">
        {value ? NOTE_COLORS.find((c) => c.id === value)?.label : 'No color selected'}
      </p>
    </div>
  );
}
