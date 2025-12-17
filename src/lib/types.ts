import { Timestamp } from "firebase/firestore";

export type Mood = 'ecstatic' | 'happy' | 'neutral' | 'sad' | 'angry';

export interface JournalEntry {
  id: string;
  userId: string;
  date: Timestamp | Date | string; // Firestore timestamp, can be Date object or ISO string
  mood: Mood;
  content: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  tags?: string[];
}

export interface UserSettings {
  goal: number;
  inspirationPrompt?: string | null;
}

export interface GratitudePost {
  id: string;
  text: string;
  createdAt: Timestamp;
  authorId: string;
}
