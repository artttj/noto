// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../shared/messages';
import type { UpdateDailyAlarmMessage } from '../shared/messages';
import { getDailyNotificationEnabled, getDailyNotificationTime } from '../shared/storage';
import { getAllClips } from '../shared/embeddings/vector-store';

const ALARM_NAME = 'daily-wrapup';

export class NotificationHandler {
  async setupDailyAlarm(): Promise<void> {
    const enabled = await getDailyNotificationEnabled();

    if (!enabled) {
      await chrome.alarms.clear(ALARM_NAME);
      return;
    }

    const timeStr = await getDailyNotificationTime();
    const [hours, minutes] = timeStr.split(':').map(Number);

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await chrome.alarms.create(ALARM_NAME, {
      when: scheduledTime.getTime(),
      periodInMinutes: 24 * 60,
    });
  }

  async showDailyWrapup(): Promise<void> {
    const allClips = await getAllClips();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayClips = allClips.filter((c) => c.timestamp >= today.getTime());

    const title = 'Your Daily Sonto';
    let body = '';

    if (todayClips.length === 0) {
      body = 'No items saved today. Open the sidebar to explore!';
    } else if (todayClips.length === 1) {
      body = '1 item saved today. Keep collecting!';
    } else {
      body = `${todayClips.length} items saved today. Open the sidebar to review!`;
    }

    await chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icons/icon48.png',
      title,
      message: body,
      priority: 1,
    });
  }
}

export const notificationHandler = new NotificationHandler();

export function registerNotificationHandlers(register: (type: string, handler: import('./message-router').MessageHandler) => void): void {
  register(MSG.UPDATE_DAILY_ALARM, async () => {
    await notificationHandler.setupDailyAlarm();
    return {};
  });
}

export function setupAlarmListener(handler: NotificationHandler): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
      void handler.showDailyWrapup();
    }
  });
}
