
'use client';

import { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Wind } from 'lucide-react';
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

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'ecstatic': return 'bg-mood-ecstatic';
      case 'happy': return 'bg-mood-happy';
      case 'neutral': return 'bg-mood-neutral';
      case 'sad': return 'bg-mood-sad';
      case 'angry': return 'bg-mood-angry';
      default: return 'bg-muted';
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Journal Calendar</CardTitle>
          <CardDescription>A visual overview of your journaling history and moods.</CardDescription>
        </CardHeader>
        <CardContent>
           <CustomCalendar
              onDateClick={handleDateClick}
              onMonthChange={handleMonthChange}
              events={entriesByDate}
              renderDay={(day, dayEntries) => {
                const entryForDisplay = dayEntries?.[dayEntries.length -1];
                return (
                  <>
                    <span>{format(day, "d")}</span>
                    {entryForDisplay && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                          <div 
                              className={cn("h-1.5 w-1.5 rounded-full", getMoodColor(entryForDisplay.mood))}
                              title={MOODS[entryForDisplay.mood].label}
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
            <DrawerOverlay />
            <DrawerContent className="bg-background flex flex-col fixed bottom-0 left-0 right-0 max-h-[96%] rounded-t-[10px]">
              {selectedEntries && selectedEntries.length > 0 && (
                <>
                  <div className="p-4 bg-background rounded-t-[10px] flex-shrink-0">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
                    <DrawerHeader className="p-0 text-left">
                      <DrawerTitle className="flex items-center justify-between text-2xl">
                          <Balancer>{format((selectedEntries[0].date as any).toDate(), "EEEE, MMMM d, yyyy")}</Balancer>
                          <div className="flex -space-x-2">
                            {[...new Set(selectedEntries.map(e => e.mood))].map(mood => (
                              <span key={mood} className="text-3xl sm:text-4xl" title={MOODS[mood].label}>{MOODS[mood].emoji}</span>
                            ))}
                          </div>
                      </DrawerTitle>
                    </DrawerHeader>
                  </div>
                   <div className="p-4 overflow-auto">
                    <div className="space-y-6">
                      {selectedEntries.map(entry => (
                        <Card key={entry.id} className="bg-secondary/20">
                          <CardContent className="p-4 space-y-4">
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
                            {entry.audioUrl && (
                              <audio src={entry.audioUrl} controls className="w-full" />
                            )}
                            <p className="whitespace-pre-wrap text-base leading-relaxed break-words">{entry.content || <span className="italic text-muted-foreground">No text content for this entry.</span>}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </DrawerContent>
         </DrawerPortal>
      </Drawer>
    </>
  );
}
