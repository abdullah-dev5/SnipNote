import { useEffect } from 'react';
import type { AppSettings } from '../types/settings';

export function applyTheme(settings: AppSettings): void {
  const root = document.documentElement;
  const theme = settings.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : settings.theme;

  root.dataset.theme = theme;
  root.dataset.density = settings.density;
}

export function useTheme(settings: AppSettings, fullPage = false): void {
  useEffect(() => {
    applyTheme(settings);
    if (fullPage) {
      document.body.classList.add('page-full');
      return () => document.body.classList.remove('page-full');
    }
  }, [settings.theme, settings.density, fullPage]);
}

export function openPage(page: 'manager' | 'options'): void {
  chrome.tabs.create({ url: chrome.runtime.getURL(`${page}.html`) });
}
