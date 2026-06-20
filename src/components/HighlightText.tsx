interface HighlightTextProps {
  text: string;
  query: string;
  enabled?: boolean;
  className?: string;
}

export default function HighlightText({ text, query, enabled, className }: HighlightTextProps) {
  if (!enabled || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${escapeRegex(query.trim())})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="bg-violet-500/40 text-inherit rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
