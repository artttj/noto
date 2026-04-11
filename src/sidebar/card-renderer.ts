// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import type { SontoItem, SontoContentType } from '../../shared/types';
import { escapeHtml, formatDate } from '../../shared/utils';
import { highlightCode } from '../syntax-highlight';

const TEXT_PREVIEW_CHARS = 280;
const CODE_PREVIEW_CHARS = 300;

function contentTypeLabel(type: SontoContentType): string {
  switch (type) {
    case 'link': return 'Link';
    case 'code': return 'Code';
    case 'email': return 'Email';
    case 'image': return 'Image';
    case 'quote': return 'Quote';
    case 'art': return 'Art';
    case 'idea': return 'Idea';
    case 'haiku': return 'Haiku';
    case 'proverb': return 'Proverb';
    case 'strategy': return 'Strategy';
    default: return 'Text';
  }
}

function contentTypeIcon(type: SontoContentType): string {
  switch (type) {
    case 'link': return '↗';
    case 'code': return '{}';
    case 'email': return '@';
    case 'image': return '▨';
    case 'quote': return '"';
    case 'art': return '◈';
    case 'idea': return '◐';
    case 'haiku': return '❋';
    case 'proverb': return '◉';
    case 'strategy': return '⚇';
    default: return '¶';
  }
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== '/' ? u.pathname.slice(0, 30) : '');
  } catch {
    return url.slice(0, 40);
  }
}

export function buildClipPreviewElement(clip: SontoItem, inputAvailable: boolean): HTMLElement {
  const card = document.createElement('div');
  card.className = `clip-card clip-type-${clip.contentType}${clip.zenified ? ' clip-zenified' : ''}`;
  card.dataset.id = clip.id;

  const preview = clip.contentType === 'code'
    ? document.createElement('pre')
    : document.createElement('p');

  if (clip.contentType === 'code') {
    preview.className = 'clip-code-preview';
    const code = document.createElement('code');
    code.textContent = clip.content.slice(0, CODE_PREVIEW_CHARS);
    preview.appendChild(code);
    highlightCode(preview);
  } else {
    preview.className = 'clip-text-preview';
    const textContent = clip.content.slice(0, TEXT_PREVIEW_CHARS);
    preview.textContent = textContent + (clip.content.length > TEXT_PREVIEW_CHARS ? '…' : '');
  }

  const header = document.createElement('div');
  header.className = 'clip-header';

  const headerLeft = document.createElement('div');
  headerLeft.className = 'clip-header-left';

  const typeBadge = document.createElement('span');
  typeBadge.className = `clip-type-badge clip-badge-${clip.contentType}`;
  const typeIcon = document.createElement('span');
  typeIcon.className = 'clip-type-icon';
  typeIcon.textContent = contentTypeIcon(clip.contentType);
  typeBadge.appendChild(typeIcon);
  typeBadge.appendChild(document.createTextNode(contentTypeLabel(clip.contentType)));
  headerLeft.appendChild(typeBadge);

  header.appendChild(headerLeft);

  const timeSpan = document.createElement('span');
  timeSpan.className = 'clip-time';
  timeSpan.textContent = formatDate(clip.createdAt);
  header.appendChild(timeSpan);

  const body = document.createElement('div');
  body.className = 'clip-body';

  const needsExpand = clip.content.length > TEXT_PREVIEW_CHARS;
  if (needsExpand) {
    body.classList.add('clip-body-expandable');
    body.title = 'Click to view full text';
  }

  body.appendChild(preview);

  if (clip.url) {
    const meta = document.createElement('div');
    meta.className = 'clip-meta';
    const link = document.createElement('a');
    link.className = 'clip-source-url';
    link.href = clip.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = truncateUrl(clip.url);
    meta.appendChild(link);
    body.appendChild(meta);
  }

  const tagsHtml = renderTags(clip.tags);
  if (tagsHtml) {
    body.appendChild(tagsHtml);
  }

  const actions = document.createElement('div');
  actions.className = 'clip-card-actions';

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'clip-btn clip-btn-copy';
  copyBtn.title = 'Copy';
  copyBtn.ariaLabel = 'Copy this clip to clipboard';
  copyBtn.innerHTML = '<i data-lucide="clipboard"></i>';
  actions.appendChild(copyBtn);

  // Insert button
  const insertBtn = document.createElement('button');
  insertBtn.className = 'clip-btn clip-btn-insert';
  if (inputAvailable) {
    insertBtn.classList.add('active');
  }
  insertBtn.title = 'Insert to input';
  insertBtn.ariaLabel = 'Insert text into active input field';
  insertBtn.innerHTML = '<i data-lucide="text-cursor-input"></i>';
  actions.appendChild(insertBtn);

  // Zenify button
  const zenifyBtn = document.createElement('button');
  zenifyBtn.className = 'clip-btn clip-btn-zenify';
  if (clip.zenified) {
    zenifyBtn.classList.add('zenified');
  }
  const zenifyLabel = clip.zenified ? 'Un-zenify' : 'Zenify';
  zenifyBtn.title = zenifyLabel;
  zenifyBtn.ariaLabel = `${zenifyLabel} this clip`;
  zenifyBtn.innerHTML = '<i data-lucide="flower-2"></i>';
  actions.appendChild(zenifyBtn);

  // Tags button
  const tagsBtn = document.createElement('button');
  tagsBtn.className = 'clip-btn clip-btn-tags';
  tagsBtn.title = 'Edit tags';
  tagsBtn.ariaLabel = 'Edit tags';
  tagsBtn.innerHTML = '<i data-lucide="tag"></i>';
  actions.appendChild(tagsBtn);

  // Expand button
  if (needsExpand) {
    const expandBtn = document.createElement('button');
    expandBtn.className = 'clip-btn clip-btn-expand';
    expandBtn.title = 'View full';
    expandBtn.ariaLabel = 'View full text';
    expandBtn.innerHTML = '<i data-lucide="maximize-2"></i>';
    actions.appendChild(expandBtn);
  }

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'clip-btn clip-btn-delete';
  deleteBtn.title = 'Delete';
  deleteBtn.ariaLabel = 'Delete this clip';
  deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
  actions.appendChild(deleteBtn);

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(actions);

  return card;
}

function renderTags(tags: string[]): DocumentFragment | null {
  if (!tags || tags.length === 0) return null;

  const fragment = document.createDocumentFragment();
  tags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'clip-tag';
    tagEl.dataset.tag = tag;
    tagEl.textContent = '#' + tag;
    fragment.appendChild(tagEl);
  });

  return fragment;
}

export { renderTags };
