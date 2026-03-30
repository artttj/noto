// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../shared/messages';
import type { AddReadLaterMessage, RemoveReadLaterMessage, GetReadLaterMessage } from '../shared/messages';
import { getReadLater, saveReadLater } from '../shared/storage';
import type { ReadLaterItem } from '../shared/types';

export class ReadLaterHandler {
  private items: ReadLaterItem[] = [];

  async add(url: string, title?: string): Promise<void> {
    this.items = await getReadLater();
    if (!this.items.some((i) => i.url === url)) {
      this.items.push({ url, title, addedAt: Date.now() });
      await saveReadLater(this.items);
    }
  }

  async remove(url: string): Promise<void> {
    this.items = await getReadLater();
    await saveReadLater(this.items.filter((i) => i.url !== url));
  }

  async getAll(): Promise<ReadLaterItem[]> {
    return getReadLater();
  }

  async checkUrl(url: string): Promise<ReadLaterItem | null> {
    const items = await getReadLater();
    const idx = items.findIndex((i) => i.url === url);
    if (idx === -1) return null;

    const item = items[idx];
    items.splice(idx, 1);
    await saveReadLater(items);
    return item;
  }
}

export const readLaterHandler = new ReadLaterHandler();

export function registerReadLaterHandlers(register: (type: string, handler: import('./message-router').MessageHandler) => void): void {
  register(MSG.ADD_READ_LATER, async (msg) => {
    const { url, title } = msg as AddReadLaterMessage;
    await readLaterHandler.add(url, title);
    return {};
  });

  register(MSG.REMOVE_READ_LATER, async (msg) => {
    await readLaterHandler.remove((msg as RemoveReadLaterMessage).url);
    return {};
  });

  register(MSG.GET_READ_LATER, async () => {
    const items = await readLaterHandler.getAll();
    return { items };
  });
}
