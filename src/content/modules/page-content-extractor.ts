// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

const STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'canvas',
  'nav',
  'footer',
  'aside',
  'form',
  'input',
  'select',
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[role='complementary']",
  "[role='toolbar']",
  "[role='menu']",
  "[role='menubar']",
  "[role='menuitem']",
  "[role='dialog']",
  "[role='alertdialog']",
  "[role='tooltip']",
  "[role='status']",
  '#LanguageMenu',
  "[id^='Microsoft_Translator']",
  "[class*='VIpgJd']",
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  "[id='CybotCookiebotDialog']",
  "[id='cookie-law-info-bar']",
  "[id='cookie-notice']",
  "[id='cookie-banner']",
  "[id='gdpr-banner']",
  "[id='consent-banner']",
  "[class*='cookie-banner']",
  "[class*='cookie-notice']",
  "[class*='cookie-bar']",
  "[class*='gdpr-banner']",
  "[class*='cc-window']",
  "[class*='newsletter-signup']",
  "[class*='newsletter-block']",
  "[id*='newsletter']",
  "[class*='social-share']",
  "[class*='share-buttons']",
  "[class*='share-bar']",
  "[id^='google_ads_']",
  'ins.adsbygoogle',
  "[class*='advertisement']",
  "[class*='sponsored-content']",
  "[class*='intercom']",
  "[class*='helpscout']",
  "[class*='drift-']",
  "[id*='hubspot']",
  "[class*='chat-widget']",
  '#navFooter',
  '#rhf',
  '#nav-belt',
  '#nav-top',
  "[id*='-sims-']",
  '.a-carousel-container',
  "[data-component-type='s-search-results']",
  '#related',
  '#secondary',
  '.pull-request-overview',
  "[data-qa='pr-sidebar']",
  "[data-testid='pullrequest-sidebar']",
  '.diff-tree-list',
  '.review-bar-component',
].join(',');

const MAIN_SELECTORS = [
  'article',
  "[role='main']",
  'main',
  '#main-content',
  '#content',
  '#article-body',
  '#story',
  '#post-content',
  '#entry-content',
  '.post-body',
  '.js-discussion',
  '.repository-content',
  '#issue-content',
  '#pullrequest-diff',
  "[data-qa='pr-diff']",
  "[data-testid='pullrequest-diff']",
  '.diff-container',
  '.diff-files-holder-inner',
  '.merge-request-tabs-content',
  '#centerCol',
  '#dp',
  '#ppd',
];

function looksLikeDiffTable(table: HTMLTableElement): boolean {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length < 2) return false;
  const meta = (table.className || '') + (table.getAttribute('data-diff-type') || '') + (table.getAttribute('data-qa') || '');
  if (/diff|hunk/i.test(meta)) return true;
  if (table.closest("[class*='diff'], [data-qa*='diff'], [id*='diff'], [data-testid*='diff']")) {
    return true;
  }
  const sample = rows.slice(0, Math.min(6, rows.length));
  return sample.some((row) =>
    /\b(addition|deletion|added|removed|context|unchanged|hunk|insert|delete|bb-udiff)\b/i.test(row.className || ''),
  );
}

function preprocessDiffTables(root: Element): void {
  root.querySelectorAll('table').forEach((table) => {
    if (!looksLikeDiffTable(table as HTMLTableElement)) return;
    const lines: string[] = [];
    table.querySelectorAll('tr').forEach((row) => {
      const cls = row.className || '';
      if (/\b(hunk|expander|bb-udiff-hunk|line-hunk)\b/i.test(cls)) {
        const hunkCell = row.querySelector("[class*='hunk'], [class*='segment'], td:last-child");
        const text2 = (hunkCell || row).textContent?.trim() || '';
        if (text2) {
          lines.push(text2);
        }
        return;
      }
      const cells = row.querySelectorAll('td');
      if (!cells.length) return;
      const codeCell =
        row.querySelector(
          "td.source, td.blob-code-inner, td[class*='code'], td[class*='source'], td[class*='content']",
        ) || cells[cells.length - 1];
      const text = (codeCell.textContent || '').trimEnd();
      lines.push(text);
    });
    if (lines.length > 1) {
      const pre = document.createElement('pre');
      pre.textContent = lines.join('\n');
      table.parentNode?.replaceChild(pre, table);
    }
  });
}

