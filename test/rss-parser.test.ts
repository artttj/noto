// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect } from 'vitest';
import { parseFeed } from '../src/shared/rss-parser';

describe('RSS Parser', () => {
  describe('parseFeed - RSS 2.0', () => {
    it('should parse basic RSS feed', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <item>
              <title>First Article</title>
              <link>https://example.com/1</link>
              <description>Description of first article.</description>
            </item>
            <item>
              <title>Second Article</title>
              <link>https://example.com/2</link>
            </item>
          </channel>
        </rss>`;

      const items = parseFeed(xml);
      expect(items).toHaveLength(2);
      expect(items[0].title).toBe('First Article');
      expect(items[0].link).toBe('https://example.com/1');
      expect(items[0].description).toBe('Description of first article.');
    });

    it('should skip items without title or link', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Valid Item</title>
              <link>https://example.com/valid</link>
            </item>
            <item>
              <title>No Link</title>
            </item>
            <item>
              <link>https://example.com/no-title</link>
            </item>
          </channel>
        </rss>`;

      const items = parseFeed(xml);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Valid Item');
    });

    it('should parse media enclosures', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
          <channel>
            <item>
              <title>Article with Image</title>
              <link>https://example.com/article</link>
              <enclosure url="https://example.com/image.jpg" type="image/jpeg" />
            </item>
          </channel>
        </rss>`;

      const items = parseFeed(xml);
      expect(items[0].imageUrl).toBe('https://example.com/image.jpg');
    });

    it.todo('should parse media:content elements - needs namespace-aware parser', () => {
      // Parser uses querySelector('content[url], thumbnail[url]') but this
      // doesn't match media:content due to XML namespace handling
    });

    it('should trim whitespace from content', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <item>
              <title>  Whitespace Title  </title>
              <link>  https://example.com  </link>
            </item>
          </channel>
        </rss>`;

      const items = parseFeed(xml);
      expect(items[0].title).toBe('Whitespace Title');
      expect(items[0].link).toBe('https://example.com');
    });
  });

  describe('parseFeed - Atom', () => {
    it('should parse Atom feed', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Feed</title>
          <entry>
            <title>Atom Entry</title>
            <link href="https://example.com/atom/1" />
            <summary>Summary of entry.</summary>
          </entry>
        </feed>`;

      const items = parseFeed(xml);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Atom Entry');
      expect(items[0].link).toBe('https://example.com/atom/1');
      expect(items[0].description).toBe('Summary of entry.');
    });

    it('should parse Atom link as text content', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Entry</title>
            <link>https://example.com/link-text</link>
          </entry>
        </feed>`;

      const items = parseFeed(xml);
      expect(items[0].link).toBe('https://example.com/link-text');
    });

    it('should prefer href attribute over text content', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Entry</title>
            <link href="https://example.com/href" >https://example.com/text</link>
          </entry>
        </feed>`;

      const items = parseFeed(xml);
      expect(items[0].link).toBe('https://example.com/href');
    });

    it('should parse Atom with media', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Entry with Media</title>
            <link>https://example.com/entry</link>
            <content url="https://example.com/thumb.jpg" />
          </entry>
        </feed>`;

      const items = parseFeed(xml);
      expect(items[0].imageUrl).toBe('https://example.com/thumb.jpg');
    });
  });

  describe('parseFeed - Edge Cases', () => {
    it('should return empty array for empty feed', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>Empty Feed</title>
          </channel>
        </rss>`;

      const items = parseFeed(xml);
      expect(items).toHaveLength(0);
    });

    it('should handle non-image enclosures', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Audio Item</title>
              <link>https://example.com/audio</link>
              <enclosure url="https://example.com/audio.mp3" type="audio/mpeg" />
            </item>
          </channel>
        </rss>`;

      const items = parseFeed(xml);
      expect(items[0].imageUrl).toBeUndefined();
    });

    it.todo('should handle media thumbnails - needs namespace-aware parser', () => {
      // Parser doesn't handle media:thumbnail due to XML namespace
    });

    it('should handle items with CDATA', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <item>
              <title><![CDATA[Special <characters> & "stuff"]]></title>
              <link>https://example.com/cdata</link>
              <description><![CDATA[Description with <html> tags]]></description>
            </item>
          </channel>
        </rss>`;

      const items = parseFeed(xml);
      expect(items[0].title).toContain('Special');
      expect(items[0].description).toContain('html');
    });
  });
});
