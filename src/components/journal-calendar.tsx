
'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, BookOpen, Wind } from 'lucide-react';
import { MOODS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/lib/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import Image from 'next/image';

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface JournalCalendarProps {
  entries: JournalEntry[];
}

export function JournalCalendar({ entries }: JournalCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    entries.forEach(entry => {
      const dateKey = format((entry.date as any).toDate(), 'yyyy-MM-dd');
      // For simplicity, we'll show the last entry if there are multiple on the same day
      map.set(dateKey, entry);
    });
    return map;
  }, [entries]);

  const handleDateClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const entry = entriesByDate.get(dateKey);
    if (entry) {
      setSelectedEntry(entry);
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
              const entry = entriesByDate.get(dateKey);
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "border rounded-md p-1.5 h-20 sm:h-24 flex flex-col justify-start items-start relative cursor-pointer hover:bg-accent transition-colors",
                    isSameDay(day, new Date()) && "bg-secondary/30"
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  <span className={cn("font-medium", isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground")}>
                    {format(day, "d")}
                  </span>
                  {entry && (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl opacity-80" title={MOODS[entry.mood].label}>
                      {MOODS[entry.mood].emoji}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <Drawer open={!!selectedEntry} onOpenChange={(isOpen) => !isOpen && setSelectedEntry(null)}>
        <DrawerContent>
          {selectedEntry && (
            <div className="container mx-auto max-w-2xl py-8 px-4">
              <DrawerHeader>
                <DrawerTitle className="flex items-center justify-between text-2xl">
                    <span>{format((selectedEntry.date as any).toDate(), "EEEE, MMMM d, yyyy")}</span>
                    <span className="text-4xl">{MOODS[selectedEntry.mood].emoji}</span>
                </DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {selectedEntry.videoUrl && (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary">
                    <video src={selectedEntry.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  </div>
                )}
                {selectedEntry.imageUrl && !selectedEntry.videoUrl && (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-4">
                    <Image src={selectedEntry.imageUrl} alt="AI-generated image for the entry" layout="fill" objectFit="cover" />
                  </div>
                )}
                {selectedEntry.audioUrl && (
                  <audio src={selectedEntry.audioUrl} controls className="w-full" />
                )}
                <p className="whitespace-pre-wrap text-base leading-relaxed">{selectedEntry.content}</p>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
