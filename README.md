# SnipNote Chrome Extension

SnipNote is a **modular** Chrome extension for saving links, page titles, and notes. Use the popup for quick capture, the **Manager** for power features, and **Settings** to enable only what you need — keeping it fast and lightweight.

## Core (always available)

- Quick capture popup with auto-fill from current tab
- Search, tags, pin, star, archive, edit, delete
- Export TXT / JSON / Markdown
- Context menu: save page
- Keyboard shortcuts: `Alt+Shift+S` (quick save), `Alt+Shift+M` (manager)
- Onboarding tour for new users

## Optional features (toggle in Settings)

Enable or disable each module independently:

| Category | Features |
|----------|----------|
| **Capture** | Text selection save, screenshots, duplicate URL warning, title refresh |
| **Organization** | Folders, color labels, archive, starred, templates, drag reorder |
| **Discovery** | Domain filter, search highlight, favicon previews |
| **Export** | Markdown copy/export, bulk import, multi-select, print view, open all links |
| **Experience** | Markdown preview, undo delete, keyboard nav, statistics, reminders |
| **Data (heavier)** | Chrome sync (no screenshots), scheduled backup, note encryption |

> **Performance tip:** Keep screenshot, sync, and encryption off unless you need them.

## Quick presets

| Preset | What it does |
|--------|----------------|
| **Minimal** | Popup-first: save, search, pin & archive only — fastest |
| **Balanced** | Default — most features on, heavy data tools off |
| **Full** | Everything on including screenshots, sync, backup & encryption |

Apply presets in **Settings → Quick presets**, or click **⚡ Minimal** in the popup header for one-click lightweight mode.

## Quick install (no build required)

Use the pre-built **`dist.zip`** in the repo root — extract and load it in Chrome:

1. Download or extract `dist.zip` (you will get a `dist` folder)
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the extracted `dist` folder

No Node.js or build step needed.

## Install from source

```bash
git clone https://github.com/abdullah-dev5/SnipNote.git
cd SnipNote
npm install
npm run build
```

Load the `dist` folder in `chrome://extensions` → **Load unpacked**.

To refresh `dist.zip` after changes, run `npm run build` then re-zip the `dist` folder.

## Usage

1. **Popup** — Click toolbar icon for quick save & recent notes (shows up to 25; open Manager for full list)
2. **Manager** — Click "Manager" in popup or `Alt+Shift+M` for bulk actions, stats, import, drag reorder
3. **Settings** — Click ⚙ or extension options to toggle features, theme, density, sync, backup

## Project structure

```
src/
├── components/   Popup, Manager, Options, NoteCard, etc.
├── hooks/        useAppData, useTheme
├── types/        notes, settings, feature flags
├── utils/        storage, export, filter, crypto
├── background.ts service worker (menus, shortcuts, alarms)
├── popup.html / manager.html / options.html
dist/             Load this in Chrome (or use dist.zip)
dist.zip          Pre-built extension — extract and load dist/
```

## License

MIT
