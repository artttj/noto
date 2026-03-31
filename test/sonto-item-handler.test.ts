// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach } from 'vitest';
import { SontoItemHandler } from '../src/background/sonto-item-handler';
import { clearAllSontoItems } from '../src/shared/storage/items';
import type { SontoItem } from '../src/shared/types';

describe('SontoItemHandler', () => {
  let handler: SontoItemHandler;

  beforeEach(async () => {
    handler = new SontoItemHandler();
    await clearAllSontoItems();
  });

  describe('create', () => {
    it('should create a basic item', async () => {
      const item = await handler.create('Test content', 'clip', 'manual');

      expect(item.content).toBe('Test content');
      expect(item.type).toBe('clip');
      expect(item.source).toBe('manual');
      expect(item.origin).toBe('manual');
      expect(item.id).toBeDefined();
      expect(item.createdAt).toBeGreaterThan(0);
      expect(item.pinned).toBe(false);
      expect(item.zenified).toBe(false);
      expect(item.tags).toEqual([]);
    });

    it('should truncate long content', async () => {
      const longContent = 'a'.repeat(15000);
      const item = await handler.create(longContent, 'clip', 'manual');

      expect(item.content.length).toBe(10000);
    });

    it('should create item with options', async () => {
      const item = await handler.create(
        'Content with options',
        'prompt',
        'manual',
        {
          contentType: 'code',
          origin: 'test-origin',
          url: 'https://example.com',
          title: 'Test Title',
          tags: ['tag1', 'tag2'],
          pinned: true,
          zenified: true,
          metadata: { color: 'blue' },
        }
      );

      expect(item.type).toBe('prompt');
      expect(item.contentType).toBe('code');
      expect(item.origin).toBe('test-origin');
      expect(item.url).toBe('https://example.com');
      expect(item.title).toBe('Test Title');
      expect(item.tags).toEqual(['tag1', 'tag2']);
      expect(item.pinned).toBe(true);
      expect(item.zenified).toBe(true);
      expect(item.metadata).toEqual({ color: 'blue' });
    });

    it('should auto-detect content type', async () => {
      const linkItem = await handler.create('https://example.com', 'clip', 'manual');
      expect(linkItem.contentType).toBe('link');

      const emailItem = await handler.create('test@example.com', 'clip', 'manual');
      expect(emailItem.contentType).toBe('email');

      const codeItem = await handler.create('function test() { return 42; }', 'clip', 'manual');
      expect(codeItem.contentType).toBe('code');

      const textItem = await handler.create('Just plain text', 'clip', 'manual');
      expect(textItem.contentType).toBe('text');
    });
  });

  describe('getAll', () => {
    it('should return all items', async () => {
      await handler.create('Item 1', 'clip', 'manual');
      await handler.create('Item 2', 'prompt', 'manual');

      const items = await handler.getAll();
      expect(items).toHaveLength(2);
    });

    it('should apply limit', async () => {
      await handler.create('Item 1', 'clip', 'manual');
      await handler.create('Item 2', 'clip', 'manual');
      await handler.create('Item 3', 'clip', 'manual');

      const limited = await handler.getAll({ limit: 2 });
      expect(limited).toHaveLength(2);
    });

    it('should apply offset', async () => {
      await handler.create('First', 'clip', 'manual');
      await handler.create('Second', 'clip', 'manual');
      await handler.create('Third', 'clip', 'manual');

      const offset = await handler.getAll({ offset: 1, limit: 1 });
      expect(offset).toHaveLength(1);
      expect(offset[0].content).toBe('Second');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await handler.create('JavaScript tutorial content', 'clip', 'manual', {
        title: 'JS Guide',
        tags: ['js', 'web'],
      });
      await handler.create('Python programming', 'clip', 'manual', {
        title: 'Python Basics',
        tags: ['python'],
      });
    });

    it('should search by content', async () => {
      const results = await handler.search('javascript');
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('JavaScript');
    });

    it('should search by title', async () => {
      const results = await handler.search('python basics');
      expect(results).toHaveLength(1);
    });

    it('should be case-insensitive', async () => {
      const results = await handler.search('JAVASCRIPT');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      const results = await handler.search('ruby');
      expect(results).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update item fields', async () => {
      const created = await handler.create('Original', 'clip', 'manual');

      await handler.update(created.id, { content: 'Updated', pinned: true });

      const items = await handler.getAll();
      expect(items[0].content).toBe('Updated');
      expect(items[0].pinned).toBe(true);
    });

    it('should throw for non-existent item update', async () => {
      await expect(handler.update('non-existent', { content: 'New' })).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('should delete item by id', async () => {
      const created = await handler.create('To delete', 'clip', 'manual');
      await handler.delete(created.id);

      const items = await handler.getAll();
      expect(items).toHaveLength(0);
    });

    it('should silently succeed for non-existent item delete', async () => {
      // Current implementation doesn't throw for non-existent items
      await expect(handler.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('toggleZenified', () => {
    it('should toggle zenified status', async () => {
      const created = await handler.create('Zen test', 'clip', 'manual', { zenified: false });

      const result1 = await handler.toggleZenified(created.id);
      expect(result1).toBe(true);

      const result2 = await handler.toggleZenified(created.id);
      expect(result2).toBe(false);
    });
  });

  describe('addTag and removeTag', () => {
    it('should add tag to item', async () => {
      const created = await handler.create('Tagged', 'clip', 'manual', { tags: [] });

      await handler.addTag(created.id, 'new-tag');

      const items = await handler.getAll();
      expect(items[0].tags).toContain('new-tag');
    });

    it('should remove tag from item', async () => {
      const created = await handler.create('Tagged', 'clip', 'manual', { tags: ['tag1', 'tag2'] });

      await handler.removeTag(created.id, 'tag1');

      const items = await handler.getAll();
      expect(items[0].tags).not.toContain('tag1');
      expect(items[0].tags).toContain('tag2');
    });
  });

  describe('getAllTags', () => {
    it('should return sorted unique tags', async () => {
      await handler.create('Item 1', 'clip', 'manual', { tags: ['zebra', 'apple'] });
      await handler.create('Item 2', 'clip', 'manual', { tags: ['apple', 'banana'] });

      const tags = await handler.getAllTags();
      expect(tags).toEqual(['apple', 'banana', 'zebra']);
    });

    it('should return empty array when no tags', async () => {
      const tags = await handler.getAllTags();
      expect(tags).toEqual([]);
    });
  });
});
