// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../../shared/messages';
import { getReadLater } from '../../shared/storage';
import type { ReadLaterItem } from '../../shared/types';
import { escapeHtml } from '../../shared/utils';

interface ReadLaterBarDeps {
  bar: HTMLElement;
  countEl: HTMLElement;
  listEl: HTMLElement;
  viewBtn: HTMLElement;
}

export class ReadLaterBarController {
  private deps: ReadLaterBarDeps;

  constructor(deps: ReadLaterBarDeps) {
    this.deps = deps;
  }

  async init(): Promise<void> {
    await this.refresh();

    this.deps.viewBtn.addEventListener('click', async () => {
      const items = await getReadLater();
      if (this.deps.listEl.classList.contains('hidden')) {
        this.renderList(items, this.deps.listEl);
        this.deps.listEl.classList.remove('hidden');
        (this.deps.viewBtn as HTMLElement).textContent = 'Hide';
      } else {
        this.deps.listEl.classList.add('hidden');
        (this.deps.viewBtn as HTMLElement).textContent = 'View queue';
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.sonto_read_later) {
        void this.refresh();
      }
    });
  }

  private async refresh(): Promise<void> {
    const items = await getReadLater();
    if (items.length > 0) {
      this.deps.countEl.textContent = `${items.length} item${items.length > 1 ? 's' : ''} in read later`;
      this.deps.bar.classList.remove('hidden');
    } else {
      this.deps.bar.classList.add('hidden');
      this.deps.listEl.classList.add('hidden');
    }
  }

  private renderList(items: ReadLaterItem[], container: HTMLElement): void {
    container.innerHTML = '';
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'read-later-item';
      const domain = (() => {
        try { return new URL(item.url).hostname; } catch { return item.url.slice(0, 40); }
      })();
      row.innerHTML = `
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="rl-link">${escapeHtml(item.title || domain)}</a>
        <button class="rl-remove" data-url="${escapeHtml(item.url)}" type="button" aria-label="Remove from read later">✕</button>
      `;
      row.querySelector('.rl-remove')!.addEventListener('click', async (e) => {
        const url = (e.currentTarget as HTMLButtonElement).dataset.url!;
        await chrome.runtime.sendMessage({ type: MSG.REMOVE_READ_LATER, url });
        const updated = await getReadLater();
        this.renderList(updated, container);
        if (updated.length === 0) {
          container.classList.add('hidden');
          this.deps.bar.classList.add('hidden');
        }
      });
      container.appendChild(row);
    }
  }
}
