// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

const en: Record<string, string> = {
  nav_clipboard: 'Clipboard',
  nav_language: 'Language',
  nav_data: 'Data',
  nav_about: 'About',
  brand_sub: 'Settings',

  general_language: 'Language',
  general_language_desc: 'Preferred interface language',
  general_saved: 'Saved',

  clipboard_heading: 'Clipboard',
  clipboard_desc: 'Configure how Sonto captures and stores clipboard history.',
  clipboard_capture: 'Capture',
  clipboard_auto: 'Auto-capture on copy',
  clipboard_auto_desc: 'Automatically save text whenever you copy on any webpage. Disable to capture only via shortcut or right-click.',
  clipboard_max_size: 'Max history size',
  clipboard_max_size_desc: 'Maximum number of entries to keep. Oldest entries are removed when the limit is reached. (10–5000)',
  clipboard_stored: 'Entries stored',

  related_popup: 'Related clips popup',
  related_popup_desc: 'Show a floating card with related clips from your saves when visiting a page',

  badge_counter: 'Badge counter',
  badge_counter_desc: 'Show daily capture count on the extension icon',

  shortcuts: 'Keyboard Shortcuts',

  data_heading: 'Data',
  data_export: 'Export',
  data_import: 'Import',
  data_delete_all: 'Delete all',
  data_snippets: 'Saved snippets',
  data_confirm_delete: 'Delete all entries?',

  about_heading: 'About Sonto',
  about_desc: 'Clipboard manager for Chrome. No accounts, no backend, no tracking.',
  about_version: 'Version',
  about_author: 'Author',
  about_license: 'License',
  about_license_text: 'MIT — free to use and modify.',
  about_github: 'View on GitHub',

  status_saved: 'Saved',
  status_deleted: 'Deleted',
};

export default en;
