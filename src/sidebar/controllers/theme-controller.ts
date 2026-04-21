// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import { saveTheme } from '../../shared/storage';

export class ThemeController {
  private theme: 'dark' | 'light' = 'dark';

  async init(): Promise<void> {
    this.applyTheme(this.theme);
    await saveTheme(this.theme);
  }

  getTheme(): 'dark' | 'light' {
    return this.theme;
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.theme = theme;
    this.applyTheme(theme);
  }

  private applyTheme(theme: 'dark' | 'light'): void {
    document.documentElement.dataset.theme = theme;
  }
}
