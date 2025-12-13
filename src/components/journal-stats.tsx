'use client';

import type { JournalEntry, Mood } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMemo } from 'react';
import { Flame, Book, BarChart3, Star } from 'lucide-react';
import { MOODS } from '@/lib/constants';
import { calculateStreak } from '@/lib/stats';

interface JournalStatsProps {
  entries: JournalEntry[];
}

export function JournalStats({ entries }: JournalStatsProps) {
  const stats = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        streak: 0,
        totalEntries: 0,
        mostFrequentMood: null,
      };
    }

    // Calculate current streak
    const streak = calculateStreak(entries);

    // Calculate total entries
    const totalEntries = entries.length;

    // Calculate most frequent mood
    const moodCounts = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<Mood, number>);

    let mostFrequentMood: Mood | null = null;
    let maxCount = 0;
    for (const mood in moodCounts) {
      if (moodCounts[mood as Mood] > maxCount) {
        maxCount = moodCounts[mood as Mood];
        mostFrequentMood = mood as Mood;
      }
    }

    return {
      streak,
      totalEntries,
      mostFrequentMood,
    };
  }, [entries]);

  const StatCard = ({ icon, title, value, description }: { icon: React.ReactNode; title: string; value: React.ReactNode; description: string }) => (
    <div className="flex items-center space-x-4 rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
      <div className="text-primary">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Journaling Stats</CardTitle>
        <CardDescription>A look at your mindfulness journey by the numbers.</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <BarChart3 className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Stats Yet</h3>
            <p>Your stats will appear here once you've written your first journal entry.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={<Flame className="h-8 w-8" />}
              title="Current Streak"
              value={`${stats.streak} Days`}
              description={stats.streak > 0 ? 'Keep the fire going!' : 'Start a new streak today!'}
            />
            <StatCard
              icon={<Book className="h-8 w-8" />}
              title="Total Entries"
              value={stats.totalEntries}
              description="A library of your thoughts."
            />
            {stats.mostFrequentMood && (
              <StatCard
                icon={<Star className="h-8 w-8" />}
                title="Most Frequent Mood"
                value={
                  <span className="flex items-center gap-2">
                    {MOODS[stats.mostFrequentMood].emoji}
                    <span>{MOODS[stats.mostFrequentMood].label}</span>
                  </span>
                }
                description="Your most common feeling."
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
