// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { createIcons, icons } from 'lucide';
import { getAllPrompts, deletePrompt, updatePrompt, type PromptItem, type PromptColor } from '../shared/storage';
import { escapeHtml } from '../shared/utils';
import { MSG } from '../shared/messages';

const COPY_FEEDBACK_MS = 1500;

function showToast(message: string, isError = false): void {
  const existing = document.getElementById('sonto-sidebar-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'sonto-sidebar-toast';
  toast.className = 'sidebar-toast' + (isError ? ' sidebar-toast-error' : '');
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}

const PROMPT_COLORS: Record<PromptColor, { bg: string; border: string; hex: string }> = {
  red:    { bg: 'rgba(255,90,90,0.18)', border: 'rgba(255,90,90,0.9)', hex: '#ff5a5a' },
  orange: { bg: 'rgba(255,160,60,0.18)', border: 'rgba(255,160,60,0.9)', hex: '#ffa03c' },
  yellow: { bg: 'rgba(200,160,20,0.25)', border: 'rgba(200,160,20,0.9)', hex: '#c8a014' },
  green:  { bg: 'rgba(60,200,100,0.18)', border: 'rgba(60,200,100,0.9)', hex: '#3cc864' },
  blue:   { bg: 'rgba(60,140,255,0.18)', border: 'rgba(60,140,255,0.9)', hex: '#3c8cff' },
  purple: { bg: 'rgba(140,90,220,0.18)', border: 'rgba(140,90,220,0.9)', hex: '#8c5adc' },
  gray:   { bg: 'rgba(140,140,140,0.18)', border: 'rgba(140,140,140,0.9)', hex: '#8c8c8c' },
};

const COLOR_ORDER: PromptColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'];

let editModal: HTMLElement | null = null;

function initEditModal(): void {
  if (editModal) return;

  editModal = document.createElement('div');
  editModal.id = 'prompt-edit-modal';
  editModal.className = 'prompt-modal hidden';
  editModal.innerHTML = `
    <div class="prompt-modal-content">
      <h3 class="prompt-modal-title">Edit Prompt</h3>
      <textarea id="prompt-edit-input" class="prompt-textarea" rows="6"></textarea>
      <input type="text" id="prompt-edit-label" class="prompt-label-input" placeholder="Label (optional)" maxlength="30" />
      <div class="prompt-color-picker">
        ${COLOR_ORDER.map(c => `<button type="button" class="color-dot color-dot-${c}" data-color="${c}" title="${c}"></button>`).join('')}
      </div>
      <div class="prompt-modal-actions">
        <button id="prompt-edit-cancel" class="prompt-btn prompt-btn-secondary" type="button">Cancel</button>
        <button id="prompt-edit-save" class="prompt-btn prompt-btn-primary" type="button">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(editModal);
}

function showEditModal(prompt: PromptItem, onSave: (updates: { text: string; label?: string; color?: PromptColor }) => void): void {
  initEditModal();
  if (!editModal) return;

  const input = editModal.querySelector('#prompt-edit-input') as HTMLTextAreaElement;
  const labelInput = editModal.querySelector('#prompt-edit-label') as HTMLInputElement;
  const colorDots = editModal.querySelectorAll('.color-dot');

  input.value = prompt.text;
  labelInput.value = prompt.label ?? '';

  let selectedColor: PromptColor | undefined = prompt.color;
  colorDots.forEach(dot => {
    dot.classList.toggle('selected', (dot as HTMLElement).dataset.color === selectedColor);
    dot.addEventListener('click', () => {
      const color = (dot as HTMLElement).dataset.color as PromptColor;
      selectedColor = selectedColor === color ? undefined : color;
      colorDots.forEach(d => d.classList.toggle('selected', (d as HTMLElement).dataset.color === selectedColor));
    });
  });

  const cancelBtn = editModal.querySelector('#prompt-edit-cancel') as HTMLButtonElement;
  const saveBtn = editModal.querySelector('#prompt-edit-save') as HTMLButtonElement;

  const close = () => {
    editModal?.classList.add('hidden');
  };

  cancelBtn.onclick = close;
  editModal.onclick = (e) => { if (e.target === editModal) close(); };

  saveBtn.onclick = () => {
    onSave({
      text: input.value.trim(),
      label: labelInput.value.trim() || undefined,
      color: selectedColor,
    });
    close();
  };

  editModal.classList.remove('hidden');
  input.focus();
}

export class PromptsManager {
  private prompts: PromptItem[] = [];
  private listEl: HTMLElement;
  private filtersEl: HTMLElement;
  private searchEl: HTMLInputElement;
  private isLoading = false;
  private activeColor: PromptColor | null = null;

  constructor(listEl: HTMLElement, searchEl: HTMLInputElement, filtersEl: HTMLElement) {
    this.listEl = listEl;
    this.searchEl = searchEl;
    this.filtersEl = filtersEl;
  }

  async load(): Promise<void> {
    this.setLoading(true);
    try {
      this.prompts = await getAllPrompts();
    } catch (err) {
      console.error('[Sonto] Failed to load prompts:', err);
    } finally {
      this.setLoading(false);
      this.renderFilters();
      this.render();
    }
  }

  private renderFilters(): void {
    const colorCounts = new Map<PromptColor, { count: number; label?: string }>();

    for (const p of this.prompts) {
      if (p.color) {
        const existing = colorCounts.get(p.color);
        if (existing) {
          existing.count++;
        } else {
          colorCounts.set(p.color, { count: 1, label: p.label });
        }
      }
    }

    if (colorCounts.size === 0) {
      this.filtersEl.classList.add('hidden');
      return;
    }

    this.filtersEl.classList.remove('hidden');
    this.filtersEl.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'filter-chip' + (this.activeColor === null ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => {
      this.activeColor = null;
      this.renderFilters();
      this.render();
    });
    this.filtersEl.appendChild(allBtn);

    for (const color of COLOR_ORDER) {
      const data = colorCounts.get(color);
      if (!data) continue;

      const styles = PROMPT_COLORS[color];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip filter-chip-color' + (this.activeColor === color ? ' active' : '');
      btn.style.setProperty('--chip-bg', styles.bg);
      btn.style.setProperty('--chip-border', styles.border);
      btn.innerHTML = `
        <span class="filter-dot" style="background: ${styles.hex}"></span>
        <span class="filter-label">${data.label ? escapeHtml(data.label) : color.charAt(0).toUpperCase() + color.slice(1)}</span>
        <span class="filter-count">${data.count}</span>
      `;
      btn.addEventListener('click', () => {
        this.activeColor = color;
        this.renderFilters();
        this.render();
      });
      this.filtersEl.appendChild(btn);
    }

    createIcons({ icons, attrs: { strokeWidth: 1.5 } });
  }

  async search(query: string): Promise<void> {
    if (!query.trim()) {
      await this.load();
      return;
    }
    this.setLoading(true);
    try {
      const all = await getAllPrompts();
      const q = query.toLowerCase();
      this.prompts = all.filter(p => p.text.toLowerCase().includes(q) || (p.label?.toLowerCase().includes(q) ?? false));
    } catch (err) {
      console.error('[Sonto] Search failed:', err);
    } finally {
      this.setLoading(false);
      this.renderFilters();
      this.render();
    }
  }

  render(): void {
    this.listEl.innerHTML = '';

    const filtered = this.activeColor
      ? this.prompts.filter(p => p.color === this.activeColor)
      : this.prompts;

    if (this.isLoading) {
      this.renderLoading();
      return;
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'clips-empty';
      const hasSearch = this.searchEl.value.trim().length > 0;
      const hasFilter = this.activeColor !== null;
      empty.innerHTML = `
        <div class="empty-icon"><i data-lucide="sparkles"></i></div>
        <p>${hasFilter ? 'No prompts with this color.' : hasSearch ? 'No prompts found.' : 'No prompts saved yet.'}</p>
        <p class="empty-hint">${hasFilter ? 'Try a different filter.' : hasSearch ? 'Try a different search term.' : 'Right-click selected text on any page to save as a prompt.'}</p>
      `;
      this.listEl.appendChild(empty);
      createIcons({ icons, attrs: { strokeWidth: 1.5 } });
      return;
    }

    const pinned = filtered.filter(p => p.pinned);
    const regular = filtered.filter(p => !p.pinned);

    if (pinned.length > 0) {
      this.addSeparator('Pinned', 'pinned-separator');
      for (const prompt of pinned) {
        this.listEl.appendChild(this.buildCard(prompt));
      }
    }

    for (const prompt of regular) {
      this.listEl.appendChild(this.buildCard(prompt));
    }

    createIcons({ icons, attrs: { strokeWidth: 1.5 } });
  }

  private addSeparator(label: string, extraClass?: string): void {
    const separator = document.createElement('div');
    separator.className = 'day-separator' + (extraClass ? ' ' + extraClass : '');
    separator.textContent = label;
    this.listEl.appendChild(separator);
  }

  private buildCard(prompt: PromptItem): HTMLElement {
    const card = document.createElement('div');
    card.className = 'clip-card clip-type-prompt' + (prompt.pinned ? ' clip-pinned' : '');
    card.dataset.id = prompt.id;

    const preview = escapeHtml(prompt.text.slice(0, 280));
    const needsExpand = prompt.text.length > 280;
    const colorStyles = prompt.color ? PROMPT_COLORS[prompt.color] : null;
    const colorDot = colorStyles
      ? `<span class="prompt-color-tag" style="background: ${colorStyles.hex};"></span>`
      : '';

    const pinLabel = prompt.pinned ? 'Unpin' : 'Pin';

    card.innerHTML = `
      <div class="clip-header">
        <div class="clip-header-left">
          ${colorDot}
          <span class="clip-type-badge clip-badge-prompt">
            <span class="clip-type-icon">✦</span>
            ${prompt.label ? escapeHtml(prompt.label) : 'Prompt'}
          </span>
        </div>
        <span class="clip-time">${this.formatDate(prompt.createdAt)}</span>
      </div>
      <div class="clip-body${needsExpand ? ' clip-body-expandable' : ''}" ${needsExpand ? 'title="Click to view full text"' : ''}>
        <p class="clip-text-preview">${preview}${prompt.text.length > 280 ? '…' : ''}</p>
      </div>
      <div class="clip-card-actions">
        <button class="clip-btn clip-btn-pin${prompt.pinned ? ' pinned' : ''}" title="${pinLabel}" aria-label="${pinLabel} this prompt"><i data-lucide="star"></i></button>
        <button class="clip-btn clip-btn-insert" title="Insert to input" aria-label="Insert text into active input field"><i data-lucide="text-cursor-input"></i></button>
        <button class="clip-btn clip-btn-copy" title="Copy" aria-label="Copy this prompt"><i data-lucide="clipboard"></i></button>
        ${needsExpand ? `<button class="clip-btn clip-btn-expand" title="View full" aria-label="View full text"><i data-lucide="maximize-2"></i></button>` : ''}
        <button class="clip-btn clip-btn-edit" title="Edit" aria-label="Edit this prompt"><i data-lucide="pencil"></i></button>
        <button class="clip-btn clip-btn-delete" title="Delete" aria-label="Delete this prompt"><i data-lucide="trash-2"></i></button>
      </div>
    `;

    const copyPrompt = () => {
      void navigator.clipboard.writeText(prompt.text).then(() => {
        const btn = card.querySelector<HTMLButtonElement>('.clip-btn-copy');
        btn?.classList.add('copied');
        setTimeout(() => btn?.classList.remove('copied'), COPY_FEEDBACK_MS);
      }).catch(() => {});
    };

    card.querySelector<HTMLButtonElement>('.clip-btn-copy')?.addEventListener('click', copyPrompt);
    card.addEventListener('dblclick', copyPrompt);

    card.querySelector<HTMLButtonElement>('.clip-btn-insert')?.addEventListener('click', () => {
      void this.insertText(prompt.text);
    });

    card.querySelector<HTMLButtonElement>('.clip-btn-pin')?.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.togglePin(prompt.id, card);
    });

    card.querySelector<HTMLButtonElement>('.clip-btn-edit')?.addEventListener('click', () => {
      showEditModal(prompt, async (updates) => {
        if (updates.text) {
          await updatePrompt(prompt.id, updates);
          await this.load();
        }
      });
    });

    card.querySelector<HTMLButtonElement>('.clip-btn-delete')?.addEventListener('click', () => {
      void this.deletePrompt(prompt.id, card);
    });

    return card;
  }

  private async deletePrompt(id: string, card: HTMLElement): Promise<void> {
    card.classList.add('clip-removing');
    await deletePrompt(id);
    this.prompts = this.prompts.filter(p => p.id !== id);

    setTimeout(() => {
      card.remove();
      this.renderFilters();
      if (this.prompts.length === 0) this.render();
    }, 200);
  }

  private async togglePin(id: string, card: HTMLElement): Promise<void> {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return;

    const newPinned = !prompt.pinned;
    await updatePrompt(id, { pinned: newPinned });

    prompt.pinned = newPinned;
    card.classList.toggle('clip-pinned', newPinned);

    const pinBtn = card.querySelector<HTMLButtonElement>('.clip-btn-pin');
    if (pinBtn) {
      pinBtn.classList.toggle('pinned', newPinned);
      pinBtn.title = newPinned ? 'Unpin' : 'Pin';
      pinBtn.setAttribute('aria-label', `${newPinned ? 'Unpin' : 'Pin'} this prompt`);
    }

    this.render();
  }

  private async insertText(text: string): Promise<void> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    let targetTab = tabs[0];

    if (!targetTab || targetTab.url?.startsWith('chrome://') || targetTab.url?.startsWith('chrome-extension://')) {
      const windows = await chrome.windows.getAll({ populate: true });
      for (const win of windows) {
        if (win.type !== 'normal' || !win.tabs) continue;

        for (const tab of win.tabs) {
          if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('about:')) {
            targetTab = tab;
            break;
          }
        }
        if (targetTab) break;
      }
    }

    if (!targetTab?.id) {
      showToast('No active tab found.', true);
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(targetTab.id, { type: MSG.INSERT_TEXT, text });
      if (response?.error) {
        showToast(response.error, true);
      }
    } catch {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          files: ['content/content.js'],
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = await chrome.tabs.sendMessage(targetTab.id, { type: MSG.INSERT_TEXT, text });
        if (response?.error) {
          showToast(response.error, true);
        }
      } catch {
        showToast('Could not insert text on this page.', true);
      }
    }
  }

  private formatDate(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  private renderLoading(): void {
    const loading = document.createElement('div');
    loading.className = 'clips-loading';
    loading.innerHTML = '<div class="spinner"></div>';
    this.listEl.appendChild(loading);
  }
}