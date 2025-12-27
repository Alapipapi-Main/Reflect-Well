
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { JournalEntry, UserSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { Target, BookCheck } from 'lucide-react';
import Balancer from 'react-wrap-balancer';
import { MOODS } from '@/lib/constants';
import { CommunityGratitude } from './community-gratitude';

interface HomeDashboardProps {
  user: User;
  entries: JournalEntry[];
  settings: UserSettings | null;
}

const DEFAULT_GOAL = 3;

export function HomeDashboard({ user, entries, settings }: HomeDashboardProps) {

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const dashboardData = useMemo(() => {
    const goal = settings?.goal ?? DEFAULT_GOAL;
    const latestEntry = entries && entries.length > 0 ? entries[entries.length - 1] : null;

    if (!entries || entries.length === 0) {
      return {
        goal,
        weeklyProgress: 0,
        progressPercentage: 0,
        latestEntry: null,
      };
    }
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const entriesThisWeek = entries.filter(entry => {
      if (!entry.date) return false;
      const entryDate = (entry.date as any).toDate();
      return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
    });
    const uniqueDays = new Set(entriesThisWeek.map(entry => format((entry.date as any).toDate(), 'yyyy-MM-dd')));
    const weeklyProgress = uniqueDays.size;
    const progressPercentage = Math.min((weeklyProgress / goal) * 100, 100);

    return {
      goal,
      weeklyProgress,
      progressPercentage,
      latestEntry,
    };
  }, [entries, settings]);


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold font-headline">
          <Balancer>{getGreeting()}.</Balancer>
        </h2>
        <p className="text-muted-foreground">Ready to reflect?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        <CommunityGratitude />
        
        {/* Latest Reflection */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookCheck className="h-5 w-5 text-primary" />
                    Latest Reflection
                </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[120px]">
                {dashboardData.latestEntry ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format((dashboardData.latestEntry.date as any).toDate(), "MMMM d, yyyy")}</span>
                            <span className="text-lg">{MOODS[dashboardData.latestEntry.mood].emoji}</span>
                        </div>
                        <p className="text-foreground/90 line-clamp-3 italic">
                           "{dashboardData.latestEntry.content}"
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground">
                        <p>Your most recent entry will appear here.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Weekly Goal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You've written on {dashboardData.weeklyProgress} out of {dashboardData.goal} days this week.
              </p>
              <Progress value={dashboardData.progressPercentage} />
               {dashboardData.weeklyProgress >= dashboardData.goal && (
                <p className="text-sm font-semibold text-green-600 dark:text-green-400 pt-2">
                  Goal achieved! Great job!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
