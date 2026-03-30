// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchBrowser, closeBrowser, getSettingsPage, waitForElement } from './setup';
import type { Browser } from 'puppeteer';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Sonto Settings E2E', () => {
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

  describe('Settings page', () => {
    it('loads settings page', async () => {
      const settings = await getSettingsPage(browser, extensionId);
      await waitForElement(settings, '.settings-layout');

      const title = await settings.title();
      expect(title).toContain('Sonto');
      expect(title).toContain('Settings');
    });

    it('has settings layout', async () => {
      const settings = await getSettingsPage(browser, extensionId);
      await waitForElement(settings, '.settings-layout');

      const layout = await settings.$('.settings-layout');
      expect(layout).not.toBeNull();
    });

    it('has sidebar navigation', async () => {
      const settings = await getSettingsPage(browser, extensionId);
      await waitForElement(settings, '.sidebar');

      const nav = await settings.$('.sidebar-nav');
      expect(nav).not.toBeNull();
    });

    it('has clipboard tab active by default', async () => {
      const settings = await getSettingsPage(browser, extensionId);
      await waitForElement(settings, '#tab-clipboard');

      const clipboardTab = await settings.$('[data-tab="clipboard"]');
      expect(clipboardTab).not.toBeNull();

      const isActive = await settings.$eval('[data-tab="clipboard"]', el => el.classList.contains('active'));
      expect(isActive).toBe(true);
    });

    it('has clipboard monitoring toggle', async () => {
      const settings = await getSettingsPage(browser, extensionId);
      await waitForElement(settings, '#clipboard-monitoring-toggle');

      const toggle = await settings.$('#clipboard-monitoring-toggle');
      expect(toggle).not.toBeNull();
    });

    it('has export/import buttons in data tab', async () => {
      const settings = await getSettingsPage(browser, extensionId);
      await waitForElement(settings, '.settings-layout');

      // Click on data tab
      await settings.click('[data-tab="data"]');
      await delay(200);

      const exportBtn = await settings.$('#btn-export');
      expect(exportBtn).not.toBeNull();

      const importBtn = await settings.$('#btn-import');
      expect(importBtn).not.toBeNull();
    });

    it('has feed sources section in feed tab', async () => {
      const settings = await getSettingsPage(browser, extensionId);
      await waitForElement(settings, '.settings-layout');

      // Click on feed tab
      await settings.click('[data-tab="feed"]');
      await delay(200);

      const sourcesList = await settings.$('#zen-sources-list');
      expect(sourcesList).not.toBeNull();
    });

    it('has language options in language tab', async () => {
      const settings = await getSettingsPage(browser, extensionId);
      await waitForElement(settings, '.settings-layout');

      // Click on language tab
      await settings.click('[data-tab="language"]');
      await delay(200);

      const languageSegmented = await settings.$('#language-segmented');
      expect(languageSegmented).not.toBeNull();

      const buttons = await settings.$$('#language-segmented .seg-btn');
      expect(buttons.length).toBe(2);
    });
  });
});