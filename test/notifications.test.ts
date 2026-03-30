// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationHandler } from '../src/background/notification-handler';
import { mockAlarms, mockNotifications, mockStorage } from './setup';

describe('Notification Operations', () => {
  let handler: NotificationHandler;

  beforeEach(() => {
    handler = new NotificationHandler();
    mockStorage.sonto_daily_notification_enabled = true;
    mockStorage.sonto_daily_notification_time = '18:00';
  });

  it('should set up daily alarm', async () => {
    await handler.setupDailyAlarm();

    expect(mockAlarms.has('daily-wrapup')).toBe(true);
    const alarm = mockAlarms.get('daily-wrapup');
    expect(alarm?.periodInMinutes).toBe(24 * 60);
  });

  it('should clear alarm when notifications disabled', async () => {
    mockStorage.sonto_daily_notification_enabled = false;
    mockAlarms.set('daily-wrapup', { when: Date.now(), periodInMinutes: 24 * 60 });

    await handler.setupDailyAlarm();

    expect(mockAlarms.has('daily-wrapup')).toBe(false);
  });

  it('should show daily wrapup notification with clip count', async () => {
    // Mock clip data
    mockStorage.sonto_clips = [
      { id: '1', timestamp: Date.now(), text: 'Clip 1' },
      { id: '2', timestamp: Date.now(), text: 'Clip 2' },
    ];

    await handler.showDailyWrapup();

    expect(mockNotifications).toHaveLength(1);
    expect(mockNotifications[0]).toMatchObject({
      type: 'basic',
      title: 'Your Daily Sonto',
      priority: 1,
    });
  });

  it('should show "no items" message when no clips today', async () => {
    // No clips in storage
    await handler.showDailyWrapup();

    expect(mockNotifications[0]?.message).toContain('No items');
  });

  it('should show singular message for 1 clip', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mockStorage.sonto_clips = [
      { id: '1', timestamp: today.getTime() + 1000, text: 'Clip 1' },
    ];

    await handler.showDailyWrapup();

    expect(mockNotifications[0]?.message).toContain('1 item');
  });
});
