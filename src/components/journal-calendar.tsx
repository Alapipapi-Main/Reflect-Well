
'use client';

import { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag, Wind, PlayCircle, Loader2, StopCircle, X } from 'lucide-react';
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
  DrawerClose,
} from '@/components/ui/drawer';
import Image from 'next/image';
import Balancer from 'react-wrap-balancer';
import { CustomCalendar } from './custom-calendar';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';

declare const puter: any;

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

  const handleCloseDrawer = () => {
    setSelectedEntries(null);
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
      
       <Drawer open={!!selectedEntries} onOpenChange={(isOpen) => !isOpen && handleCloseDrawer()}>
         <DrawerPortal>
            <DrawerOverlay />
            <DrawerContent>
              {selectedEntries && selectedEntries.length > 0 && (
                <div className="w-full mx-auto flex flex-col overflow-auto">
                    <div className="p-4 flex-shrink-0">
                      <DrawerHeader className="p-0 text-left">
                        <DrawerTitle className="flex items-center justify-between text-2xl">
                            <Balancer>{format((selectedEntries[0].date as any).toDate(), "EEEE, MMMM d, yyyy")}</Balancer>
                             <DrawerClose asChild>
                                <Button variant="ghost" size="icon" onClick={handleCloseDrawer}>
                                    <X className="h-6 w-6" />
                                    <span className="sr-only">Close</span>
                                </Button>
                             </DrawerClose>
                        </DrawerTitle>
                      </DrawerHeader>
                    </div>
                     <div className="p-4 pt-0 overflow-y-auto">
                      <div className="space-y-6">
                        {selectedEntries.map(entry => (
                          <EntryCard key={entry.id} entry={entry} />
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


function EntryCard({ entry }: { entry: JournalEntry }) {
    const { toast } = useToast();
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    const handleListen = async () => {
        if (isPlaying) {
            audioPlayerRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        if (typeof puter === 'undefined') {
            toast({ variant: 'destructive', title: 'AI Feature Not Available' });
            return;
        }
        if (!entry.content) {
            toast({ title: 'No text content to read.' });
            return;
        }

        setIsLoadingAudio(true);
        try {
            const audio = await puter.ai.txt2speech(entry.content, { voice: 'Matthew' });
            audioPlayerRef.current = audio;
            audio.play();
            setIsPlaying(true);
            audio.onended = () => setIsPlaying(false);
        } catch (error) {
            console.error("Error generating audio:", error);
            toast({ variant: 'destructive', title: 'Audio Generation Failed' });
        } finally {
            setIsLoadingAudio(false);
        }
    };

    return (
        <Card className="bg-secondary/20">
            <CardHeader>
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl" title={MOODS[entry.mood].label}>{MOODS[entry.mood].emoji}</span>
                        <div className="flex flex-col">
                            <span className="font-semibold">{format((entry.date as any).toDate(), "p")}</span>
                        </div>
                    </div>
                     <Button
                        size="sm"
                        variant="outline"
                        onClick={handleListen}
                        disabled={isLoadingAudio}
                        className="shrink-0"
                    >
                        {isLoadingAudio ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isPlaying ? (
                            <StopCircle className="mr-2 h-4 w-4" />
                        ) : (
                            <PlayCircle className="mr-2 h-4 w-4" />
                        )}
                        {isPlaying ? 'Stop' : 'Listen'}
                    </Button>
                </div>
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
                {entry.audioUrl && (
                <div className="mt-2">
                    <audio src={entry.audioUrl} controls className="w-full" />
                </div>
                )}
                <p className="whitespace-pre-wrap text-base leading-relaxed break-words pt-2">{entry.content || <span className="italic text-muted-foreground">No text content for this entry.</span>}</p>
                {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center pt-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {entry.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
                )}
            </CardContent>
        </Card>
    );
}
