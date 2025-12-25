
'use client';

import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { JournalEntry, UserSettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { isYesterday, format, isToday, startOfWeek, endOfWeek, isWithinInterval, subYears } from 'date-fns';
import { MOODS } from '@/lib/constants';
import { Target, CalendarClock, Gift, User as UserIcon } from 'lucide-react';
import Balancer from 'react-wrap-balancer';

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
    const yesterday = entries.filter(entry => isYesterday((entry.date as any).toDate())).sort((a, b) => (b.date as any).toDate() - (a.date as any).toDate())[0];
    
    const today = new Date();
    const memories = entries.filter(entry => {
        if (!entry.date) return false;
        const entryDate = (entry.date as any).toDate();
        if (isToday(entryDate)) return false; // Exclude today's entries
        
        return entryDate.getDate() === today.getDate() && entryDate.getMonth() === today.getMonth();
    }).sort((a, b) => (b.date as any).toDate() - (a.date as any).toDate());

    const goal = settings?.goal ?? DEFAULT_GOAL;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const entriesThisWeek = entries.filter(entry => isWithinInterval((entry.date as any).toDate(), { start: weekStart, end: weekEnd }));
    const uniqueDays = new Set(entriesThisWeek.map(entry => format((entry.date as any).toDate(), 'yyyy-MM-dd')));
    const weeklyProgress = uniqueDays.size;
    const progressPercentage = Math.min((weeklyProgress / goal) * 100, 100);

    return {
      yesterdaysEntry: yesterday,
      memory: memories[0], // Most recent memory from this day
      goal,
      weeklyProgress,
      progressPercentage,
    };
  }, [entries, settings]);

  const displayName = user.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold font-headline">
          <Balancer>{getGreeting()}, {displayName}.</Balancer>
        </h2>
        <p className="text-muted-foreground">Here's your daily snapshot. Ready to reflect?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Yesterday's Reflection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Yesterday's Reflection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.yesterdaysEntry ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{MOODS[dashboardData.yesterdaysEntry.mood].emoji}</span>
                  <div>
                    <p className="font-semibold">{MOODS[dashboardData.yesterdaysEntry.mood].label}</p>
                    <p className="text-sm text-muted-foreground">
                      {format((dashboardData.yesterdaysEntry.date as any).toDate(), "p")}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground line-clamp-3 italic">
                  "{dashboardData.yesterdaysEntry.content}"
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <p>No entry from yesterday.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Weekly Goal */}
        <Card>
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

        {/* Memory Lane */}
        {dashboardData.memory && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Memory Lane
              </CardTitle>
              <CardDescription>
                On this day in {format((dashboardData.memory.date as any).toDate(), 'yyyy')}, you were feeling...
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{MOODS[dashboardData.memory.mood].emoji}</span>
                  <div>
                    <p className="font-semibold">{MOODS[dashboardData.memory.mood].label}</p>
                    <p className="text-sm text-muted-foreground">
                      {format((dashboardData.memory.date as any).toDate(), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground line-clamp-3 italic">
                  "{dashboardData.memory.content}"
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

    