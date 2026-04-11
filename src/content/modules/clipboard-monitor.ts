// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { MSG } from '../../shared/messages';

const CLIPBOARD_POLL_DEBOUNCE_MS = 300;

let monitoringEnabled = true;
let lastKnownClipboard = '';
let pendingPollTimer: ReturnType<typeof setTimeout> | null = null;

export function initClipboardMonitoring(sendClip: (text: string, source: 'clipboard' | 'shortcut') => void): void {
  chrome.storage.local.get('sonto_clipboard_monitoring').then((result) => {
    monitoringEnabled = (result['sonto_clipboard_monitoring'] as boolean | undefined) ?? true;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'sonto_clipboard_monitoring' in changes) {
      monitoringEnabled = (changes['sonto_clipboard_monitoring'].newValue as boolean | undefined) ?? true;
    }
  });

  async function pollClipboard(): Promise<void> {
    if (!monitoringEnabled) return;
    if (!document.hasFocus()) return;

    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text || text === lastKnownClipboard) return;
      lastKnownClipboard = text;
      sendClip(text, 'clipboard');
    } catch {
    }
  }

  globalThis.scheduleClipboardPoll = function schedulePoll(): void {
    if (pendingPollTimer !== null) return;
    pendingPollTimer = setTimeout(() => {
      pendingPollTimer = null;
      void pollClipboard();
    }, CLIPBOARD_POLL_DEBOUNCE_MS);
  };

  document.addEventListener('copy', (e) => {
    if (!monitoringEnabled) return;

    let text = '';
    try {
      text = window.getSelection()?.toString().trim() ?? '';
    } catch {
    }

    if (!text && e.clipboardData) {
      text = e.clipboardData.getData('text').trim();
    }

    if (text && text.length > 0) {
      sendClip(text, 'clipboard');
    }
  });

  document.addEventListener('mouseup', () => {
    const selected = window.getSelection()?.toString().trim() ?? '';
    if (selected) globalThis.scheduleClipboardPoll?.();
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) return;
    const selected = window.getSelection()?.toString().trim() ?? '';
    if (selected) globalThis.scheduleClipboardPoll?.();
  });
}
