
"use client"

import { useMemo } from "react"
import { format, isYesterday } from "date-fns"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { CalendarClock } from "lucide-react"

interface YesterdaysReflectionProps {
  entries: JournalEntry[]
}

export function YesterdaysReflection({ entries }: YesterdaysReflectionProps) {
  const yesterdaysEntries = useMemo(() => {
    if (!entries || entries.length === 0) {
      return []
    }
    
    // The entries are now pre-sorted chronologically from the parent
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
                <Card key={entry.id} className="bg-secondary/30">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-xl">
                    <span>{format((entry.date as any).toDate(), "MMMM d, yyyy")}</span>
                    <span className="text-3xl">{MOODS[entry.mood].emoji}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {entry.imageUrl && (
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-4">
                        <Image src={entry.imageUrl} alt="AI-generated image for the entry" layout="fill" objectFit="cover" />
                      </div>
                    )}
                    {entry.audioUrl && (
                        <audio src={entry.audioUrl} controls className="w-full" />
                    )}
                    <p className="whitespace-pre-wrap">{entry.content}</p>
                </CardContent>
                </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
