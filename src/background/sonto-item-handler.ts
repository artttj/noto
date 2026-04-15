// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MAX_CAPTURE_CHARS } from '../shared/constants';
import { ContentTypeDetector } from '../shared/content-detector';
import { MSG } from '../shared/messages';
import type {
  SaveSontoItemMessage,
  GetSontoItemsMessage,
  SearchSontoItemsMessage,
  UpdateSontoItemMessage,
  DeleteSontoItemMessage,
  AddTagMessage,
  RemoveTagMessage,
  GetAllTagsMessage,
} from '../shared/messages';
import {
  saveSontoItem,
  getAllSontoItems,
  searchSontoItems,
  updateSontoItem,
  deleteSontoItem,
  addTagToItem,
  removeTagFromItem,
  getAllTags,
} from '../shared/storage/items';
import type { SontoItem, SontoItemType, SontoContentType, SontoSource } from '../shared/types';

export class SontoItemHandler {
  async create(
    content: string,
    type: SontoItemType,
    source: SontoSource,
    options: {
      contentType?: SontoContentType;
      origin?: string;
      url?: string;
      title?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<SontoItem> {
    if (typeof content !== 'string') throw new Error('Invalid content: expected string.');
    const now = Date.now();
    const item: SontoItem = {
      id: `${now}-${crypto.randomUUID()}`,
      type,
      content: content.slice(0, MAX_CAPTURE_CHARS),
      contentType: options.contentType ?? ContentTypeDetector.detectSontoContentType(content),
      source,
      origin: options.origin ?? source,
      url: options.url,
      title: options.title,
      tags: options.tags ?? [],
      createdAt: now,
      metadata: options.metadata,
    };

    await saveSontoItem(item);
    return item;
  }

  async getAll(filter?: import('../shared/types').SontoItemFilter): Promise<SontoItem[]> {
    return getAllSontoItems(filter);
  }

  async search(query: string, filter?: import('../shared/types').SontoItemFilter): Promise<SontoItem[]> {
    return searchSontoItems(query, filter);
  }

  async update(id: string, updates: Partial<SontoItem>): Promise<void> {
    await updateSontoItem(id, updates);
  }

  async delete(id: string): Promise<void> {
    await deleteSontoItem(id);
  }

  async addTag(id: string, tag: string): Promise<void> {
    await addTagToItem(id, tag);
  }

  async removeTag(id: string, tag: string): Promise<void> {
    await removeTagFromItem(id, tag);
  }

  async getAllTags(): Promise<string[]> {
    const tags = await getAllTags();
    return Array.from(tags).sort();
  }

}

export const sontoItemHandler = new SontoItemHandler();

export function registerSontoItemHandlers(
  register: (type: string, handler: import('./message-router').MessageHandler) => void,
): void {
  register(MSG.SAVE_SONTO_ITEM, async (msg) => {
    const { item } = msg as SaveSontoItemMessage;
    const created = await sontoItemHandler.create(
      item.content,
      item.type,
      item.source,
      {
        contentType: item.contentType,
        origin: item.origin,
        url: item.url,
        title: item.title,
        tags: item.tags,
        metadata: item.metadata,
      },
    );
    return { ok: true, item: created };
  });

  register(MSG.GET_SONTO_ITEMS, async (msg) => {
    const { filter } = msg as GetSontoItemsMessage;
    const items = await sontoItemHandler.getAll(filter);
    return { ok: true, items };
  });

  register(MSG.SEARCH_SONTO_ITEMS, async (msg) => {
    const { query, filter } = msg as SearchSontoItemsMessage;
    const items = await sontoItemHandler.search(query, filter);
    return { ok: true, items };
  });

  register(MSG.UPDATE_SONTO_ITEM, async (msg) => {
    const { id, updates } = msg as UpdateSontoItemMessage;
    await sontoItemHandler.update(id, updates);
    return { ok: true };
  });

  register(MSG.DELETE_SONTO_ITEM, async (msg) => {
    const { id } = msg as DeleteSontoItemMessage;
    await sontoItemHandler.delete(id);
    return { ok: true };
  });

  register(MSG.ADD_TAG, async (msg) => {
    const { id, tag } = msg as AddTagMessage;
    await sontoItemHandler.addTag(id, tag);
    return { ok: true };
  });

  register(MSG.REMOVE_TAG, async (msg) => {
    const { id, tag } = msg as RemoveTagMessage;
    await sontoItemHandler.removeTag(id, tag);
    return { ok: true };
  });

  register(MSG.GET_ALL_TAGS, async () => {
    const tags = await sontoItemHandler.getAllTags();
    return { ok: true, tags };
  });
}
