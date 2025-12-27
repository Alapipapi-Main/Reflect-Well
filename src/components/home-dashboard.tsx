
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
        
        <AudioAmbiance />
        
        <ZenGarden />

      </div>
    </div>
  );
}
