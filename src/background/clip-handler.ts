// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../shared/messages';
import type { CaptureClipMessage, DeleteClipMessage, GetAllClipsMessage, SearchClipsMessage, UpdateClipMessage, ClearClipsMessage } from '../shared/messages';
import { getMaxHistorySize, getClipboardMonitoring } from '../shared/storage';
import { buildTags } from '../shared/utils';
import { ContentTypeDetector } from '../shared/content-detector';
import type { ClipContentType, ClipSource } from '../shared/types';
import { sontoItemHandler } from './sonto-item-handler';
import { badgeHandler } from './badge-handler';

const CHECK_RECENT_COUNT = 5;
const MAX_CAPTURE_CHARS = 10000;

export class ClipHandler {
  async capture(
    text: string,
    source: ClipSource,
    url?: string,
    title?: string,
    explicitContentType?: ClipContentType,
  ): Promise<void> {
    if (typeof text !== 'string') throw new Error('Invalid text: expected string.');
    const trimmed = text.slice(0, MAX_CAPTURE_CHARS);
    if (!trimmed.trim()) throw new Error('Nothing to save.');

    const monitoring = await getClipboardMonitoring();
    if (!monitoring && source === 'clipboard') throw new Error('Clipboard monitoring is off.');

    if (await this.isRepeatOfRecentClip(trimmed)) throw new Error('Already in clipboard history.');

    const contentType = explicitContentType ?? ContentTypeDetector.detectClipContentType(trimmed);
    const tags = buildTags(url);

    await sontoItemHandler.create(trimmed, 'clip', source, {
      contentType: contentType === 'prompt' ? 'text' : contentType,
      url,
      title,
      tags: tags.length ? tags : [],
    });

    await badgeHandler.updateCaptureBadge();
    await this.enforceHistoryLimit();
    void chrome.runtime.sendMessage({ type: MSG.CLIP_ADDED }).catch(() => {});
  }

  async delete(id: string): Promise<void> {
    await sontoItemHandler.delete(id);
  }

  async getAll(): Promise<unknown[]> {
    return sontoItemHandler.getAll({ types: ['clip'] });
  }

  async search(query: string): Promise<unknown[]> {
    return sontoItemHandler.search(query, { types: ['clip'] });
  }

  async update(item: unknown): Promise<void> {
    if (item && typeof item === 'object' && 'id' in item) {
      const id = String(item.id);
      const updates: Record<string, unknown> = {};
      if ('text' in item) updates.content = item.text;
      if ('timestamp' in item) updates.createdAt = item.timestamp;
      if ('url' in item) updates.url = item.url;
      if ('title' in item) updates.title = item.title;
      if ('tags' in item) updates.tags = item.tags;
      if ('contentType' in item) updates.contentType = item.contentType;
      await sontoItemHandler.update(id, updates);
    }
  }

  async clear(): Promise<void> {
    const items = await sontoItemHandler.getAll({ types: ['clip'] });
    await Promise.all(items.map(item => sontoItemHandler.delete(item.id)));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private normalizeText(text: string): string {
    if (typeof text !== 'string') return '';
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  private async isRepeatOfRecentClip(text: string): Promise<boolean> {
    const normalized = this.normalizeText(text);
    const unifiedItems = await sontoItemHandler.getAll({ types: ['clip'] });

    // Check recent unified items (newest first)
    const recent = unifiedItems.slice(0, CHECK_RECENT_COUNT);
    return recent.some(item => this.normalizeText(item.content) === normalized);
  }

  private async enforceHistoryLimit(): Promise<void> {
    const maxSize = await getMaxHistorySize();
    const all = await sontoItemHandler.getAll({ types: ['clip'] });
    if (all.length <= maxSize) return;

    const toRemove = all.slice(maxSize);
    await Promise.all(toRemove.map(item => sontoItemHandler.delete(item.id)));
  }
}

export const clipHandler = new ClipHandler();

export function registerClipHandlers(register: (type: string, handler: import('./message-router').MessageHandler) => void): void {
  register(MSG.CAPTURE_CLIP, async (msg) => {
    const { text, url, title, source, contentType } = msg as CaptureClipMessage;
    await clipHandler.capture(text, source, url, title, contentType);
    return { type: MSG.CAPTURE_SUCCESS };
  });

  register(MSG.DELETE_CLIP, async (msg) => {
    await clipHandler.delete((msg as DeleteClipMessage).id);
    return {};
  });

  register(MSG.GET_ALL_CLIPS, async () => {
    const clips = await clipHandler.getAll();
    return { clips };
  });

  register(MSG.SEARCH_CLIPS, async (msg) => {
    const clips = await clipHandler.search((msg as SearchClipsMessage).query);
    return { clips };
  });

  register(MSG.UPDATE_CLIP, async (msg) => {
    await clipHandler.update((msg as UpdateClipMessage).clip);
    return {};
  });

  register(MSG.CLEAR_CLIPS, async () => {
    await clipHandler.clear();
    return {};
  });
}
