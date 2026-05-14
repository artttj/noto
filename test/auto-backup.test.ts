import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  scheduleBackup,
  performBackup,
  checkAndRestore,
  createBackupAlarm,
} from '../src/shared/auto-backup';
import { getAllSontoItems, saveSontoItem, clearAllSontoItems } from '../src/shared/storage/items';
import type { SontoItem } from '../src/shared/types';
import { STORAGE_KEYS } from '../src/shared/constants';
import { mockAlarms } from './setup';

function makeItem(overrides: Partial<SontoItem> = {}): SontoItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'prompt',
    content: 'Test content',
    contentType: 'text',
    source: 'manual',
    origin: 'user',
    tags: [],
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('auto-backup', () => {
  beforeEach(async () => {
    await clearAllSontoItems();
    await chrome.storage.local.remove(STORAGE_KEYS.BACKUP);
  });

  describe('performBackup', () => {
    it('writes all items to chrome.storage.local', async () => {
      const item = makeItem({ content: 'Hello' });
      await saveSontoItem(item);

      await performBackup();

      const stored = await chrome.storage.local.get(STORAGE_KEYS.BACKUP);
      const backup = stored[STORAGE_KEYS.BACKUP] as { v: number; c: number; items: SontoItem[] };

      expect(backup.v).toBe(1);
      expect(backup.c).toBe(1);
      expect(backup.items).toHaveLength(1);
      expect(backup.items[0].content).toBe('Hello');
      expect(backup.ts).toBeGreaterThan(0);
    });

    it('writes empty items array when no items exist', async () => {
      await performBackup();

      const stored = await chrome.storage.local.get(STORAGE_KEYS.BACKUP);
      const backup = stored[STORAGE_KEYS.BACKUP] as { v: number; c: number; items: SontoItem[] };

      expect(backup.c).toBe(0);
      expect(backup.items).toHaveLength(0);
    });
  });

  describe('scheduleBackup', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces multiple calls into one backup', async () => {
      const item = makeItem();
      await saveSontoItem(item);

      scheduleBackup();
      scheduleBackup();
      scheduleBackup();

      vi.advanceTimersByTime(30_001);

      // Flush any pending microtasks so the async performBackup settles
      await vi.runAllTimersAsync();

      const stored = await chrome.storage.local.get(STORAGE_KEYS.BACKUP);
      const backup = stored[STORAGE_KEYS.BACKUP] as { c: number };
      expect(backup.c).toBe(1);
    });

    it('does not fire backup before debounce window', async () => {
      const item = makeItem();
      await saveSontoItem(item);

      scheduleBackup();
      vi.advanceTimersByTime(10_000);

      const stored = await chrome.storage.local.get(STORAGE_KEYS.BACKUP);
      expect(stored[STORAGE_KEYS.BACKUP]).toBeUndefined();
    });
  });

  describe('checkAndRestore', () => {
    it('does nothing when IndexedDB has items', async () => {
      const item = makeItem();
      await saveSontoItem(item);

      await chrome.storage.local.set({
        [STORAGE_KEYS.BACKUP]: { v: 1, ts: 1, c: 0, items: [] },
      });

      await checkAndRestore();

      const items = await getAllSontoItems();
      expect(items).toHaveLength(1);
    });

    it('does nothing when no backup exists', async () => {
      await checkAndRestore();

      const items = await getAllSontoItems();
      expect(items).toHaveLength(0);
    });

    it('restores items when IndexedDB is empty and backup exists', async () => {
      const item = makeItem({ content: 'Backed up' });
      await chrome.storage.local.set({
        [STORAGE_KEYS.BACKUP]: { v: 1, ts: Date.now(), c: 1, items: [item] },
      });

      await checkAndRestore();

      const items = await getAllSontoItems();
      expect(items).toHaveLength(1);
      expect(items[0].content).toBe('Backed up');
    });

    it('skips invalid items during restore', async () => {
      const invalidItem = { id: 'x', content: '', type: 'invalid', contentType: 'x', source: 'x', origin: '', tags: null, createdAt: 'bad' };
      const validItem = makeItem({ content: 'Valid' });
      await chrome.storage.local.set({
        [STORAGE_KEYS.BACKUP]: { v: 1, ts: Date.now(), c: 2, items: [invalidItem as unknown as SontoItem, validItem] },
      });

      await checkAndRestore();

      const items = await getAllSontoItems();
      expect(items).toHaveLength(1);
      expect(items[0].content).toBe('Valid');
    });
  });

  describe('createBackupAlarm', () => {
    it('creates a periodic alarm', async () => {
      await createBackupAlarm();

      const alarm = mockAlarms.get('sonto-backup');
      expect(alarm).toBeDefined();
      expect(alarm!.periodInMinutes).toBe(360);
    });
  });
});
