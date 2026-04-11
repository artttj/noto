// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&euro;': '€',
  '&pound;': '£',
  '&yen;': '¥',
  '&cent;': '¢',
  '&deg;': '°',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&frac12;': '½',
  '&frac14;': '¼',
  '&frac34;': '¾',
  '&rsquo;': '\u2019',
  '&lsquo;': '\u2018',
  '&rdquo;': '\u201d',
  '&ldquo;': '\u201c',
  '&sbquo;': '\u201a',
  '&bdquo;': '\u201e',
};

const HTML_ENTITY_PATTERN = new RegExp(
  `&(?:${Object.keys(HTML_ENTITY_MAP).join('|').replace(/&/g, '')}|#(\\d+)|#x([0-9a-fA-F]+));`,
  'g',
);

function replaceHtmlEntity(match: string): string {
  if (match in HTML_ENTITY_MAP) {
    return HTML_ENTITY_MAP[match];
  }
  const decimalMatch = match.match(/^&#(\d+);$/);
  if (decimalMatch) {
    return String.fromCharCode(Number(decimalMatch[1]));
  }
  const hexMatch = match.match(/^&#x([0-9a-fA-F]+);$/);
  if (hexMatch) {
    return String.fromCharCode(Number.parseInt(hexMatch[1], 16));
  }
  return match;
}

export function decodeHtmlEntities(str: string): string {
  return str.replace(HTML_ENTITY_PATTERN, replaceHtmlEntity);
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttribute(str: string): string {
  return escapeHtml(str).replace(/'/g, '&#x27;');
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return 'about:blank';
    }
    return url;
  } catch {
    return 'about:blank';
  }
}

export function buildTags(url: string | undefined): string[] {
  if (!url) return [];
  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return [];
    }
    const hostname = parsed.hostname.replace(/^www\./, '');
    const main = hostname.split('.').slice(0, -1).join(' ').trim();
    return main ? [main.toLowerCase().slice(0, 32)] : [];
  } catch {
    return [];
  }
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return '';
    }
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function formatDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ts).toLocaleDateString();
}
