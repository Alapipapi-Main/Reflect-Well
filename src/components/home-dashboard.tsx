
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
        
        <AudioAmbiance />
        
        {/* Latest Reflection */}
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookCheck className="h-5 w-5 text-primary" />
                    Latest Reflection
                </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[120px] flex items-center justify-center">
                {latestEntry ? (
                    <div className="space-y-2 w-full">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format((latestEntry.date as any).toDate(), "MMMM d, yyyy")}</span>
                            <span className="text-lg">{MOODS[latestEntry.mood].emoji}</span>
                        </div>
                        <p className="text-foreground/90 line-clamp-3 italic">
                           "{latestEntry.content}"
                        </p>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <p>Your most recent entry will appear here once you've saved one.</p>
                    </div>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
