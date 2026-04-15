// Copyright (c) Artem Iagovdik. All rights reserved.
// Licensed under the MIT License.

import type { PromptColor } from '../shared/storage';

export const PROMPT_COLORS: Record<PromptColor, { bg: string; border: string; hex: string }> = {
  red:    { bg: 'rgba(255,90,90,0.18)', border: 'rgba(255,90,90,0.9)', hex: '#ff5a5a' },
  orange: { bg: 'rgba(255,160,60,0.18)', border: 'rgba(255,160,60,0.9)', hex: '#ffa03c' },
  yellow: { bg: 'rgba(200,160,20,0.25)', border: 'rgba(200,160,20,0.9)', hex: '#c8a014' },
  green:  { bg: 'rgba(60,200,100,0.18)', border: 'rgba(60,200,100,0.9)', hex: '#3cc864' },
  blue:   { bg: 'rgba(60,140,255,0.18)', border: 'rgba(60,140,255,0.9)', hex: '#3c8cff' },
  purple: { bg: 'rgba(140,90,220,0.18)', border: 'rgba(140,90,220,0.9)', hex: '#8c5adc' },
  gray:   { bg: 'rgba(140,140,140,0.18)', border: 'rgba(140,140,140,0.9)', hex: '#8c8c8c' },
};

export const COLOR_ORDER: PromptColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'];
