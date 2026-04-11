// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

let lastFocusedInput: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null;

function isEditableElement(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement | HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    return ['text', 'search', 'email', 'url', 'tel', 'password', ''].includes(type);
  }
  if (tag === 'TEXTAREA') return true;
  if (el.isContentEditable) return true;
  return false;
}

document.addEventListener('focusin', (e) => {
  if (isEditableElement(e.target)) {
    lastFocusedInput = e.target;
  }
}, true);

export function findBestInput(): HTMLInputElement | HTMLTextAreaElement | HTMLElement | null {
  const active = document.activeElement;
  if (active && isEditableElement(active)) {
    return active as HTMLInputElement | HTMLTextAreaElement | HTMLElement;
  }

  if (lastFocusedInput && document.body.contains(lastFocusedInput)) {
    return lastFocusedInput;
  }

  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input:not([type]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="image"]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="number"], textarea'
  );

  let best: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null;
  let bestScore = 0;

  for (const input of inputs) {
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

    const style = getComputedStyle(input);
    if (style.visibility === 'hidden' || style.display === 'none') continue;

    const area = rect.width * rect.height;
    const centerDist = Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2);
    const score = area - centerDist * 10;

    if (score > bestScore) {
      bestScore = score;
      best = input;
    }
  }

  const editables = document.querySelectorAll<HTMLElement>('[contenteditable], [contenteditable="true"], [contenteditable=""]');
  for (const el of editables) {
    if (!el.isContentEditable) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;

    const area = rect.width * rect.height;
    const centerDist = Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2);
    const score = area - centerDist * 10;

    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  }

  return best;
}

export interface InsertTextResult {
  ok?: boolean;
  error?: string;
}

export function insertTextToInput(text: string): InsertTextResult {
  const target = findBestInput();

  if (!target) {
    return { error: 'No input field found on page.' };
  }

  const tag = target.tagName;

  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    const el = target as HTMLInputElement | HTMLTextAreaElement;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;

    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + text + after;

    const newPos = start + text.length;
    el.selectionStart = newPos;
    el.selectionEnd = newPos;

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));

    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text,
    });
    el.dispatchEvent(inputEvent);

    el.focus();
  } else if (target.isContentEditable) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    } else {
      target.textContent = (target.textContent ?? '') + text;
    }
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.focus();
  }

  return { ok: true };
}

export function showToast(message: string, isError = false): void {
  const existing = document.getElementById('sonto-toast');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'sonto-toast';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      color: #fff;
      background: ${isError ? '#c0392b' : '#1a1a1a'};
      border: 1px solid ${isError ? '#e74c3c' : '#333'};
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      max-width: 320px;
      word-break: break-word;
      animation: slide-in 0.18s ease-out;
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  shadow.appendChild(style);
  shadow.appendChild(toast);
  document.body.appendChild(host);

  setTimeout(() => host.remove(), 2500);
}

export function checkInputAvailable(): { available: boolean } {
  return { available: !!findBestInput() };
}
