// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect } from 'vitest';
import { escapeHtml, buildTags, extractDomain, formatDate } from '../src/shared/utils';

describe('Utility Functions', () => {
  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than signs', () => {
      expect(escapeHtml('5 < 10')).toBe('5 &lt; 10');
    });

    it('should escape greater than signs', () => {
      expect(escapeHtml('10 > 5')).toBe('10 &gt; 5');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('should escape multiple special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      );
    });

    it('should return plain text unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('buildTags', () => {
    it('should extract domain name from URL', () => {
      expect(buildTags('https://github.com/user/repo')).toEqual(['github']);
    });

    it('should handle www prefix', () => {
      expect(buildTags('https://www.example.com/page')).toEqual(['example']);
    });

    it('should return empty array for invalid URL', () => {
      expect(buildTags('not-a-url')).toEqual([]);
    });

    it('should return empty array for undefined URL', () => {
      expect(buildTags(undefined)).toEqual([]);
    });

    it('should handle subdomains', () => {
      // buildTags takes all parts except TLD and joins with space
      expect(buildTags('https://api.github.com/endpoint')).toEqual(['api github']);
    });

    it('should truncate long domain names', () => {
      const longDomain = 'a'.repeat(50) + '.com';
      expect(buildTags(`https://${longDomain}`)[0].length).toBe(32);
    });

    it('should convert to lowercase', () => {
      expect(buildTags('https://GITHUB.com')).toEqual(['github']);
    });

    it('should handle complex TLDs', () => {
      // buildTags takes all parts except the last one (TLD)
      // For site.co.uk: ['site', 'co', 'uk'] -> slice(0, -1) = ['site', 'co'] -> join = 'site co'
      expect(buildTags('https://site.co.uk')).toEqual(['site co']);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://github.com/user/repo')).toBe('github.com');
    });

    it('should remove www prefix', () => {
      expect(extractDomain('https://www.example.com')).toBe('example.com');
    });

    it('should return empty string for invalid URL', () => {
      expect(extractDomain('invalid')).toBe('');
    });

    it('should handle URLs with ports', () => {
      expect(extractDomain('https://localhost:3000')).toBe('localhost');
    });

    it('should handle URLs with paths', () => {
      expect(extractDomain('https://example.com/path/to/page')).toBe('example.com');
    });
  });

  describe('formatDate', () => {
    it('should return "just now" for recent timestamps', () => {
      const now = Date.now();
      expect(formatDate(now)).toBe('just now');
    });

    it('should return minutes ago for recent past', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      expect(formatDate(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should return hours ago for recent hours', () => {
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
      expect(formatDate(threeHoursAgo)).toBe('3h ago');
    });

    it('should return days ago for recent days', () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      expect(formatDate(twoDaysAgo)).toBe('2d ago');
    });

    it('should return date string for older timestamps', () => {
      const oldDate = new Date('2023-01-15').getTime();
      expect(formatDate(oldDate)).toContain('2023');
    });

    it('should handle edge of minute boundary', () => {
      const almostAMinute = Date.now() - 59 * 1000;
      expect(formatDate(almostAMinute)).toBe('just now');
    });

    it('should handle exactly one minute', () => {
      const oneMinute = Date.now() - 60 * 1000;
      expect(formatDate(oneMinute)).toBe('1m ago');
    });
  });
});
