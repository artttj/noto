// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { createIcons, icons } from '../shared/icons';
import { escapeHtml } from '../shared/utils';
import {
  getSettings,
  saveSettings,
  getTheme,
  getClipboardMonitoring,
  setClipboardMonitoring,
  getMaxHistorySize,
  setMaxHistorySize,
  getBadgeCounterEnabled,
  setBadgeCounterEnabled,
  getReadingCompanionEnabled,
  setReadingCompanionEnabled,
} from '../shared/storage';
import {
  getSontoItemCount,
  clearAllSontoItems,
} from '../shared/storage/items';
import { exportBackup, importBackup, downloadBackup } from '../shared/backup';
import { setLocale, applyI18n } from '../shared/i18n';

function qs<T extends HTMLElement>(selector: string): T {
  return document.querySelector<T>(selector)!;
}

function showStatus(id: string): void {
  const el = document.getElementById(id)!;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2200);
}

function initTabs(): void {
  const items = document.querySelectorAll<HTMLButtonElement>('.nav-item');
  const panels = document.querySelectorAll<HTMLElement>('.tab-panel');

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab!;
      items.forEach((i) => i.classList.remove('active'));
      panels.forEach((p) => p.classList.add('hidden'));
      item.classList.add('active');
      document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    });
  });
}

function initSegmented(
  containerId: string,
  onSelect: (value: string) => void,
): (val: string) => void {
  const container = document.getElementById(containerId)!;
  const buttons = container.querySelectorAll<HTMLButtonElement>('.seg-btn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(btn.dataset.value!);
    });
  });

  return (val: string) => {
    buttons.forEach((b) => b.classList.toggle('active', b.dataset.value === val));
  };
}

async function initClipboardTab(): Promise<void> {
  const monitoringToggle = qs<HTMLInputElement>('#clipboard-monitoring-toggle');
  const maxSizeInput = qs<HTMLInputElement>('#max-history-size');
  const clipCountEl = document.getElementById('clip-count-display');
  const badgeToggle = qs<HTMLInputElement>('#badge-counter-toggle');
  const companionToggle = qs<HTMLInputElement>('#reading-companion-toggle');

  const [monitoring, maxSize, count, badgeEnabled, companionEnabled] = await Promise.all([
    getClipboardMonitoring(),
    getMaxHistorySize(),
    getSontoItemCount(),
    getBadgeCounterEnabled(),
    getReadingCompanionEnabled(),
  ]);

  monitoringToggle.checked = monitoring;
  maxSizeInput.value = String(maxSize);
  if (clipCountEl) clipCountEl.textContent = String(count);
  badgeToggle.checked = badgeEnabled;
  companionToggle.checked = companionEnabled;

  monitoringToggle.addEventListener('change', async () => {
    await setClipboardMonitoring(monitoringToggle.checked);
    showStatus('status-monitoring');
  });

  maxSizeInput.addEventListener('change', async () => {
    const val = parseInt(maxSizeInput.value, 10);
    if (Number.isFinite(val) && val >= 10 && val <= 5000) {
      await setMaxHistorySize(val);
      showStatus('status-max-size');
    } else {
      maxSizeInput.value = String(maxSize);
    }
  });

  badgeToggle.addEventListener('change', async () => {
    await setBadgeCounterEnabled(badgeToggle.checked);
    if (!badgeToggle.checked) {
      await chrome.action.setBadgeText({ text: '' });
    }
  });

  companionToggle.addEventListener('change', async () => {
    await setReadingCompanionEnabled(companionToggle.checked);
  });
}

async function initDataTab(): Promise<void> {
  const countEl = document.getElementById('snippet-count-data')!;
  const count = await getSontoItemCount();
  countEl.textContent = String(count);

  const versionEl = document.getElementById('about-version')!;
  const manifest = chrome.runtime.getManifest();
  versionEl.textContent = manifest.version;

  qs<HTMLButtonElement>('#btn-export').addEventListener('click', async () => {
    const json = await exportBackup();
    downloadBackup(json);
    showStatus('status-export');
  });

  const importFile = qs<HTMLInputElement>('#import-file');
  qs<HTMLButtonElement>('#btn-import').addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const merge = confirm(
        'Merge with existing data?\n\nClick OK to merge (imported items will be added to existing data).\nClick Cancel to replace all existing data.',
      );

      const result = await importBackup(text, merge);

      const newCount = await getSontoItemCount();
      countEl.textContent = String(newCount);
      showStatus('status-import');
      alert(
        `Import successful!\n${result.items} items imported:\n- ${result.clips} clips\n- ${result.prompts} prompts`,
      );
    } catch (err) {
      alert('Failed to import: invalid file format');
    }

    importFile.value = '';
  });

  qs<HTMLButtonElement>('#btn-delete-all').addEventListener('click', async () => {
    const current = await getSontoItemCount();
    if (current === 0) return;
    if (!confirm(`Delete all ${current} items? This cannot be undone.`)) return;
    await clearAllSontoItems();
    countEl.textContent = '0';
    showStatus('status-delete');
  });
}

async function initLanguageTab(): Promise<void> {
  const settings = await getSettings();
  const setLanguage = initSegmented('language-segmented', async (lang) => {
    await saveSettings({ language: lang as 'en' | 'de' });
    setLocale(lang);
    applyI18n();
  });
  setLanguage(settings.language);
}

async function init(): Promise<void> {
  const [settings, theme] = await Promise.all([getSettings(), getTheme()]);

  setLocale(settings.language);
  applyI18n();

  document.documentElement.dataset.theme = theme;

  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes.sonto_theme) {
      document.documentElement.dataset.theme = changes.sonto_theme.newValue as string;
    }
  });

  initTabs();

  await Promise.all([initLanguageTab(), initClipboardTab(), initDataTab()]);

  createIcons({ icons, attrs: { strokeWidth: 1.5 } });
}

void init();
