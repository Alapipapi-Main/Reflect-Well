
'use client'

import { useEffect, useMemo, useState } from 'react';
import { Celebration } from '@/components/celebration';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import type { JournalEntry, UserSettings } from "@/lib/types"
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';

const DEFAULT_GOAL = 3;

export function GlobalCelebration() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showCelebration, setShowCelebration] = useState(false);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'main');
  }, [user, firestore]);
  const { data: settings } = useDoc<UserSettings>(settingsDocRef);

  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'journalEntries'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: rawEntries } = useCollection<JournalEntry>(journalEntriesQuery);

  const entries = useMemo(() => {
    if (!rawEntries) return [];
    return [...rawEntries].sort((a, b) => {
      const dateA = a.date ? (a.date as any).toDate() : new Date(0);
      const dateB = b.date ? (b.date as any).toDate() : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
  }, [rawEntries]);

  // Goal celebration logic
  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const entriesThisWeek = entries.filter(entry => {
      if (!entry.date) return false;
      const entryDate = (entry.date as any).toDate();
      return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
    });
    
    const uniqueDays = new Set(entriesThisWeek.map(entry => format((entry.date as any).toDate(), 'yyyy-MM-dd')));
    return uniqueDays.size;
  }, [entries]);

  const goal = settings?.goal ?? DEFAULT_GOAL;
  
  useEffect(() => {
    if (!user) return; // Don't run for logged-out users

    const wasGoalMetPreviously = localStorage.getItem(`goalMetWeek-${user.uid}`) === format(new Date(), 'yyyy-w');
    const isGoalMetNow = weeklyProgress >= goal;

    if (isGoalMetNow && !wasGoalMetPreviously) {
      setShowCelebration(true);
      toast({
        variant: 'success',
        title: "Goal Achieved!",
        description: `Congratulations on journaling ${goal} times this week!`,
        duration: 5000,
      });
      localStorage.setItem(`goalMetWeek-${user.uid}`, format(new Date(), 'yyyy-w'));
      
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [weeklyProgress, goal, toast, user]);

  if (!showCelebration) {
    return null;
  }

  return <Celebration />;
}
