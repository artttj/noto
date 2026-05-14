# Auto-Backup: Guard Against IndexedDB Data Loss

## Problem

Chrome can silently evict IndexedDB data from extensions under storage pressure. Users have reported all items (clips + prompts) disappearing spontaneously. The extension stores all user data in IndexedDB (`sonto_db_v2`) with no automatic backup.

## Solution

Periodically mirror IndexedDB items to `chrome.storage.local`, which Chrome treats as critical data and is far less likely to evict. On startup, if IndexedDB is empty but a backup exists, auto-restore.

## Architecture

Single new module: `src/shared/auto-backup.ts`

```
┌──────────────────┐         ┌──────────────────────────┐
│  sonto-item-     │         │  auto-backup.ts           │
│  handler.ts      │────────▶│                           │
│  (create/update/ │         │  scheduleBackup()         │
│   delete)        │         │  performBackup()          │
└──────────────────┘         │  checkAndRestore()        │
                             │                           │
┌──────────────────┐         │  ┌─────────────────────┐  │
│  chrome.alarms   │────────▶│  │ chrome.storage.local│  │
│  (every 6 hours) │         │  │ key: sonto_items_   │  │
└──────────────────┘         │  │       backup         │  │
                             └──┤─────────────────────┤──┘
┌──────────────────┐            │                     │
│  service-worker  │───────────▶│  IndexedDB          │
│  (on startup)    │ checkAndRestore()                │
└──────────────────┘            │  sonto_db_v2         │
                                └─────────────────────┘
```

## Triggers

1. **Debounced after mutations**: `create`, `update`, `delete` in `sonto-item-handler.ts` call `scheduleBackup()`. Debounced to 30 seconds — resets timer on each call, so rapid edits batch into one write.
2. **Periodic fallback**: `chrome.alarms` fires every 6 hours. Catches cases where the debounced backup never fired (e.g., service worker died before the 30s timer elapsed).
3. **On startup**: Service worker calls `checkAndRestore()`. If IndexedDB has 0 items and a backup key exists, auto-restore all items.

## Storage Format

Key: `sonto_items_backup` in `chrome.storage.local`

```json
{
  "v": 1,
  "ts": 1715700000000,
  "c": 342,
  "items": [
    {
      "id": "1715700000000-abc123",
      "type": "prompt",
      "content": "Hello world",
      ...
    }
  ]
}
```

- `v`: backup schema version (for forward compatibility)
- `ts`: timestamp of last successful backup
- `c`: item count
- `items`: full `SontoItem[]` array

Validated on restore using the same `validateSontoItem` function from `backup.ts`.

## Startup Restore Flow

1. Query IndexedDB item count
2. If count > 0: data is intact, nothing to do
3. If count === 0 and backup exists in `chrome.storage.local`:
   - Parse backup, validate each item
   - Write all valid items to IndexedDB
   - Log restored count
4. If count === 0 and no backup: first run or fresh install, nothing to do
5. If restore fails (corrupt JSON): log error, don't block extension startup

## Files Changed

| File | Change |
|------|--------|
| `src/shared/auto-backup.ts` (new) | `performBackup()`, `scheduleBackup()`, `checkAndRestore()` |
| `src/shared/constants.ts` | Add `BACKUP` key to `STORAGE_KEYS` |
| `src/background/sonto-item-handler.ts` | Call `scheduleBackup()` after create, update, delete |
| `src/background/service-worker.ts` | Call `checkAndRestore()` on init, create 6h `chrome.alarms` |

No UI, settings, or manifest changes.

## Edge Cases

- **Quota exceeded**: If `chrome.storage.local.set()` rejects, catch and log. Next mutation retries.
- **Service worker killed mid-timer**: The 6h `chrome.alarms` fallback covers this.
- **User intentionally deletes all**: Settings "Delete All" calls `clearAllSontoItems()` directly, bypassing sonto-item-handler, so no backup is triggered. Next save will overwrite the stale backup.
- **Import with merge=false**: `clearAllSontoItems()` followed by many `saveSontoItem` calls. Debounce batches backup after all saves complete.
- **Corrupt backup JSON on restore**: Run each item through validation, skip invalid ones, report restored vs skipped count.

## Testing

- **Unit tests**: `performBackup` writes correct shape; `checkAndRestore` restores correctly; debounce batches multiple calls; empty backup doesn't overwrite good data
- **Manual verification**: Delete all IndexedDB data via DevTools, reload extension, confirm restore
- **No E2E test needed**: surface area is small and unit-testable
