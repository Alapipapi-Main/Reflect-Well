import { Timestamp } from "firebase/firestore";

export type Mood = 'ecstatic' | 'happy' | 'neutral' | 'sad' | 'angry';

export interface JournalEntry {
  id: string;
  userId: string;
  date: Timestamp | Date | string; // Firestore timestamp, can be Date object or ISO string
  mood: Mood;
  content: string;
  imageUrl?: string | null;
  tags?: string[];
}
