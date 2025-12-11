export type Mood = 'ecstatic' | 'happy' | 'neutral' | 'sad' | 'angry';

export interface JournalEntry {
  id: string;
  date: string; // ISO 8601 format
  mood: Mood;
  content: string;
}
