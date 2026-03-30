// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { getTheme, saveTheme } from '../../shared/storage';

export class ThemeController {
  private theme: 'dark' | 'light' = 'dark';
  private themeBtn: HTMLButtonElement;
  private moonIcon: HTMLElement | null = null;
  private sunIcon: HTMLElement | null = null;

  constructor(themeBtn: HTMLButtonElement) {
    this.themeBtn = themeBtn;
  }

  async init(): Promise<void> {
    this.theme = await getTheme();
    this.applyTheme(this.theme);

    this.themeBtn.addEventListener('click', () => void this.toggleTheme());

    const moonIcon = document.getElementById('icon-moon');
    const sunIcon = document.getElementById('icon-sun');
    if (moonIcon) this.moonIcon = moonIcon;
    if (sunIcon) this.sunIcon = sunIcon;
  }

  getTheme(): 'dark' | 'light' {
    return this.theme;
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.theme = theme;
    this.applyTheme(theme);
  }

  private async toggleTheme(): Promise<void> {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.theme);
    await saveTheme(this.theme);
  }

  private applyTheme(theme: 'dark' | 'light'): void {
    document.documentElement.dataset.theme = theme;
    if (this.moonIcon && this.sunIcon) {
      if (theme === 'light') {
        this.moonIcon.classList.add('hidden');
        this.sunIcon.classList.remove('hidden');
      } else {
        this.moonIcon.classList.remove('hidden');
        this.sunIcon.classList.add('hidden');
      }
    }
  }
}
