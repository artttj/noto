// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import type { ClipContentType, SontoContentType } from './types';

/**
 * Detects content type from text patterns.
 * Follows SRP by separating content detection from business logic.
 */
export class ContentTypeDetector {
  private static readonly LINK_REGEX = /^https?:\/\/\S+$/;
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  private static readonly CODE_BLOCK_REGEX = /^```[\s\S]*```$/;
  private static readonly INDENTED_CODE_REGEX = /^\s{4}/;
  private static readonly CODE_CHARS_REGEX = /[{}()[\];]/;

  /**
   * Detect content type for legacy ClipItem format
   */
  static detectClipContentType(text: string): ClipContentType {
    const trimmed = text.trim();

    if (this.LINK_REGEX.test(trimmed)) {
      return 'link';
    }

    if (this.EMAIL_REGEX.test(trimmed)) {
      return 'email';
    }

    if (this.isCodeContent(trimmed)) {
      return 'code';
    }

    return 'text';
  }

  /**
   * Detect content type for new SontoItem format
   */
  static detectSontoContentType(text: string): SontoContentType {
    const trimmed = text.trim();

    if (this.LINK_REGEX.test(trimmed)) {
      return 'link';
    }

    if (this.EMAIL_REGEX.test(trimmed)) {
      return 'email';
    }

    if (this.isCodeContent(trimmed)) {
      return 'code';
    }

    return 'text';
  }

  private static isCodeContent(text: string): boolean {
    return this.CODE_BLOCK_REGEX.test(text) ||
      this.INDENTED_CODE_REGEX.test(text) ||
      this.CODE_CHARS_REGEX.test(text.slice(0, 80));
  }
}

/**
 * Convenience function for legacy compatibility
 */
export function detectContentType(text: string): ClipContentType {
  return ContentTypeDetector.detectClipContentType(text);
}
