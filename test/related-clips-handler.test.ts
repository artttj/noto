// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach } from 'vitest';
import { RelatedClipsHandler } from '../src/background/related-clips-handler';
import { clearAllSontoItems, saveSontoItem } from '../src/shared/storage/items';
import type { SontoItem } from '../src/shared/types';

interface RelatedClip {
  id: string;
  text: string;
  timestamp: number;
  url?: string;
}

describe('RelatedClipsHandler', () => {
  let handler: RelatedClipsHandler;

  beforeEach(async () => {
    handler = new RelatedClipsHandler();
    await clearAllSontoItems();
  });

  function toRelatedClip(item: SontoItem): RelatedClip {
    return {
      id: item.id,
      text: item.content,
      timestamp: item.createdAt,
      url: item.url,
    };
  }

  describe('getByDomain', () => {
    it('should return clips from specific domain', async () => {
      const clip1: SontoItem = {
        id: 'clip-1',
        type: 'clip',
        content: 'GitHub content',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: Date.now(),
        zenified: false,
        tags: [],
        url: 'https://github.com/user/repo',
        title: 'GitHub Repo',
      };

      const clip2: SontoItem = {
        id: 'clip-2',
        type: 'clip',
        content: 'Example content',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: Date.now(),
        zenified: false,
        tags: [],
        url: 'https://example.com/page',
        title: 'Example Page',
      };

      await saveSontoItem(clip1);
      await saveSontoItem(clip2);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(1);
      expect(results[0].url).toBe('https://github.com/user/repo');
    });

    it('should limit results to 5 clips', async () => {
      for (let i = 0; i < 10; i++) {
        const clip: SontoItem = {
          id: `clip-${i}`,
          type: 'clip',
          content: `Content ${i}`,
          contentType: 'text',
          source: 'manual',
          origin: 'manual',
          createdAt: Date.now() + i,
          zenified: false,
          tags: [],
          url: `https://github.com/repo${i}`,
        };
        await saveSontoItem(clip);
      }

      const results = await handler.getByDomain('github.com');
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should match subdomains', async () => {
      const clip: SontoItem = {
        id: 'subdomain-clip',
        type: 'clip',
        content: 'API docs',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: Date.now(),
        zenified: false,
        tags: [],
        url: 'https://api.github.com/docs',
      };

      await saveSontoItem(clip);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      const clip: SontoItem = {
        id: 'other',
        type: 'clip',
        content: 'Other content',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: Date.now(),
        zenified: false,
        tags: [],
        url: 'https://other.com/page',
      };

      await saveSontoItem(clip);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(0);
    });

    it('should return empty array when no clips exist', async () => {
      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(0);
    });

    it('should exclude clips without URLs', async () => {
      const withUrl: SontoItem = {
        id: 'with-url',
        type: 'clip',
        content: 'With URL',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: Date.now(),
        zenified: false,
        tags: [],
        url: 'https://github.com/page',
      };

      const withoutUrl: SontoItem = {
        id: 'without-url',
        type: 'clip',
        content: 'Without URL',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: Date.now(),
        zenified: false,
        tags: [],
      };

      await saveSontoItem(withUrl);
      await saveSontoItem(withoutUrl);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('with-url');
    });

    it('should handle domain without www prefix', async () => {
      const clip: SontoItem = {
        id: 'www-clip',
        type: 'clip',
        content: 'With www',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: Date.now(),
        zenified: false,
        tags: [],
        url: 'https://www.github.com/page',
      };

      await saveSontoItem(clip);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(1);
    });

    it('should preserve order from newest to oldest', async () => {
      const clip1: SontoItem = {
        id: 'older',
        type: 'clip',
        content: 'Older',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: 1000,
        zenified: false,
        tags: [],
        url: 'https://github.com/older',
      };

      const clip2: SontoItem = {
        id: 'newer',
        type: 'clip',
        content: 'Newer',
        contentType: 'text',
        source: 'manual',
        origin: 'manual',
        createdAt: 2000,
        zenified: false,
        tags: [],
        url: 'https://github.com/newer',
      };

      await saveSontoItem(clip1);
      await saveSontoItem(clip2);

      const results = await handler.getByDomain('github.com');
      expect(results[0].id).toBe('newer');
      expect(results[1].id).toBe('older');
    });
  });
});
