// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { getBadgeCounterEnabled } from '../shared/storage';

const BADGE_DATE_KEY = 'badge_date';
const BADGE_COUNT_KEY = 'badge_count';

export class BadgeHandler {
  async updateCaptureBadge(): Promise<void> {
    const enabled = await getBadgeCounterEnabled();
    if (!enabled) return;

    const todayKey = new Date().toDateString();
    const result = await chrome.storage.session.get([BADGE_DATE_KEY, BADGE_COUNT_KEY]);
    let count = result[BADGE_DATE_KEY] === todayKey ? ((result[BADGE_COUNT_KEY] as number) ?? 0) : 0;

    count++;
    await chrome.storage.session.set({ [BADGE_DATE_KEY]: todayKey, [BADGE_COUNT_KEY]: count });
    await chrome.action.setBadgeText({ text: String(count) });
    await chrome.action.setBadgeBackgroundColor({ color: '#e8b931' });
  }

  async restoreBadge(): Promise<void> {
    const enabled = await getBadgeCounterEnabled();
    if (!enabled) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    const todayKey = new Date().toDateString();
    const result = await chrome.storage.session.get([BADGE_DATE_KEY, BADGE_COUNT_KEY]);
    const count = result[BADGE_COUNT_KEY] as number | undefined;
    if (result[BADGE_DATE_KEY] === todayKey && count && count > 0) {
      await chrome.action.setBadgeText({ text: String(count) });
      await chrome.action.setBadgeBackgroundColor({ color: '#e8b931' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  }
}

export const badgeHandler = new BadgeHandler();
