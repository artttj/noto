// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

export async function insertTextToActiveTab(
  text: string,
): Promise<{ ok?: boolean; error?: string }> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let targetTab = tabs[0];

  if (
    !targetTab ||
    targetTab.url?.startsWith('chrome://') ||
    targetTab.url?.startsWith('chrome-extension://')
  ) {
    const windows = await chrome.windows.getAll({ populate: true });
    for (const win of windows) {
      if (win.type !== 'normal' || !win.tabs) continue;
      for (const tab of win.tabs) {
        if (
          tab.id &&
          tab.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('chrome-extension://') &&
          !tab.url.startsWith('about:')
        ) {
          targetTab = tab;
          break;
        }
      }
      if (targetTab) break;
    }
  }

  if (!targetTab?.id) {
    return { error: 'No active tab found' };
  }

  try {
    const results = await chrome.tabs.sendMessage(targetTab.id, {
      type: 'INSERT_TEXT',
      text,
    });

    if (results?.ok) {
      return { ok: true };
    }

    if (results?.error === 'No editable element found') {
      return { error: 'No text field found on page' };
    }

    return { error: results?.error || 'Insert failed' };
  } catch (err) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        files: ['content/content.js'],
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const retryResults = await chrome.tabs.sendMessage(targetTab.id, {
        type: 'INSERT_TEXT',
        text,
      });

      if (retryResults?.ok) {
        return { ok: true };
      }
      return { error: retryResults?.error || 'Insert failed after reload' };
    } catch {
      return { error: 'Could not connect to page' };
    }
  }
}
