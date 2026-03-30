// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { vi } from 'vitest';

const mockStorage: Record<string, unknown> = {};
const mockSessionStorage: Record<string, unknown> = {};
const mockAlarms: Map<string, { when: number; periodInMinutes?: number }> = new Map();
const mockNotifications: unknown[] = [];

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

  vi.clearAllMocks();
});

// Export for test usage
export { mockStorage, mockSessionStorage, mockAlarms, mockNotifications };
