
'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
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
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
} from '@/components/ui/drawer';
import Image from 'next/image';

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
      // Sort entries for the selected day chronologically
      const sortedDayEntries = dayEntries.sort((a, b) => {
          const dateA = a.date ? (a.date as any).toDate().getTime() : 0;
          const dateB = b.date ? (b.date as any).toDate().getTime() : 0;
          return dateA - dateB;
      });
      setSelectedEntries(sortedDayEntries);
    }
  };

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Journal Calendar</CardTitle>
          <CardDescription>A visual overview of your journaling history and moods.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold pl-2">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2 font-medium">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-6 gap-1 mt-1">
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="border rounded-md" />
            ))}
            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEntries = entriesByDate.get(dateKey);
              // Show the mood of the last entry for the day if multiple exist
              const entryForDisplay = dayEntries?.[dayEntries.length -1];
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "border rounded-md p-1.5 h-20 sm:h-24 flex flex-col justify-start items-start relative transition-colors",
                    dayEntries ? "cursor-pointer hover:bg-accent" : "",
                    isSameDay(day, new Date()) && "bg-secondary/30"
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  <span className={cn("font-medium", isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground")}>
                    {format(day, "d")}
                  </span>
                  {entryForDisplay && (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl opacity-80" title={MOODS[entryForDisplay.mood].label}>
                      {MOODS[entryForDisplay.mood].emoji}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <Drawer open={!!selectedEntries} onOpenChange={(isOpen) => !isOpen && setSelectedEntries(null)}>
         <DrawerPortal>
            <DrawerOverlay />
            <DrawerContent className="max-h-[96%] flex flex-col">
              {selectedEntries && selectedEntries.length > 0 && (
                <>
                  <div className="p-4 bg-background rounded-t-[10px] flex-shrink-0">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
                    <DrawerHeader className="p-0 text-left">
                      <DrawerTitle className="flex items-center justify-between text-2xl">
                          <span>{format((selectedEntries[0].date as any).toDate(), "EEEE, MMMM d, yyyy")}</span>
                          <div className="flex -space-x-2">
                            {[...new Set(selectedEntries.map(e => e.mood))].map(mood => (
                              <span key={mood} className="text-3xl sm:text-4xl" title={MOODS[mood].label}>{MOODS[mood].emoji}</span>
                            ))}
                          </div>
                      </DrawerTitle>
                    </DrawerHeader>
                  </div>
                  <div className="p-4 overflow-auto flex-grow">
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