function toMarkdown(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  let md = '';

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      md += node.textContent || '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case 'br':
        md += '\n';
        break;
      case 'p':
      case 'div':
        if (md && !md.endsWith('\n')) md += '\n';
        el.childNodes.forEach(walk);
        if (!md.endsWith('\n')) md += '\n';
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        if (md && !md.endsWith('\n')) md += '\n';
        md += '#'.repeat(parseInt(tag[1], 10)) + ' ';
        el.childNodes.forEach(walk);
        if (!md.endsWith('\n')) md += '\n\n';
        break;
      case 'li':
        md += '- ';
        el.childNodes.forEach(walk);
        if (!md.endsWith('\n')) md += '\n';
        break;
      case 'ul':
      case 'ol':
        el.childNodes.forEach(walk);
        if (!md.endsWith('\n')) md += '\n';
        break;
      case 'pre':
        if (md && !md.endsWith('\n')) md += '\n';
        md += '```\n' + el.textContent + '\n```\n';
        break;
      case 'code':
        if (el.parentElement?.tagName.toLowerCase() !== 'pre') {
          md += '`' + el.textContent + '`';
        }
        break;
      case 'a':
        const href = el.getAttribute('href') || '';
        const text = el.textContent || '';
        if (href && !href.startsWith('#')) {
          md += '[' + text + '](' + href + ')';
        } else {
          md += text;
        }
        break;
      case 'img':
        const alt = el.getAttribute('alt') || '';
        if (alt && !/^:[a-z_]+:$/.test(alt)) {
          md += '[' + alt + ']';
        }
        break;
      case 'strong':
      case 'b':
        md += '**' + el.textContent + '**';
        break;
      case 'em':
      case 'i':
        md += '_' + el.textContent + '_';
        break;
      case 'blockquote':
        if (md && !md.endsWith('\n')) md += '\n';
        md += '> ' + el.textContent?.split('\n').join('\n> ') + '\n';
        break;
      default:
        el.childNodes.forEach(walk);
    }
  };

  tmp.childNodes.forEach(walk);

  return md.replace(/-{3,}/g, '---').replace(/\n{3,}/g, '\n\n').trim();
}

function findMainContent(): Element | null {
  for (const sel of MAIN_SELECTORS) {
    const el = document.querySelector(sel);
    if (el && el.textContent && el.textContent.trim().length > 150) {
      return el;
    }
  }
  return null;
}

function isDiffPage(): boolean {
  return /github\.com\/.+\/(pull|commit)|bitbucket\.org\/.+\/pull-requests|gitlab\.com\/.+-\/merge_requests/i.test(
    location.href,
  );
}

export interface ExtractPageContentResult {
  success: boolean;
  content?: string;
  title: string;
  url: string;
  error?: string;
}

export function extractPageContent(): ExtractPageContentResult {
  const mainEl = findMainContent();
  const root = mainEl ?? document.body;
  const clone = root.cloneNode(true) as Element;
  preprocessDiffTables(clone);
  clone.querySelectorAll(STRIP_SELECTORS).forEach((el) => el.remove());
  let markdown = toMarkdown(clone.innerHTML);
  if ((!markdown || markdown.trim().length < 20) && mainEl) {
    const bodyClone = document.body.cloneNode(true) as Element;
    preprocessDiffTables(bodyClone);
    bodyClone.querySelectorAll(STRIP_SELECTORS).forEach((el) => el.remove());
    markdown = toMarkdown(bodyClone.innerHTML);
  }
  if (!markdown || markdown.trim().length < 20) {
    const hint = isDiffPage()
      ? 'Diff content not yet loaded. Scroll to the bottom of the PR/MR to load all files, then try again.'
      : 'No meaningful content detected on this page.';
    return { success: false, error: hint, title: document.title, url: location.href };
  }
  return {
    success: true,
    content: markdown,
    title: document.title,
    url: location.href,
  };
}
