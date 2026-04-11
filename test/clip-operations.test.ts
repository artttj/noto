// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClipHandler } from '../src/background/clip-handler';
import { mockStorage } from './setup';

describe('Clip Operations', () => {
  let clipHandler: ClipHandler;

  beforeEach(() => {
    clipHandler = new ClipHandler();
    // Set up default storage
    mockStorage.sonto_clipboard_monitoring = true;
    mockStorage.sonto_max_history_size = 100;
  });

  it('should detect link content type', async () => {
    await clipHandler.capture('https://example.com', 'manual');

    const clips = await clipHandler.getAll();
    expect(clips[0].contentType).toBe('link');
  });

  it('should detect email content type', async () => {
    await clipHandler.capture('test@example.com', 'manual');

    const clips = await clipHandler.getAll();
    expect(clips[0].contentType).toBe('email');
  });

  it('should detect code content type', async () => {
    await clipHandler.capture('function test() { return 42; }', 'manual');

    const clips = await clipHandler.getAll();
    expect(clips[0].contentType).toBe('code');
  });

  it('should update a clip', async () => {
    await clipHandler.capture('Original', 'manual');
    const clips = await clipHandler.getAll();
    const clip = clips[0];

    clip.contentType = 'code';
    await clipHandler.update(clip);

    const updated = await clipHandler.getAll();
    expect(updated[0].contentType).toBe('code');
  });

  it('should prevent duplicate clips', async () => {
    const text = 'Unique content';
    await clipHandler.capture(text, 'manual');

    await expect(clipHandler.capture(text, 'manual')).rejects.toThrow('Already in clipboard history');
  });

  it('should throw error for empty text', async () => {
    await expect(clipHandler.capture('', 'manual')).rejects.toThrow('Nothing to save');
    await expect(clipHandler.capture('   ', 'manual')).rejects.toThrow('Nothing to save');
  });

  it('should throw error when clipboard monitoring is disabled', async () => {
    mockStorage.sonto_clipboard_monitoring = false;

    await expect(clipHandler.capture('Test', 'clipboard')).rejects.toThrow('Clipboard monitoring is off');
  });

});
