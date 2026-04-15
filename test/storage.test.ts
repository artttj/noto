// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSettings,
  saveSettings,
  getTheme,
  saveTheme,
  getClipboardMonitoring,
  setClipboardMonitoring,
  getMaxHistorySize,
  setMaxHistorySize,
  getBadgeCounterEnabled,
  setBadgeCounterEnabled,
} from '../src/shared/storage';
import { mockStorage } from './setup';
import { DEFAULT_SETTINGS } from '../src/shared/constants';

describe('Storage Operations', () => {
  beforeEach(() => {
    // Reset storage to empty
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  describe('Settings', () => {
    it('should return default settings when empty', async () => {
      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should save and retrieve settings', async () => {
      await saveSettings({ language: 'de' });

      const settings = await getSettings();
      expect(settings.language).toBe('de');
    });
  });

  describe('Theme', () => {
    it('should default to dark theme', async () => {
      const theme = await getTheme();
      expect(theme).toBe('dark');
    });

    it('should save and retrieve theme', async () => {
      await saveTheme('light');

      const theme = await getTheme();
      expect(theme).toBe('light');
    });
  });

  describe('Clipboard Monitoring', () => {
    it('should default to true', async () => {
      const enabled = await getClipboardMonitoring();
      expect(enabled).toBe(true);
    });

    it('should save and retrieve monitoring state', async () => {
      await setClipboardMonitoring(false);

      const enabled = await getClipboardMonitoring();
      expect(enabled).toBe(false);
    });
  });

  describe('Max History Size', () => {
    it('should return default when not set', async () => {
      const size = await getMaxHistorySize();
      expect(size).toBe(500);
    });

    it('should save and retrieve max history size', async () => {
      await setMaxHistorySize(50);

      const size = await getMaxHistorySize();
      expect(size).toBe(50);
    });
  });

  describe('Badge Counter', () => {
    it('should default to enabled', async () => {
      const enabled = await getBadgeCounterEnabled();
      expect(enabled).toBe(true);
    });

    it('should save and retrieve badge counter state', async () => {
      await setBadgeCounterEnabled(false);

      const enabled = await getBadgeCounterEnabled();
      expect(enabled).toBe(false);
    });
  });
});
