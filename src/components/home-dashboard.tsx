
'use client';

import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { JournalEntry, UserSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCheck } from 'lucide-react';
import Balancer from 'react-wrap-balancer';
import { MOODS } from '@/lib/constants';
import { format } from 'date-fns';
import { AudioAmbiance } from './audio-ambiance';
import { ZenGarden } from './zen-garden';


interface HomeDashboardProps {
  user: User;
  entries: JournalEntry[];
  settings: UserSettings | null;
}

export function HomeDashboard({ user, entries, settings }: HomeDashboardProps) {

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning.';
    if (hour < 18) return 'Good Afternoon.';
    return 'Good Evening.';
  };
  
  const latestEntry = useMemo(() => {
    if (!entries || entries.length === 0) {
      return null;
    }
    
    return [...entries].sort((a, b) => {
        const dateA = a.date ? (a.date as any).toDate() : new Date(0);
        const dateB = b.date ? (b.date as any).toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })[0];

  }, [entries]);


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold font-headline">
          <Balancer>{getGreeting()}</Balancer>
        </h2>
        <p className="text-muted-foreground">Ready to reflect?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        <Card>
            <CardHeader>
                <CardTitle>Latest Reflection</CardTitle>
            </CardHeader>
            <CardContent>
                {latestEntry ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                    <span className="text-4xl">{MOODS[latestEntry.mood].emoji}</span>
                    <div className="flex flex-col">
                        <span className="font-semibold">{MOODS[latestEntry.mood].label}</span>
                        <span className="text-sm text-muted-foreground">
                        {format((latestEntry.date as any).toDate(), "MMMM d, yyyy")}
                        </span>
                    </div>
                    </div>
                    <p className="text-muted-foreground line-clamp-3">
                    {latestEntry.content}
                    </p>
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg h-full">
                    <BookCheck className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Ready for your first entry?</h3>
                    <p>Your latest reflection will appear here.</p>
                </div>
                )}
            </CardContent>
        </Card>

        <AudioAmbiance />
        
        <ZenGarden />

      </div>
    </div>
  );
}
