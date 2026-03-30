// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchBrowser, closeBrowser, getSidebarPage, getSettingsPage, takeScreenshot, waitForElement } from './setup';
import type { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function ensureScreenshotDir(): Promise<void> {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function setViewport(page: Page, width: number, height: number): Promise<void> {
  await page.setViewport({ width, height });
}

async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

describe('Screenshot Generation', () => {
  let browser: Browser;
  let extensionId: string;

  beforeAll(async () => {
    await ensureScreenshotDir();
    const result = await launchBrowser();
    browser = result.browser;
    extensionId = result.extensionId;
  }, 30000);

  afterAll(async () => {
    await closeBrowser();
  });

  it('captures sidebar dark theme', async () => {
    const sidebar = await getSidebarPage(browser, extensionId);
    await setViewport(sidebar, 420, 800);
    await clearStorage(sidebar);

    // Ensure dark theme
    await sidebar.evaluate(() => {
      localStorage.setItem('sonto_theme', 'dark');
    });
    await sidebar.reload({ waitUntil: 'domcontentloaded' });
    await waitForElement(sidebar, '.header');

    await delay(500);

    const screenshotPath = await takeScreenshot(sidebar, 'e2e_sidebar_dark');
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  it('captures sidebar light theme', async () => {
    const sidebar = await getSidebarPage(browser, extensionId);
    await setViewport(sidebar, 420, 800);
    await clearStorage(sidebar);

    // Set light theme
    await sidebar.evaluate(() => {
      localStorage.setItem('sonto_theme', 'light');
    });
    await sidebar.reload({ waitUntil: 'domcontentloaded' });
    await waitForElement(sidebar, '.header');

    await delay(500);

    const screenshotPath = await takeScreenshot(sidebar, 'e2e_sidebar_light');
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  it('captures settings page', async () => {
    const settings = await getSettingsPage(browser, extensionId);
    await setViewport(settings, 900, 1000);
    await clearStorage(settings);
    await waitForElement(settings, '.settings-layout');

    // Take screenshot of clipboard tab (default)
    const screenshotPath = await takeScreenshot(settings, 'e2e_settings_clipboard');
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  it('captures settings feed tab', async () => {
    const settings = await getSettingsPage(browser, extensionId);
    await setViewport(settings, 900, 1000);
    await clearStorage(settings);
    await waitForElement(settings, '.settings-layout');

    // Click on feed tab
    await settings.click('[data-tab="feed"]');
    await delay(300);

    const screenshotPath = await takeScreenshot(settings, 'e2e_settings_feed');
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  it('captures prompt modal open', async () => {
    const sidebar = await getSidebarPage(browser, extensionId);
    await setViewport(sidebar, 420, 800);
    await clearStorage(sidebar);
    await waitForElement(sidebar, '#btn-add-prompt');

    // Open the prompt modal
    await sidebar.click('#btn-add-prompt');
    await delay(300);

    const screenshotPath = await takeScreenshot(sidebar, 'e2e_prompt_modal');
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });
});