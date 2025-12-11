import type { Mood } from './types';

export const MOODS: Record<Mood, { emoji: string; value: number; label: string }> = {
  ecstatic: { emoji: '😄', value: 5, label: 'Ecstatic' },
  happy: { emoji: '😊', value: 4, label: 'Happy' },
  neutral: { emoji: '😐', value: 3, label: 'Neutral' },
  sad: { emoji: '😢', value: 2, label: 'Sad' },
  angry: { emoji: '😠', value: 1, label: 'Angry' },
};
