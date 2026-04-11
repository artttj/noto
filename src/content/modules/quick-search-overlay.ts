// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../../shared/messages';
import { escapeHtml, extractDomain } from '../../shared/utils';

const SEARCH_TIMEOUT_MS = 300;

let quickSearchOverlay: HTMLElement | null = null;

export function toggleQuickSearch(): void {
  if (quickSearchOverlay) {
    quickSearchOverlay.remove();
    quickSearchOverlay = null;
    return;
  }
  createQuickSearchOverlay();
}

function createQuickSearchOverlay(): void {
  const host = document.createElement('div');
  host.id = 'sonto-quick-search';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .overlay-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
    .search-container {
      position: absolute;
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
      width: min(560px, 90vw);
      max-height: 60vh;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .search-input-wrap {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid #333;
    }
    .search-icon {
      width: 18px;
      height: 18px;
      color: #666;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-size: 16px;
      color: #eee;
      font-family: inherit;
    }
    .search-input::placeholder {
      color: #666;
    }
    .close-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      border-radius: 4px;
      font-size: 18px;
    }
    .close-btn:hover {
      background: #333;
      color: #999;
    }
    .results {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .result-item {
      display: block;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      border-radius: 8px;
      color: #ccc;
      font-size: 13px;
      line-height: 1.5;
    }
    .result-item:hover, .result-item.selected {
      background: #2a2a2a;
    }
    .result-item .preview {
      color: #eee;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .result-item .meta {
      font-size: 11px;
      color: #666;
    }
    .empty-state {
      padding: 32px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .loading {
      padding: 24px;
      text-align: center;
      color: #666;
    }
  `;

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="overlay-backdrop"></div>
    <div class="search-container">
      <div class="search-input-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="9" cy="9" r="5"/>
          <path d="M12.5 12.5L16 16"/>
        </svg>
        <input type="text" class="search-input" placeholder="Search clips and prompts..." autofocus />
        <button class="close-btn">×</button>
      </div>
      <div class="results">
        <div class="empty-state">Start typing to search your snippets</div>
      </div>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);
  document.body.appendChild(host);
  quickSearchOverlay = host;

  const backdrop = shadow.querySelector('.overlay-backdrop') as HTMLElement;
  const input = shadow.querySelector('.search-input') as HTMLInputElement;
  const closeBtn = shadow.querySelector('.close-btn') as HTMLButtonElement;
  const results = shadow.querySelector('.results') as HTMLElement;

  const close = () => {
    host.remove();
    quickSearchOverlay = null;
  };

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      close();
    }
  });

  let selectedIdx = -1;

  function updateSelected(): void {
    const items = results.querySelectorAll('.result-item');
    items.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx));
    if (selectedIdx >= 0 && selectedIdx < items.length) {
      items[selectedIdx].scrollIntoView({ block: 'nearest' });
    }
  }

  function activateSelected(): void {
    const items = results.querySelectorAll<HTMLElement>('.result-item');
    if (selectedIdx >= 0 && selectedIdx < items.length) {
      items[selectedIdx].click();
    }
  }

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  input.addEventListener('input', () => {
    const query = input.value.trim();
    selectedIdx = -1;

    if (searchTimeout) clearTimeout(searchTimeout);

    if (!query) {
      results.innerHTML = '<div class="empty-state">Start typing to search your snippets</div>';
      return;
    }

    results.innerHTML = '<div class="loading">Searching...</div>';

    searchTimeout = setTimeout(async () => {
      try {
        const [clipsResponse, promptsResponse] = await Promise.all([
          chrome.runtime?.sendMessage?.({ type: MSG.SEARCH_SONTO_ITEMS, query, filter: { types: ['clip'] } }) || { ok: false },
          chrome.runtime?.sendMessage?.({ type: MSG.SEARCH_SONTO_ITEMS, query, filter: { types: ['prompt'] } }) || { ok: false },
        ]);

        const clips = clipsResponse?.ok ? (clipsResponse.items as Array<{ id: string; content: string; createdAt: number; url?: string }>) : [];
        const prompts = promptsResponse?.ok ? (promptsResponse.items as Array<{ id: string; content: string; createdAt: number; url?: string }>) : [];

        const allItems = [
          ...clips.map((c) => ({ ...c, itemType: 'clip' as const })),
          ...prompts.map((p) => ({ ...p, itemType: 'prompt' as const })),
        ].slice(0, 10);

        if (allItems.length > 0) {
          results.innerHTML = allItems.map((item) => `
            <button class="result-item" data-id="${item.id}" data-text="${escapeHtml(item.content.slice(0, 200))}" data-type="${item.itemType}">
              <div class="preview">${escapeHtml(item.content.slice(0, 150))}${item.content.length > 150 ? '...' : ''}</div>
              <div class="meta">${item.itemType === 'prompt' ? 'Prompt' : 'Clip'} · ${formatTime(item.createdAt)}${item.url ? ' · ' + extractDomain(item.url) : ''}</div>
            </button>
          `).join('');

          selectedIdx = -1;

          results.querySelectorAll('.result-item').forEach((item) => {
            item.addEventListener('click', async () => {
              const text = (item as HTMLElement).dataset.text || '';
              await navigator.clipboard.writeText(text);
              showToast('Copied to clipboard!');
              close();
            });
          });
        } else {
          results.innerHTML = '<div class="empty-state">No snippets found</div>';
        }
      } catch {
        results.innerHTML = '<div class="empty-state">Search error</div>';
      }
    }, SEARCH_TIMEOUT_MS);
  });

  input.addEventListener('keydown', (e) => {
    const items = results.querySelectorAll('.result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
      updateSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, -1);
      updateSelected();
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      activateSelected();
    }
  });

  input.focus();
}

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
