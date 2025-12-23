

"use client"

import { useMemo, useState, useRef } from "react"
import { format, isYesterday } from "date-fns"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { CalendarClock, Tag, PlayCircle, Loader2, StopCircle } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { useToast } from "@/hooks/use-toast"

declare const puter: any;

interface YesterdaysReflectionProps {
  entries: JournalEntry[]
}

export function YesterdaysReflection({ entries }: YesterdaysReflectionProps) {
  const yesterdaysEntries = useMemo(() => {
    if (!entries || entries.length === 0) {
      return []
    }
    
    const filtered = entries.filter(entry => {
      if (!entry.date) return false
      const entryDate = (entry.date as any).toDate()
      return isYesterday(entryDate)
    });

    return filtered.sort((a, b) => {
        const dateA = a.date ? (a.date as any).toDate() : new Date(0);
        const dateB = b.date ? (b.date as any).toDate() : new Date(0);
        return dateA.getTime() - dateB.getTime();
    });

  }, [entries])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yesterday's Reflection</CardTitle>
        <CardDescription>A look back at how you were feeling yesterday.</CardDescription>
      </CardHeader>
      <CardContent>
        {yesterdaysEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <CalendarClock className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Entry From Yesterday</h3>
            <p>If you wrote an entry yesterday, it would appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {yesterdaysEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
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
        <Card className="bg-secondary/30">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{MOODS[entry.mood].emoji}</span>
                         <div className="flex flex-col">
                            <span className="font-semibold text-base">{format((entry.date as any).toDate(), "MMMM d, yyyy")}</span>
                            <span className="text-sm text-muted-foreground font-normal">{format((entry.date as any).toDate(), "p")}</span>
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
            <CardContent className="space-y-4">
                {entry.videoUrl && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary">
                        <video src={entry.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    </div>
                )}
                {entry.imageUrl && !entry.videoUrl && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-4">
                    <Image src={entry.imageUrl} alt="AI-generated image for the entry" layout="fill" objectFit="cover" />
                    </div>
                )}
                {entry.audioUrl && (
                    <div className="mt-2">
                    <audio src={entry.audioUrl} controls className="w-full" />
                    </div>
                )}
                <p className="whitespace-pre-wrap">{entry.content}</p>
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
