// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { vi } from 'vitest';

const mockStorage: Record<string, unknown> = {};
const mockSessionStorage: Record<string, unknown> = {};
const mockAlarms: Map<string, { when: number; periodInMinutes?: number }> = new Map();
const mockNotifications: unknown[] = [];

// In-memory store for IndexedDB
const idbData: Map<string, Map<string, unknown>> = new Map();

// Helper to create DOMStringList-like object
function createDOMStringList(names: string[]): { contains: (name: string) => boolean; length: number } {
  return {
    contains: (name: string) => names.includes(name),
    get length() { return names.length; },
  };
}

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn((name: string, version?: number) => {
    // Create request object
    const req: {
      result: unknown;
      error: Error | null;
      onsuccess: ((e: Event) => void) | null;
      onerror: ((e: Event) => void) | null;
      onupgradeneeded: ((e: Event) => void) | null;
    } = {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    // Create mock database
    const storeNames: string[] = [];
    const db = {
      objectStoreNames: createDOMStringList(storeNames),
      createObjectStore: (storeName: string, options?: { keyPath?: string }) => {
        if (!idbData.has(storeName)) {
          idbData.set(storeName, new Map());
        }
        storeNames.push(storeName);
        return {
          createIndex: () => ({ /* mock index */ }),
        };
      },
      deleteObjectStore: (storeName: string) => {
        const idx = storeNames.indexOf(storeName);
        if (idx > -1) {
          storeNames.splice(idx, 1);
          idbData.delete(storeName);
        }
      },
      transaction: (storeNamesArg: string | string[], mode?: string) => {
        const stores = Array.isArray(storeNamesArg) ? storeNamesArg : [storeNamesArg];

        return {
          objectStore: (storeName: string) => {
            if (!idbData.has(storeName)) {
              idbData.set(storeName, new Map());
            }
            const store = idbData.get(storeName)!;

            return {
              put: (value: unknown, key?: string) => {
                const k = key ?? (value as Record<string, string>).id ?? `${Date.now()}-${Math.random()}`;
                store.set(k, value);
                return { set onsuccess(cb: () => void) { cb(); } };
              },
              get: (key: string) => {
                const result = store.get(key);
                return { set onsuccess(cb: () => void) { cb(); }, result };
              },
              getAll: (query?: IDBKeyRange | IDBValidKey) => {
                let result = Array.from(store.values());
                // Simple filter for key range if provided (for zenified filter)
                if (query !== undefined) {
                  result = result.filter((item) => {
                    const record = item as Record<string, unknown>;
                    // Handle numeric filters (0 or 1 for booleans)
                    if (typeof query === 'number') {
                      return record.zenified === (query === 1);
                    }
                    return true;
                  });
                }
                return { set onsuccess(cb: () => void) { cb(); }, result };
              },
              count: () => {
                return { set onsuccess(cb: () => void) { cb(); }, result: store.size };
              },
              delete: (key: string) => {
                store.delete(key);
                return { set onsuccess(cb: () => void) { cb(); } };
              },
              clear: () => {
                store.clear();
                return { set onsuccess(cb: () => void) { cb(); } };
              },
              index: (indexName: string) => {
                // Collect unique values from the specified index
                const getIndexValues = (): Map<IDBValidKey, unknown[]> => {
                  const values = new Map<IDBValidKey, unknown[]>();
                  for (const [, item] of store.entries()) {
                    const record = item as Record<string, unknown>;
                    if (indexName === 'tags' && record.tags) {
                      for (const tag of record.tags as string[]) {
                        if (!values.has(tag)) values.set(tag, []);
                        values.get(tag)!.push(item);
                      }
                    } else if (record[indexName] !== undefined) {
                      const key = record[indexName] as IDBValidKey;
                      if (!values.has(key)) values.set(key, []);
                      values.get(key)!.push(item);
                    }
                  }
                  return values;
                };

                const values = getIndexValues();

                return {
                  getAll: (query?: IDBKeyRange | IDBValidKey) => {
                    let result: unknown[] = [];
                    if (query !== undefined) {
                      // Filter by query value
                      result = Array.from(values.get(query) || []);
                    } else {
                      // Return all items
                      for (const [, items] of values) {
                        result.push(...items);
                      }
                    }
                    return {
                      set onsuccess(cb: () => void) {
                        setTimeout(cb, 0);
                      },
                      result,
                    };
                  },
                  openCursor: () => {
                    const keys = Array.from(values.keys());
                    let currentIdx = -1;
                    const cursor = {
                      key: '' as IDBValidKey,
                      value: null,
                      continue: () => void 0,
                    };
                    const req = {
                      result: null as typeof cursor | null,
                      onsuccess: null as ((e: Event) => void) | null,
                      onerror: null as (() => void) | null,
                    };

                    const advance = (): void => {
                      currentIdx++;
                      if (currentIdx < keys.length) {
                        cursor.key = keys[currentIdx];
                        req.result = cursor;
                      } else {
                        req.result = null;
                      }
                      if (req.onsuccess) {
                        const event = new Event('success') as Event & { target: { result: typeof cursor | null } };
                        Object.defineProperty(event, 'target', {
                          value: { result: req.result },
                          writable: false,
                        });
                        req.onsuccess(event);
                      }
                    };

                    cursor.continue = advance;
                    setTimeout(advance, 0);
                    return req;
                  },
                };
              },
            };
          },
          set oncomplete(cb: () => void) { setTimeout(cb, 0); },
          set onerror(_cb: () => void) { /* no-op */ },
        };
      },
    };

    req.result = db;

    // Trigger onupgradeneeded then onsuccess asynchronously
    setTimeout(() => {
      if (req.onupgradeneeded) {
        req.onupgradeneeded(new Event('upgradeneeded'));
      }
      if (req.onsuccess) {
        req.onsuccess(new Event('success'));
      }
    }, 0);

    return req;
  }),

  deleteDatabase: vi.fn((_name: string) => {
    idbData.clear();
    return { set onsuccess(cb: () => void) { setTimeout(cb, 0); } };
  }),
};

