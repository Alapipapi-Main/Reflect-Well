
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JournalEntry } from '@/lib/types';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { Target, Trophy } from 'lucide-react';
import { Button } from './ui/button';

interface JournalGoalsProps {
  entries: JournalEntry[];
}

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function JournalGoals({ entries }: JournalGoalsProps) {
  const [goal, setGoal] = useState<number>(3);
  const [isClient, setIsClient] = useState(false);

  // Hydration safety: access localStorage only on the client
  useEffect(() => {
    setIsClient(true);
    try {
      const savedGoal = localStorage.getItem('journalGoal');
      if (savedGoal) {
        setGoal(parseInt(savedGoal, 10));
      }
    } catch (error) {
      console.error("Could not read goal from localStorage", error);
    }
  }, []);

  const handleGoalChange = (value: string) => {
    const newGoal = parseInt(value, 10);
    setGoal(newGoal);
    try {
        localStorage.setItem('journalGoal', newGoal.toString());
    } catch (error) {
        console.error("Could not save goal to localStorage", error);
    }
  };

  const weeklyProgress = useMemo(() => {
    const now = new Date();
    // Monday as the start of the week
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const entriesThisWeek = entries.filter(entry => {
      const entryDate = (entry.date as any).toDate();
      return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
    });
    
    // Count unique days with entries
    const uniqueDays = new Set(entriesThisWeek.map(entry => format((entry.date as any).toDate(), 'yyyy-MM-dd')));

    return {
      count: uniqueDays.size,
      weekStart,
      weekEnd,
    };
  }, [entries]);

  const progressPercentage = useMemo(() => {
    if (goal === 0) return 0;
    return (weeklyProgress.count / goal) * 100;
  }, [weeklyProgress.count, goal]);
  
  const isGoalMet = weeklyProgress.count >= goal;

  if (!isClient) {
    // Render a skeleton or null during SSR to avoid hydration mismatch
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Journaling Goal</CardTitle>
          <CardDescription>Set a goal to build your journaling habit.</CardDescription>
        </CardHeader>
        <CardContent className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded-md mb-6"></div>
            <div className="h-4 w-full bg-muted rounded-full mb-2"></div>
            <div className="h-6 w-24 bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Journaling Goal</CardTitle>
        <CardDescription>Set a goal for how many days you want to write this week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label htmlFor="goal-select" className="font-medium shrink-0">My goal is to write</label>
          <div className="flex items-center gap-2">
            <Select onValueChange={handleGoalChange} defaultValue={goal.toString()}>
              <SelectTrigger id="goal-select" className="w-[180px]">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt.toString()}>
                    {opt} {opt > 1 ? 'times' : 'time'} a week
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <Target className="text-primary" />
            This Week's Progress
          </h3>
          <p className="text-sm text-muted-foreground">
             You've written on {weeklyProgress.count} out of {goal} days this week.
          </p>
          <Progress value={progressPercentage} className="w-full" />
           {isGoalMet && (
            <div className="pt-4 flex items-center gap-3 text-green-600 dark:text-green-400 bg-green-500/10 p-4 rounded-lg">
                <Trophy className="h-10 w-10" />
                <div className='flex flex-col'>
                    <h4 className="font-bold text-lg">Goal Achieved!</h4>
                    <p className="text-sm">Congratulations on your consistency this week. Keep it up!</p>
                </div>
            </div>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
