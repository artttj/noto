// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../shared/messages';
import type { GetRelatedClipsMessage } from '../shared/messages';
import { sontoItemHandler } from './sonto-item-handler';
import type { SontoItem } from '../shared/types';

interface RelatedClip {
  id: string;
  text: string;
  timestamp: number;
  url?: string;
}

export class RelatedClipsHandler {
  async getByDomain(domain: string): Promise<RelatedClip[]> {
    const allItems = await sontoItemHandler.getAll({ types: ['clip'] });
    const clips = allItems
      .filter(item => {
        if (!item.url) return false;
        try {
          const url = new URL(item.url);
          return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    return clips.map(item => ({
      id: item.id,
      text: item.content,
      timestamp: item.createdAt,
      url: item.url,
    }));
  }
}

export const relatedClipsHandler = new RelatedClipsHandler();

export function registerRelatedClipsHandlers(
  register: (type: string, handler: import('./message-router').MessageHandler) => void,
): void {
  register(MSG.GET_RELATED_CLIPS, async (msg) => {
    const clips = await relatedClipsHandler.getByDomain((msg as GetRelatedClipsMessage).domain);
    return { clips };
  });
}
