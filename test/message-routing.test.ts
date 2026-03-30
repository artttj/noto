// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, vi } from 'vitest';
import { handleMessage, registerHandler } from '../src/background/message-router';
import { MSG } from '../src/shared/messages';
import type { RuntimeMessage } from '../src/shared/messages';

describe('Message Routing', () => {
  it('should route CAPTURE_CLIP message to registered handler', async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true });
    registerHandler(MSG.CAPTURE_CLIP, handler);

    const message: RuntimeMessage = {
      type: MSG.CAPTURE_CLIP,
      text: 'Test text',
      source: 'manual',
    };
    const sender = { tab: { id: 1 } } as chrome.runtime.MessageSender;
    const sendResponse = vi.fn();

    const willRespond = handleMessage(message, sender, sendResponse);
    expect(willRespond).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handler).toHaveBeenCalledWith(message, sender);
    expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('should route DELETE_CLIP message to registered handler', async () => {
    const handler = vi.fn().mockResolvedValue({});
    registerHandler(MSG.DELETE_CLIP, handler);

    const message: RuntimeMessage = {
      type: MSG.DELETE_CLIP,
      id: 'test-id-123',
    };
    const sender = {} as chrome.runtime.MessageSender;
    const sendResponse = vi.fn();

    handleMessage(message, sender, sendResponse);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handler).toHaveBeenCalledWith(message, sender);
  });

  it('should return false for unregistered message types', () => {
    const message = { type: 'UNKNOWN_TYPE' } as unknown as RuntimeMessage;
    const sender = {} as chrome.runtime.MessageSender;
    const sendResponse = vi.fn();

    const willRespond = handleMessage(message, sender, sendResponse);
    expect(willRespond).toBe(false);
  });

  it('should handle handler errors and send error response', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Test error'));
    registerHandler(MSG.GET_ALL_CLIPS, handler);

    const message: RuntimeMessage = { type: MSG.GET_ALL_CLIPS };
    const sender = {} as chrome.runtime.MessageSender;
    const sendResponse = vi.fn();

    handleMessage(message, sender, sendResponse);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      message: 'Test error',
    }));
  });

  it('should handle multiple different message types', async () => {
    const captureHandler = vi.fn().mockResolvedValue({ ok: true });
    const searchHandler = vi.fn().mockResolvedValue({ clips: [] });

    registerHandler(MSG.CAPTURE_CLIP, captureHandler);
    registerHandler(MSG.SEARCH_CLIPS, searchHandler);

    const captureMessage: RuntimeMessage = {
      type: MSG.CAPTURE_CLIP,
      text: 'Test',
      source: 'clipboard',
    };
    const searchMessage: RuntimeMessage = {
      type: MSG.SEARCH_CLIPS,
      query: 'test',
    };

    handleMessage(captureMessage, {} as chrome.runtime.MessageSender, vi.fn());
    handleMessage(searchMessage, {} as chrome.runtime.MessageSender, vi.fn());

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(captureHandler).toHaveBeenCalledTimes(1);
    expect(searchHandler).toHaveBeenCalledTimes(1);
  });
});
