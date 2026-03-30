// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../shared/messages';
import type { GetRelatedClipsMessage } from '../shared/messages';
import { getClipsByDomain } from '../shared/embeddings/vector-store';

export class RelatedClipsHandler {
  async getByDomain(domain: string): Promise<unknown[]> {
    const clips = await getClipsByDomain(domain);
    return clips.slice(0, 5);
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
