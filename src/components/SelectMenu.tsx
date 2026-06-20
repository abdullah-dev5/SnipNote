import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function SelectMenu({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  className = '',
  size = 'md',
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`select-trigger w-full ${size === 'sm' ? 'select-trigger-sm' : ''}`}
        aria-expanded={open}
      >
        <span className={selected ? 'text-slate-100' : 'text-slate-500'}>
          {selected?.label ?? placeholder}
        </span>
        <svg className={`h-4 w-4 text-violet-300 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="select-menu" role="listbox">
          {options.map((opt) => (
            <li key={opt.value || '__empty'} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`select-menu-item ${opt.value === value ? 'select-menu-item-active' : ''}`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
