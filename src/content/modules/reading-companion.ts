// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../../shared/messages';
import { escapeHtml } from '../../shared/utils';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

function showToast(message: string): void {
  const existing = document.getElementById('sonto-toast');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'sonto-toast';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      color: #fff;
      background: #1a1a1a;
      border: 1px solid #333;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      max-width: 320px;
      word-break: break-word;
      animation: slide-in 0.18s ease-out;
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  shadow.appendChild(style);
  shadow.appendChild(toast);
  document.body.appendChild(host);

  setTimeout(() => host.remove(), 2500);
}

async function initReadingCompanion(): Promise<void> {
  try {
    if (!chrome.runtime?.sendMessage) return;
    const domain = window.location.hostname.replace(/^www\./, '');
    if (!domain) return;

    const response = await chrome.runtime.sendMessage({
      type: MSG.GET_RELATED_CLIPS,
      domain
    });

    if (response?.ok && response.clips?.length > 0) {
      createReadingCompanionBanner(response.clips as Array<{ id: string; text: string; timestamp: number; url?: string }>);
    }
  } catch {
  }
}

function createReadingCompanionBanner(clips: Array<{ id: string; text: string; timestamp: number; url?: string }>): void {
  const existing = document.getElementById('sonto-reading-companion');
  if (existing) return;

  const host = document.createElement('div');
  host.id = 'sonto-reading-companion';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483646;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: fade-in 0.25s ease-out;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .companion-card {
      background: rgba(38, 38, 38, 0.88);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      max-width: 256px;
      overflow: hidden;
      transition: border-color 0.25s, box-shadow 0.25s;
    }
    .companion-card:hover {
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .companion-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px;
      cursor: pointer;
      user-select: none;
      gap: 8px;
    }
    .companion-title {
      font-size: 10px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .companion-chevron {
      width: 14px;
      height: 14px;
      color: rgba(255, 255, 255, 0.35);
      transition: transform 0.25s ease-out;
      flex-shrink: 0;
    }
    .companion-card.expanded .companion-chevron {
      transform: rotate(180deg);
      color: rgba(255, 255, 255, 0.5);
    }
    .companion-badge {
      font-size: 9px;
      font-weight: 600;
      color: #e8b931;
      padding: 2px 5px;
      background: rgba(232, 185, 49, 0.12);
      border-radius: 4px;
      margin-left: auto;
      margin-right: 4px;
    }
    .companion-list {
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height 0.28s ease-out, opacity 0.2s ease-out;
    }
    .companion-card.expanded .companion-list {
      max-height: 180px;
      opacity: 1;
      overflow-y: auto;
    }
    .companion-list::-webkit-scrollbar {
      width: 4px;
    }
    .companion-list::-webkit-scrollbar-track {
      background: transparent;
    }
    .companion-list::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
    }
    .companion-item {
      display: block;
      width: 100%;
      padding: 8px;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.75);
      font-size: 11px;
      line-height: 1.45;
      transition: background 0.15s;
    }
    .companion-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.95);
    }
    .companion-item .preview {
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }
    .companion-item .meta {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.35);
    }
  `;

  const headerInner = document.createElement('div');
  headerInner.className = 'companion-header';
  headerInner.innerHTML = `
    <span class="companion-title">Related</span>
    <span class="companion-badge">${clips.length}</span>
    <svg class="companion-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 6l4 4 4-4"/>
    </svg>
  `;

  const list = document.createElement('div');
  list.className = 'companion-list';
  list.innerHTML = clips.slice(0, 3).map(clip => `
    <button class="companion-item" data-text="${escapeHtml(clip.text.slice(0, 200))}">
      <div class="preview">${escapeHtml(clip.text.slice(0, 85))}${clip.text.length > 85 ? '...' : ''}</div>
      <div class="meta">${formatTime(clip.timestamp)}</div>
    </button>
  `).join('');

  const card = document.createElement('div');
  card.className = 'companion-card';
  card.appendChild(headerInner);
  card.appendChild(list);

  shadow.appendChild(style);
  shadow.appendChild(card);
  document.body.appendChild(host);

  const close = () => host.remove();

  let isExpanded = false;

  headerInner.addEventListener('click', (e) => {
    if (isExpanded) {
      close();
    } else {
      isExpanded = true;
      card.classList.add('expanded');
    }
  });

  card.addEventListener('click', (e) => e.stopPropagation());

  const handleClickOutside = (e: Event) => {
    if (!host.contains(e.target as Node)) {
      close();
    }
  };
  document.addEventListener('click', handleClickOutside, { once: true });

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', handleEscape, { once: true });

  list.querySelectorAll('.companion-item').forEach(item => {
    item.addEventListener('click', async () => {
      const text = (item as HTMLElement).dataset.text || '';
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    });
  });
}

export function initReadingCompanionIfEnabled(): void {
  chrome.storage.local.get('sonto_reading_companion_enabled').then((result) => {
    if (result.sonto_reading_companion_enabled !== false) {
      void initReadingCompanion();
    }
  });
}
