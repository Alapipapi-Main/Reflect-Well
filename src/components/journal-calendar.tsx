
'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wind } from 'lucide-react';
import { MOODS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/lib/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerOverlay,
  DrawerPortal,
} from '@/components/ui/drawer';
import Image from 'next/image';
import Balancer from 'react-wrap-balancer';
import { CustomCalendar } from './custom-calendar';

interface JournalCalendarProps {
  entries: JournalEntry[];
}

export function JournalCalendar({ entries }: JournalCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEntries, setSelectedEntries] = useState<JournalEntry[] | null>(null);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach(entry => {
      const dateKey = format((entry.date as any).toDate(), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);

  const handleDateClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEntries = entriesByDate.get(dateKey);
    if (dayEntries) {
      const sortedDayEntries = dayEntries.sort((a, b) => {
          const dateA = a.date ? (a.date as any).toDate().getTime() : 0;
          const dateB = b.date ? (b.date as any).toDate().getTime() : 0;
          return dateA - dateB;
      });
      setSelectedEntries(sortedDayEntries);
    }
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Journal Calendar</CardTitle>
          <CardDescription>A visual overview of your journaling history.</CardDescription>
        </CardHeader>
        <CardContent>
           <CustomCalendar
              onDateClick={handleDateClick}
              onMonthChange={handleMonthChange}
              events={entriesByDate}
              renderDay={(day, dayEntries) => {
                const hasEntry = dayEntries && dayEntries.length > 0;
                return (
                  <>
                    <span>{format(day, "d")}</span>
                    {hasEntry && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                          <div 
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                          ></div>
                      </div>
                    )}
                  </>
                );
              }}
           />
        </CardContent>
      </Card>
      
       <Drawer open={!!selectedEntries} onOpenChange={(isOpen) => !isOpen && setSelectedEntries(null)}>
         <DrawerPortal>
            <DrawerOverlay className="fixed inset-0 bg-black/40" />
            <DrawerContent className="bg-background flex flex-col fixed bottom-0 left-0 right-0 max-h-[96%] rounded-t-[10px]">
              {selectedEntries && selectedEntries.length > 0 && (
                <div className="w-full mx-auto flex flex-col overflow-auto rounded-t-[10px]">
                    <div className="p-4 flex-shrink-0">
                      <DrawerHeader className="p-0 text-left">
                        <DrawerTitle className="flex items-center justify-between text-2xl">
                            <Balancer>{format((selectedEntries[0].date as any).toDate(), "EEEE, MMMM d, yyyy")}</Balancer>
                        </DrawerTitle>
                      </DrawerHeader>
                    </div>
                     <div className="p-4 pt-0 overflow-y-auto">
                      <div className="space-y-6">
                        {selectedEntries.map(entry => (
                          <Card key={entry.id} className="bg-secondary/20">
                             <CardHeader className="flex-row items-center justify-between">
                                {entry.audioUrl ? (
                                    <audio src={entry.audioUrl} controls className="w-full" />
                                ): (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {format((entry.date as any).toDate(), 'p')}
                                        </span>
                                    </div>
                                )}
                                <span className="text-3xl sm:text-4xl" title={MOODS[entry.mood].label}>{MOODS[entry.mood].emoji}</span>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-4">
                              {entry.videoUrl && (
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary">
                                  <video src={entry.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                </div>
                              )}
                              {entry.imageUrl && !entry.videoUrl && (
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                                  <Image src={entry.imageUrl} alt="AI-generated image for the entry" fill objectFit="cover" />
                                </div>
                              )}
                              <p className="whitespace-pre-wrap text-base leading-relaxed break-words">{entry.content || <span className="italic text-muted-foreground">No text content for this entry.</span>}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                </div>
              )}
            </DrawerContent>
         </DrawerPortal>
      </Drawer>
    </>
  );
}
