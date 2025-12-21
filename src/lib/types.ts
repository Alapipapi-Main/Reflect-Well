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
  videoUrl?: string | null;
  tags?: string[];
}

export interface UserSettings {
  goal: number;
  inspirationPrompt?: string | null;
  theme?: string;
  appearance?: 'light' | 'dark' | 'system';
}

export interface GratitudePost {
  id: string;
  text: string;
  createdAt: Timestamp;
  authorId: string;
}

export interface JournalTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
}
