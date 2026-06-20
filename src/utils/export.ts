import type { SnipNote } from '../types/note';

function noteToPlain(n: SnipNote): string {
  return [
    n.title && `Title: ${n.title}`,
    n.link && `Link: ${n.link}`,
    n.selectedText && `Selection: ${n.selectedText}`,
    n.note && `Note: ${n.note}`,
    n.tags.length && `Tags: ${n.tags.join(', ')}`,
    `Saved: ${new Date(n.createdAt).toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function noteToMarkdown(n: SnipNote): string {
  const title = n.title || n.link || 'Untitled';
  const parts = [`## ${title}`, ''];

  if (n.link) parts.push(`[${n.link}](${n.link})`, '');
  if (n.selectedText) parts.push('> ' + n.selectedText.split('\n').join('\n> '), '');
  if (n.note) parts.push(n.note, '');
  if (n.tags.length) parts.push(`Tags: ${n.tags.map((t) => `\`${t}\``).join(', ')}`, '');
  parts.push(`*Saved ${new Date(n.createdAt).toLocaleString()}*`, '---', '');
  return parts.join('\n');
}

export function notesToTxt(notes: SnipNote[]): string {
  return notes.map(noteToPlain).join('\n\n');
}

export function notesToMarkdown(notes: SnipNote[]): string {
  return notes.map(noteToMarkdown).join('\n');
}

export function noteToMarkdownSingle(n: SnipNote): string {
  return noteToMarkdown(n);
}

export function notesToJson(notes: SnipNote[]): string {
  return JSON.stringify(notes, null, 2);
}

export function notesToPrintHtml(notes: SnipNote[]): string {
  const items = notes
    .map((n) => {
      const title = n.title || n.link || 'Untitled';
      return `<article class="note">
        <h2>${escapeHtml(title)}</h2>
        ${n.link ? `<p><a href="${escapeHtml(n.link)}">${escapeHtml(n.link)}</a></p>` : ''}
        ${n.note ? `<p>${escapeHtml(n.note).replace(/\n/g, '<br>')}</p>` : ''}
        ${n.tags.length ? `<p><small>Tags: ${escapeHtml(n.tags.join(', '))}</small></p>` : ''}
        <hr>
      </article>`;
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SnipNote Export</title>
    <style>body{font-family:system-ui;max-width:720px;margin:2rem auto;line-height:1.5;color:#111}
    h1{border-bottom:2px solid #7c5ce7;padding-bottom:.5rem}
    .note{margin-bottom:1.5rem} hr{border:none;border-top:1px solid #ddd}</style></head>
    <body><h1>SnipNote Export (${notes.length})</h1>${items}</body></html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function triggerDownload(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function openPrintView(notes: SnipNote[]): void {
  const html = notesToPrintHtml(notes);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export async function parseImportFile(file: File): Promise<SnipNote[]> {
  const text = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parseCsv(text);
  }

  const parsed = JSON.parse(text) as unknown;
  const arr = Array.isArray(parsed) ? parsed : (parsed as { notes?: unknown }).notes;
  if (!Array.isArray(arr)) throw new Error('Invalid JSON format');
  return arr as SnipNote[];
}

function parseCsv(text: string): SnipNote[] {
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const linkIdx = headers.indexOf('link');
  const noteIdx = headers.indexOf('note');
  const titleIdx = headers.indexOf('title');

  return lines.slice(1).map((line, i) => {
    const cols = line.split(',');
    return {
      id: crypto.randomUUID(),
      link: linkIdx >= 0 ? cols[linkIdx]?.trim() ?? '' : '',
      title: titleIdx >= 0 ? cols[titleIdx]?.trim() ?? '' : '',
      note: noteIdx >= 0 ? cols[noteIdx]?.trim() ?? '' : '',
      tags: [],
      createdAt: Date.now() - i,
      updatedAt: Date.now() - i,
      pinned: false,
      starred: false,
      archived: false,
      folderId: null,
      color: null,
      sortOrder: i,
    } satisfies SnipNote;
  });
}
