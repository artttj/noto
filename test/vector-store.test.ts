// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  addClip,
  updateClip,
  deleteClip,
  getAllClips,
  getClipById,
  searchClips,
  clearAllClips,
  getClipCount,
  getOldestClip,
  getClipsByDomain,
} from '../src/shared/embeddings/vector-store';
import type { ClipItem } from '../src/shared/types';

describe('Vector Store Operations', () => {
  beforeEach(async () => {
    await clearAllClips();
  });

  describe('addClip', () => {
    it('should add a clip to the store', async () => {
      const clip: ClipItem = {
        id: 'test-1',
        text: 'Test content',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      };

      await addClip(clip);

      const clips = await getAllClips();
      expect(clips).toHaveLength(1);
      expect(clips[0].id).toBe('test-1');
    });

    it('should add clip with all optional fields', async () => {
      const clip: ClipItem = {
        id: 'test-full',
        text: 'Full content',
        contentType: 'code',
        source: 'clipboard',
        timestamp: Date.now(),
        url: 'https://example.com',
        title: 'Example Title',
        tags: ['tag1', 'tag2'],
      };

      await addClip(clip);

      const retrieved = await getClipById('test-full');
      expect(retrieved?.url).toBe('https://example.com');
      expect(retrieved?.title).toBe('Example Title');
      expect(retrieved?.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('getAllClips', () => {
    it('should return empty array when no clips', async () => {
      const clips = await getAllClips();
      expect(clips).toEqual([]);
    });

    it('should return clips sorted by timestamp descending', async () => {
      const clip1: ClipItem = {
        id: 'older',
        text: 'Older clip',
        contentType: 'text',
        source: 'manual',
        timestamp: 1000,
      };

      const clip2: ClipItem = {
        id: 'newer',
        text: 'Newer clip',
        contentType: 'text',
        source: 'manual',
        timestamp: 2000,
      };

      await addClip(clip1);
      await addClip(clip2);

      const clips = await getAllClips();
      expect(clips[0].id).toBe('newer');
      expect(clips[1].id).toBe('older');
    });
  });

  describe('getClipById', () => {
    it('should return clip by id', async () => {
      const clip: ClipItem = {
        id: 'find-me',
        text: 'Findable content',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      };

      await addClip(clip);

      const found = await getClipById('find-me');
      expect(found).not.toBeNull();
      expect(found?.text).toBe('Findable content');
    });

    it('should return null for non-existent id', async () => {
      const found = await getClipById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('updateClip', () => {
    it('should update existing clip', async () => {
      const clip: ClipItem = {
        id: 'update-test',
        text: 'Original text',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      };

      await addClip(clip);

      const updated: ClipItem = {
        ...clip,
        text: 'Updated text',
      };

      await updateClip(updated);

      const retrieved = await getClipById('update-test');
      expect(retrieved?.text).toBe('Updated text');
    });
  });

  describe('deleteClip', () => {
    it('should delete clip by id', async () => {
      const clip: ClipItem = {
        id: 'delete-me',
        text: 'Delete this',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      };

      await addClip(clip);
      await deleteClip('delete-me');

      const found = await getClipById('delete-me');
      expect(found).toBeNull();
    });

    it('should handle deleting non-existent clip gracefully', async () => {
      await expect(deleteClip('non-existent')).resolves.not.toThrow();
    });
  });

  describe('searchClips', () => {
    beforeEach(async () => {
      await addClip({
        id: 'search-1',
        text: 'Hello world from JavaScript',
        contentType: 'code',
        source: 'manual',
        timestamp: Date.now(),
        title: 'JS Tutorial',
        url: 'https://javascript.info',
        tags: ['js', 'tutorial'],
      });

      await addClip({
        id: 'search-2',
        text: 'Python programming guide',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        title: 'Python Guide',
        url: 'https://python.org',
        tags: ['python'],
      });
    });

    it('should search by text content', async () => {
      const results = await searchClips('javascript');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('search-1');
    });

    it('should search by title', async () => {
      const results = await searchClips('guide');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('search-2');
    });

    it('should search by url', async () => {
      const results = await searchClips('python.org');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('search-2');
    });

    it('should search by tags', async () => {
      const results = await searchClips('tutorial');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('search-1');
    });

    it('should be case-insensitive', async () => {
      const results = await searchClips('HELLO');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      const results = await searchClips('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should match partial strings', async () => {
      const results = await searchClips('prog');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('search-2');
    });
  });

  describe('clearAllClips', () => {
    it('should remove all clips', async () => {
      await addClip({
        id: 'clip-1',
        text: 'Clip 1',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      });

      await addClip({
        id: 'clip-2',
        text: 'Clip 2',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      });

      await clearAllClips();

      const clips = await getAllClips();
      expect(clips).toHaveLength(0);
    });
  });

  describe('getClipCount', () => {
    it('should return 0 when empty', async () => {
      const count = await getClipCount();
      expect(count).toBe(0);
    });

    it('should return correct count', async () => {
      await addClip({
        id: 'count-1',
        text: 'Clip 1',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      });

      await addClip({
        id: 'count-2',
        text: 'Clip 2',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      });

      const count = await getClipCount();
      expect(count).toBe(2);
    });
  });

  describe('getOldestClip', () => {
    it('should return null when no clips', async () => {
      const oldest = await getOldestClip();
      expect(oldest).toBeNull();
    });

    it('should return oldest clip', async () => {
      await addClip({
        id: 'old-clip',
        text: 'Old clip',
        contentType: 'text',
        source: 'manual',
        timestamp: 1000,
      });

      await addClip({
        id: 'new-clip',
        text: 'New clip',
        contentType: 'text',
        source: 'manual',
        timestamp: 2000,
      });

      const oldest = await getOldestClip();
      expect(oldest?.id).toBe('old-clip');
    });
  });

  describe('getClipsByDomain', () => {
    it('should return clips from specific domain', async () => {
      await addClip({
        id: 'domain-1',
        text: 'Clip from github',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://github.com/user/repo',
      });

      await addClip({
        id: 'domain-2',
        text: 'Clip from example',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://example.com/page',
      });

      const results = await getClipsByDomain('github.com');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('domain-1');
    });

    it('should match domain without www prefix', async () => {
      await addClip({
        id: 'www-test',
        text: 'Clip from www site',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://www.example.com/page',
      });

      const results = await getClipsByDomain('example.com');
      expect(results).toHaveLength(1);
    });

    it('should match subdomains', async () => {
      await addClip({
        id: 'subdomain-test',
        text: 'Clip from subdomain',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://api.github.com/endpoint',
      });

      const results = await getClipsByDomain('github.com');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for non-matching domain', async () => {
      await addClip({
        id: 'no-match',
        text: 'Some clip',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'https://example.com',
      });

      const results = await getClipsByDomain('other.com');
      expect(results).toHaveLength(0);
    });

    it('should exclude clips without URLs', async () => {
      await addClip({
        id: 'no-url',
        text: 'No URL clip',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
      });

      const results = await getClipsByDomain('example.com');
      expect(results).toHaveLength(0);
    });

    it('should handle invalid URLs gracefully', async () => {
      await addClip({
        id: 'bad-url',
        text: 'Bad URL clip',
        contentType: 'text',
        source: 'manual',
        timestamp: Date.now(),
        url: 'not-a-valid-url',
      });

      const results = await getClipsByDomain('example.com');
      expect(results).toHaveLength(0);
    });
  });
});
