// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach } from 'vitest';
import { ReadLaterHandler } from '../src/background/read-later-handler';
import { mockStorage } from './setup';

describe('Read Later Operations', () => {
  let handler: ReadLaterHandler;

  beforeEach(() => {
    handler = new ReadLaterHandler();
    mockStorage.sonto_read_later = [];
  });

  it('should add an item to read later', async () => {
    await handler.add('https://example.com/article', 'Test Article');

    const items = await handler.getAll();
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://example.com/article');
    expect(items[0].title).toBe('Test Article');
    expect(items[0].addedAt).toBeGreaterThan(0);
  });

  it('should not add duplicate URLs', async () => {
    await handler.add('https://example.com', 'First');
    await handler.add('https://example.com', 'Second');

    const items = await handler.getAll();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('First');
  });

  it('should remove an item from read later', async () => {
    await handler.add('https://example.com/1', 'Article 1');
    await handler.add('https://example.com/2', 'Article 2');

    await handler.remove('https://example.com/1');

    const items = await handler.getAll();
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://example.com/2');
  });

  it('should check URL and return item if found', async () => {
    await handler.add('https://example.com/article', 'Test');

    const item = await handler.checkUrl('https://example.com/article');
    expect(item).not.toBeNull();
    expect(item?.title).toBe('Test');

    const items = await handler.getAll();
    expect(items).toHaveLength(0);
  });

  it('should return null when checking URL not in list', async () => {
    const item = await handler.checkUrl('https://not-in-list.com');
    expect(item).toBeNull();
  });

  it('should handle adding item without title', async () => {
    await handler.add('https://example.com');

    const items = await handler.getAll();
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://example.com');
    expect(items[0].title).toBeUndefined();
  });

  it('should return empty array when no items', async () => {
    const items = await handler.getAll();
    expect(items).toEqual([]);
  });
});
