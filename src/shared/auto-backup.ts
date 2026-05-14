import { STORAGE_KEYS } from './constants';
import { getAllSontoItems, saveSontoItem } from './storage/items';
import { validateSontoItem } from './backup';
import type { SontoItem } from './types';

const BACKUP_DEBOUNCE_MS = 30_000;
const ALARM_NAME = 'sonto-backup';
const ALARM_PERIOD_MINUTES = 360;
const BACKUP_VERSION = 1;

interface BackupPayload {
  v: number;
  ts: number;
  c: number;
  items: SontoItem[];
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleBackup(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void performBackup();
  }, BACKUP_DEBOUNCE_MS);
}

export async function performBackup(): Promise<void> {
  try {
    const items = await getAllSontoItems();
    const payload: BackupPayload = {
      v: BACKUP_VERSION,
      ts: Date.now(),
      c: items.length,
      items,
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.BACKUP]: payload });
  } catch (err) {
    console.error('[Noto] Backup failed:', err);
  }
}

export async function checkAndRestore(): Promise<void> {
  try {
    const items = await getAllSontoItems();
    if (items.length > 0) return;

    const result = await chrome.storage.local.get(STORAGE_KEYS.BACKUP);
    const backup = result[STORAGE_KEYS.BACKUP] as BackupPayload | undefined;
    if (!backup?.items?.length) return;
    if (backup.v !== BACKUP_VERSION) return;

    let restored = 0;
    for (const item of backup.items) {
      const validation = validateSontoItem(item);
      if (!validation.valid) {
        console.warn('[Noto] Skipping invalid backup item:', item.id, validation.error);
        continue;
      }
      try {
        await saveSontoItem(item);
        restored++;
      } catch (err) {
        console.error('[Noto] Failed to restore item:', item.id, err);
      }
    }

    console.log(`[Noto] Restored ${restored} of ${backup.c} items from backup`);
  } catch (err) {
    console.error('[Noto] Restore check failed:', err);
  }
}

export async function createBackupAlarm(): Promise<void> {
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: ALARM_PERIOD_MINUTES,
  });
}
