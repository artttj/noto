// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildTags(url: string | undefined): string[] {
  if (!url) return [];
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const main = hostname.split('.').slice(0, -1).join(' ').trim();
    return main ? [main.toLowerCase().slice(0, 32)] : [];
  } catch {
    return [];
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
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