(global as unknown as { indexedDB: typeof mockIndexedDB }).indexedDB = mockIndexedDB;

// Mock chrome APIs
global.chrome = {
  runtime: {
    openOptionsPage: vi.fn(() => Promise.resolve()),
    sendMessage: vi.fn(() => Promise.resolve({ ok: true })),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({ manifest_version: 3 })),
    id: 'test-extension-id',
  },
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            if (key in mockStorage) result[key] = mockStorage[key];
          }
          return Promise.resolve(result);
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        return Promise.resolve(mockStorage);
      }),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        if (Array.isArray(keys)) {
          for (const key of keys) delete mockStorage[key];
        } else {
          delete mockStorage[keys];
        }
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        return Promise.resolve();
      }),
    },
    session: {
      get: vi.fn((keys) => {
        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            if (key in mockSessionStorage) result[key] = mockSessionStorage[key];
          }
          return Promise.resolve(result);
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockSessionStorage[keys] });
        }
        return Promise.resolve(mockSessionStorage);
      }),
      set: vi.fn((items) => {
        Object.assign(mockSessionStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        if (Array.isArray(keys)) {
          for (const key of keys) delete mockSessionStorage[key];
        } else {
          delete mockSessionStorage[keys];
        }
        return Promise.resolve();
      }),
    },
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([{ id: 1, url: 'https://example.com', title: 'Test Page' }])),
    sendMessage: vi.fn(() => Promise.resolve()),
  },
  action: {
    setBadgeText: vi.fn(() => Promise.resolve()),
    setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  sidePanel: {
    open: vi.fn(() => Promise.resolve()),
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn((name, info) => {
      mockAlarms.set(name, info);
      return Promise.resolve();
    }),
    clear: vi.fn((name) => {
      const hadAlarm = mockAlarms.has(name);
      mockAlarms.delete(name);
      return Promise.resolve(hadAlarm);
    }),
    clearAll: vi.fn(() => {
      const count = mockAlarms.size;
      mockAlarms.clear();
      return Promise.resolve(count > 0);
    }),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn((options) => {
      mockNotifications.push(options);
      return Promise.resolve('notification-id');
    }),
  },
} as unknown as typeof chrome;

// Reset mocks before each test
beforeEach(() => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  mockAlarms.clear();
  mockNotifications.length = 0;
  idbData.clear();

  vi.clearAllMocks();
});

// Export for test usage
export { mockStorage, mockSessionStorage, mockAlarms, mockNotifications };
