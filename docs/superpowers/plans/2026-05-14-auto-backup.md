# Auto-Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mirror IndexedDB items to chrome.storage.local so data can be auto-restored if IndexedDB is evicted.

**Architecture:** New `src/shared/auto-backup.ts` module with three exports (`scheduleBackup`, `performBackup`, `checkAndRestore`). Called from `sonto-item-handler.ts` after mutations and from `service-worker.ts` on startup. Uses `chrome.alarms` for a 6-hour periodic fallback.

**Tech Stack:** TypeScript, Chrome Extension APIs (storage.local, alarms), Vitest

---

### Task 1: Add backup storage key constant

**Files:**
- Modify: `src/shared/constants.ts:18`

- [ ] **Step 1: Add BACKUP key**

Insert after `PROMPT_LOCK_DURATION` line in `STORAGE_KEYS`:

```typescript
BACKUP: 'sonto_items_backup',
```

Full STORAGE_KEYS block after change:

```typescript
export const STORAGE_KEYS = {
  SETTINGS: 'sonto_settings',
  THEME: 'sonto_theme',
  CLIPBOARD_MONITORING: 'sonto_clipboard_monitoring',
  MAX_HISTORY_SIZE: 'sonto_max_history_size',
  CUSTOM_JSON_SOURCES: 'sonto_custom_json_sources',
  BADGE_COUNTER_ENABLED: 'sonto_badge_counter_enabled',
  READING_COMPANION_ENABLED: 'sonto_reading_companion_enabled',
  COLLECTIONS: 'sonto_collections',
  MIGRATION_VERSION: 'sonto_migration_version',
  PROMPT_LOCK_ENABLED: 'sonto_prompt_lock_enabled',
  PROMPT_LOCK_PIN: 'sonto_prompt_lock_pin',
  PROMPT_LOCK_DURATION: 'sonto_prompt_lock_duration',
  BACKUP: 'sonto_items_backup',
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/constants.ts
git commit -m "feat: add backup storage key for auto-backup"
```

---

### Task 2: Export validateSontoItem from backup.ts

**Files:**
- Modify: `src/shared/backup.ts:57,140,164`

- [ ] **Step 1: Export the validateSontoItem function**

Change line 57 from:
```typescript
function validateSontoItem(item: unknown): ValidationResult {
```
to:
```typescript
export function validateSontoItem(item: unknown): ValidationResult {
```

- [ ] **Step 2: Update internal calls to use the export**

On line 140, the call `validateSontoItem(item)` remains unchanged — it still works since the function is now exported from the same module.

Line 164 `validateBackupPayload` also calls it internally, no change needed.

- [ ] **Step 3: Commit**

```bash
git add src/shared/backup.ts
git commit -m "feat: export validateSontoItem for reuse by auto-backup"
```

---

### Task 3: Create auto-backup.ts module

**Files:**
- Create: `src/shared/auto-backup.ts`

- [ ] **Step 1: Create the module**

Write `src/shared/auto-backup.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/auto-backup.ts
git commit -m "feat: add auto-backup module for IndexedDB data safety"
```

---

### Task 4: Wire scheduleBackup into sonto-item-handler

**Files:**
- Modify: `src/background/sonto-item-handler.ts:5,29-61,71-77`

- [ ] **Step 1: Add import**

Add after the existing imports (after line 26 which imports from `../shared/storage/items`):

```typescript
import { scheduleBackup } from '../shared/auto-backup';
```

- [ ] **Step 2: Call scheduleBackup after create**

In the `create` method, after `await saveSontoItem(item);` (line 59), add:

```typescript
scheduleBackup();
```

The end of the `create` method should read:

```typescript
    await saveSontoItem(item);
    scheduleBackup();
    return item;
```

- [ ] **Step 3: Call scheduleBackup after update**

In the `update` method, after `await updateSontoItem(id, updates);` (line 72), add:

```typescript
scheduleBackup();
```

The `update` method should read:

```typescript
  async update(id: string, updates: Partial<SontoItem>): Promise<void> {
    await updateSontoItem(id, updates);
    scheduleBackup();
  }
```

- [ ] **Step 4: Call scheduleBackup after delete**

In the `delete` method, after `await deleteSontoItem(id);` (line 76), add:

```typescript
scheduleBackup();
```

The `delete` method should read:

```typescript
  async delete(id: string): Promise<void> {
    await deleteSontoItem(id);
    scheduleBackup();
  }
```

- [ ] **Step 5: Commit**

```bash
git add src/background/sonto-item-handler.ts
git commit -m "feat: trigger auto-backup after item mutations"
```

---

### Task 5: Wire checkAndRestore and alarm into service-worker

**Files:**
- Modify: `src/background/service-worker.ts:1-13,133-135`

- [ ] **Step 1: Add imports**

Add after line 13 (after the `import type` line):

```typescript
import { checkAndRestore, createBackupAlarm, performBackup } from '../shared/auto-backup';
```

- [ ] **Step 2: Call checkAndRestore at module init**

Add before the existing `void badgeHandler.restoreBadge();` line (line 135):

```typescript
void checkAndRestore();
```

- [ ] **Step 3: Create the periodic alarm**

Add on the next line:

```typescript
void createBackupAlarm();
```

- [ ] **Step 4: Wire the alarm listener**

Add after the alarm creation line:

```typescript
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sonto-backup') {
    void performBackup();
  }
});
```

- [ ] **Step 5: Verify the bottom of service-worker.ts reads**

```typescript
registerAllHandlers();

void checkAndRestore();
void createBackupAlarm();

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sonto-backup') {
    void performBackup();
  }
});

void badgeHandler.restoreBadge();
```

- [ ] **Step 6: Commit**

```bash
git add src/background/service-worker.ts
git commit -m "feat: run auto-backup restore check and alarm on startup"
```

---

### Task 6: Write unit tests

**Files:**
- Create: `test/auto-backup.test.ts`

- [ ] **Step 1: Create the test file**

Write `test/auto-backup.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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
    vi.useFakeTimers();
    await clearAllSontoItems();
    await chrome.storage.local.remove(STORAGE_KEYS.BACKUP);
  });

  afterEach(() => {
    vi.useRealTimers();
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
    it('debounces multiple calls into one backup', async () => {
      const item = makeItem();
      await saveSontoItem(item);

      scheduleBackup();
      scheduleBackup();
      scheduleBackup();

      // Advance past the debounce window
      vi.advanceTimersByTime(30_001);

      // Allow the async performBackup to complete
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

      // Put a stale backup in storage
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
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run test/auto-backup.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 3: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: all existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add test/auto-backup.test.ts
git commit -m "test: add auto-backup unit tests"
```

---

### Task 7: Build verification

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: build succeeds with no errors, `dist/` contains updated files.

- [ ] **Step 2: Verify built output references the new module**

```bash
grep -l "auto-backup\|sonto_items_backup" dist/**/*.js
```

Expected: at least `dist/background/service-worker.js` shows up.
