// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach } from 'vitest';
import { RelatedClipsHandler } from '../src/background/related-clips-handler';
import { clearAllClips, addClip } from '../src/shared/embeddings/vector-store';
import type { ClipItem } from '../src/shared/types';

describe('RelatedClipsHandler', () => {
  let handler: RelatedClipsHandler;

  beforeEach(async () => {
    handler = new RelatedClipsHandler();
    await clearAllClips();
  });

  describe('getByDomain', () => {
    it('should return clips from specific domain', async () => {
      const clip1: ClipItem = {
        id: 'clip-1',
        text: 'GitHub content',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://github.com/user/repo',
        title: 'GitHub Repo',
      };

      const clip2: ClipItem = {
        id: 'clip-2',
        text: 'Example content',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://example.com/page',
        title: 'Example Page',
      };

      await addClip(clip1);
      await addClip(clip2);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(1);
      expect((results[0] as ClipItem).url).toBe('https://github.com/user/repo');
    });

    it('should limit results to 5 clips', async () => {
      for (let i = 0; i < 10; i++) {
        const clip: ClipItem = {
          id: `clip-${i}`,
          text: `Content ${i}`,
          contentType: 'text',
          source: 'manual',
          timestamp: Date.now() + i,
          url: `https://github.com/repo${i}`,
        };
        await addClip(clip);
      }

      const results = await handler.getByDomain('github.com');
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should match subdomains', async () => {
      const clip: ClipItem = {
        id: 'subdomain-clip',
        text: 'API docs',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://api.github.com/docs',
      };

      await addClip(clip);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      const clip: ClipItem = {
        id: 'other',
        text: 'Other content',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://other.com/page',
      };

      await addClip(clip);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(0);
    });

    it('should return empty array when no clips exist', async () => {
      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(0);
    });

    it('should exclude clips without URLs', async () => {
      const withUrl: ClipItem = {
        id: 'with-url',
        text: 'With URL',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://github.com/page',
      };

      const withoutUrl: ClipItem = {
        id: 'without-url',
        text: 'Without URL',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      };

      await addClip(withUrl);
      await addClip(withoutUrl);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(1);
      expect((results[0] as ClipItem).id).toBe('with-url');
    });

    it('should handle domain without www prefix', async () => {
      const clip: ClipItem = {
        id: 'www-clip',
        text: 'With www',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://www.github.com/page',
      };

      await addClip(clip);

      const results = await handler.getByDomain('github.com');
      expect(results).toHaveLength(1);
    });

    it('should preserve order from vector store', async () => {
      const clip1: ClipItem = {
        id: 'older',
        text: 'Older',
        contentType: 'text',
        source: 'manual',
        timestamp: 1000,
        url: 'https://github.com/older',
      };

      const clip2: ClipItem = {
        id: 'newer',
        text: 'Newer',
        contentType: 'text',
        source: 'manual',
        timestamp: 2000,
        url: 'https://github.com/newer',
      };

      await addClip(clip1);
      await addClip(clip2);

      const results = await handler.getByDomain('github.com');
      expect((results[0] as ClipItem).id).toBe('newer');
      expect((results[1] as ClipItem).id).toBe('older');
    });
  });
});
