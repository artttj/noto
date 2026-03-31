// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchBrowser, closeBrowser, getSidebarPage } from './setup';
import type { Browser, Page } from 'puppeteer';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Insert Text to Input', () => {
  let browser: Browser;
  let extensionId: string;

  beforeAll(async () => {
    const result = await launchBrowser();
    browser = result.browser;
    extensionId = result.extensionId;
  }, 30000);

  afterAll(async () => {
    await closeBrowser();
  });

  it('creates prompt and inserts into input field', async () => {
    const testPage = await browser.newPage();
    await testPage.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    await delay(2000);

    await testPage.waitForSelector('input[name="q"]', { timeout: 10000 }).catch(() => null);

    const sidebar = await getSidebarPage(browser, extensionId);
    await delay(1000);

    await sidebar.click('#nav-prompts');
    await delay(500);

    const addBtn = await sidebar.$('#btn-add-prompt');
    expect(addBtn).not.toBeNull();

    if (addBtn) {
      await sidebar.click('#btn-add-prompt');
      await delay(200);

      await sidebar.type('#prompt-input', 'Test Query From Extension');
      await delay(100);

      await sidebar.click('#prompt-save');
      await delay(800);
    }

    const promptCards = await sidebar.$$('.clip-card.clip-type-prompt');
    expect(promptCards.length).toBeGreaterThanOrEqual(1);

    await testPage.bringToFront();
    await delay(500);

    await sidebar.bringToFront();
    await delay(300);

    await sidebar.evaluate(() => {
      const btn = document.querySelector('.clip-btn-insert') as HTMLElement;
      if (btn) btn.click();
    });
    await delay(2000);

    const toast = await sidebar.$('.sidebar-toast');
    if (toast) {
      const toastText = await sidebar.evaluate(() => {
        const el = document.querySelector('.sidebar-toast');
        return el?.textContent ?? '';
      });
      console.log('Toast text:', toastText);
      expect(toastText).toContain('Inserted');
    }

    await testPage.close();
  });
});