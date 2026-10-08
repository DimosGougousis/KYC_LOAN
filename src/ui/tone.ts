import type { Tone } from '../domain/types';

export const TONE_TEXT: Record<Tone, string> = { good: 'text-good', warn: 'text-warn', bad: 'text-bad', info: 'text-muted' };

export const TONE_SOFT: Record<Tone, string> = {
  good: 'bg-good-soft text-good border-good/30',
  warn: 'bg-warn-soft text-warn border-warn/30',
  bad: 'bg-bad-soft text-bad border-bad/30',
  info: 'bg-info-soft text-muted border-line',
};

export const TONE_OUTLINE: Record<Tone, string> = {
  good: 'border-good text-good',
  warn: 'border-warn text-warn',
  bad: 'border-bad text-bad',
  info: 'border-line text-muted',
};

export const TONE_DOT: Record<Tone, string> = { good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad', info: 'bg-line' };
