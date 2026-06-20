import type { SortOption } from './note';

export type ThemeMode = 'dark' | 'light' | 'system';
export type DensityMode = 'compact' | 'comfortable';

export interface FeatureFlags {
  textSelection: boolean;
  screenshot: boolean;
  quickShortcut: boolean;
  duplicateDetection: boolean;
  bulkImport: boolean;
  folders: boolean;
  colorLabels: boolean;
  archive: boolean;
  starred: boolean;
  domainFilter: boolean;
  templates: boolean;
  markdownExport: boolean;
  multiSelect: boolean;
  statistics: boolean;
  printView: boolean;
  openAllLinks: boolean;
  dragReorder: boolean;
  titleRefresh: boolean;
  linkPreviews: boolean;
  searchHighlight: boolean;
  markdownPreview: boolean;
  undoDelete: boolean;
  keyboardNav: boolean;
  reminders: boolean;
  syncNotes: boolean;
  autoBackup: boolean;
  encryption: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  density: DensityMode;
  sortBy: SortOption;
  showArchived: boolean;
  autoCaptureTab: boolean;
  onboardingDone: boolean;
  autoBackupDays: number;
  syncEnabled: boolean;
  encryptionEnabled: boolean;
  features: FeatureFlags;
}

export const DEFAULT_FEATURES: FeatureFlags = {
  textSelection: true,
  screenshot: false,
  quickShortcut: true,
  duplicateDetection: true,
  bulkImport: true,
  folders: true,
  colorLabels: true,
  archive: true,
  starred: true,
  domainFilter: true,
  templates: true,
  markdownExport: true,
  multiSelect: true,
  statistics: true,
  printView: true,
  openAllLinks: true,
  dragReorder: true,
  titleRefresh: true,
  linkPreviews: true,
  searchHighlight: true,
  markdownPreview: true,
  undoDelete: true,
  keyboardNav: true,
  reminders: true,
  syncNotes: false,
  autoBackup: false,
  encryption: false,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  density: 'comfortable',
  sortBy: 'newest',
  showArchived: false,
  autoCaptureTab: true,
  onboardingDone: false,
  autoBackupDays: 7,
  syncEnabled: false,
  encryptionEnabled: false,
  features: DEFAULT_FEATURES,
};

/** Fast popup-only experience — disables heavy modules and data features. */
export const MINIMAL_FEATURES: FeatureFlags = {
  textSelection: true,
  screenshot: false,
  quickShortcut: true,
  duplicateDetection: true,
  bulkImport: false,
  folders: false,
  colorLabels: false,
  archive: true,
  starred: false,
  domainFilter: false,
  templates: false,
  markdownExport: false,
  multiSelect: false,
  statistics: false,
  printView: false,
  openAllLinks: false,
  dragReorder: false,
  titleRefresh: false,
  linkPreviews: false,
  searchHighlight: true,
  markdownPreview: false,
  undoDelete: true,
  keyboardNav: false,
  reminders: false,
  syncNotes: false,
  autoBackup: false,
  encryption: false,
};

/** Everything on, including storage-heavy capture & data modules. */
export const FULL_FEATURES: FeatureFlags = {
  ...DEFAULT_FEATURES,
  screenshot: true,
  syncNotes: true,
  autoBackup: true,
  encryption: true,
};

export type SettingsPreset = 'minimal' | 'balanced' | 'full';

export const PRESET_LABELS: Record<SettingsPreset, { title: string; description: string }> = {
  minimal: {
    title: 'Minimal',
    description: 'Popup-first: save, search, pin & archive only. Fastest.',
  },
  balanced: {
    title: 'Balanced',
    description: 'Recommended defaults — most features on, heavy data tools off.',
  },
  full: {
    title: 'Full',
    description: 'All modules including screenshots, sync, backup & encryption.',
  },
};

function featuresMatch(a: FeatureFlags, b: FeatureFlags): boolean {
  return (Object.keys(a) as (keyof FeatureFlags)[]).every((key) => a[key] === b[key]);
}

export function detectPreset(settings: AppSettings): SettingsPreset | 'custom' {
  if (featuresMatch(settings.features, MINIMAL_FEATURES)) return 'minimal';
  if (featuresMatch(settings.features, FULL_FEATURES)) return 'full';
  if (featuresMatch(settings.features, DEFAULT_FEATURES)) return 'balanced';
  return 'custom';
}

export function applyPreset(preset: SettingsPreset): Partial<AppSettings> {
  switch (preset) {
    case 'minimal':
      return {
        features: { ...MINIMAL_FEATURES },
        density: 'compact',
        syncEnabled: false,
        encryptionEnabled: false,
        showArchived: false,
      };
    case 'full':
      return {
        features: { ...FULL_FEATURES },
        density: 'comfortable',
      };
    case 'balanced':
    default:
      return {
        features: { ...DEFAULT_FEATURES },
        density: 'comfortable',
        syncEnabled: false,
        encryptionEnabled: false,
      };
  }
}

export const FEATURE_GROUPS: { title: string; keys: (keyof FeatureFlags)[] }[] = [
  {
    title: 'Capture',
    keys: ['textSelection', 'screenshot', 'quickShortcut', 'duplicateDetection', 'titleRefresh'],
  },
  {
    title: 'Organization',
    keys: ['folders', 'colorLabels', 'archive', 'starred', 'templates', 'dragReorder'],
  },
  {
    title: 'Discovery',
    keys: ['domainFilter', 'searchHighlight', 'linkPreviews'],
  },
  {
    title: 'Export & sharing',
    keys: ['markdownExport', 'bulkImport', 'multiSelect', 'printView', 'openAllLinks'],
  },
  {
    title: 'Experience',
    keys: ['markdownPreview', 'undoDelete', 'keyboardNav', 'statistics', 'reminders'],
  },
  {
    title: 'Data (heavier — opt in)',
    keys: ['syncNotes', 'autoBackup', 'encryption'],
  },
];

export const FEATURE_LABELS: Record<keyof FeatureFlags, string> = {
  textSelection: 'Save selected text via context menu',
  screenshot: 'Attach page screenshot (uses more storage)',
  quickShortcut: 'Keyboard shortcut (Alt+Shift+S)',
  duplicateDetection: 'Warn on duplicate URLs',
  bulkImport: 'Import JSON/CSV in manager',
  folders: 'Folders / collections',
  colorLabels: 'Color labels on notes',
  archive: 'Archive notes',
  starred: 'Star favorites (separate from pin)',
  domainFilter: 'Filter by website domain',
  templates: 'Note templates',
  markdownExport: 'Markdown export & copy',
  multiSelect: 'Multi-select bulk actions',
  statistics: 'Usage statistics',
  printView: 'Print-friendly view',
  openAllLinks: 'Open all filtered links',
  dragReorder: 'Drag to reorder (manual sort)',
  titleRefresh: 'Refresh page title from URL',
  linkPreviews: 'Show favicon on cards',
  searchHighlight: 'Highlight search matches',
  markdownPreview: 'Markdown preview in editor',
  undoDelete: 'Undo delete (5 seconds)',
  keyboardNav: 'Keyboard navigation in manager',
  reminders: 'Note reminders & notifications',
  syncNotes: 'Sync notes across Chrome (no screenshots)',
  autoBackup: 'Scheduled JSON backup to Downloads',
  encryption: 'Encrypt note text with password',
};
