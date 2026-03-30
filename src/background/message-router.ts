// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import type { RuntimeMessage } from '../shared/messages';

export interface MessageHandler {
  (message: RuntimeMessage, sender: chrome.runtime.MessageSender): Promise<unknown> | unknown;
}

export interface MessageRegistry {
  [type: string]: MessageHandler;
}

const handlers: MessageRegistry = {};

export function registerHandler(type: string, handler: MessageHandler): void {
  handlers[type] = handler;
}

export function handleMessage(
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  const handler = handlers[message.type];
  if (!handler) return false;

  Promise.resolve(handler(message, sender))
    .then((result) => {
      if (result && typeof result === 'object') {
        sendResponse({ ok: true, ...result });
      } else {
        sendResponse({ ok: true });
      }
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      sendResponse({ ok: false, message: msg });
    });

  return true;
}
