import type { SnipNote } from '../types/note';

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: days > 365 ? 'numeric' : undefined,
  });
}

export function parseTags(input: string): string[] {
  return [...new Set(
    input.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean),
  )];
}

export function truncate(text: string, max = 48): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function faviconUrl(link: string): string {
  const domain = getDomain(link);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function estimateStorageBytes(notes: SnipNote[]): number {
  return new Blob([JSON.stringify(notes)]).size;
}

export function renderSimpleMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul class="md-list">$1</ul>')
    .replace(/\n/g, '<br>');
}

export function getTopTags(notes: SnipNote[], limit = 8): string[] {
  const counts = new Map<string, number>();
  notes.forEach((n) => {
    n.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function getUniqueDomains(notes: SnipNote[]): string[] {
  const domains = new Set<string>();
  notes.forEach((n) => {
    const d = getDomain(n.link);
    if (d) domains.add(d);
  });
  return [...domains].sort();
}
