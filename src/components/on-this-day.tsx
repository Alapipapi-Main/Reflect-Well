
"use client"

import { useMemo } from "react"
import { format, subMonths } from "date-fns"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { Clock } from "lucide-react"

interface OnThisDayProps {
  entries: JournalEntry[]
}

export function OnThisDay({ entries }: OnThisDayProps) {
  const memories = useMemo(() => {
    if (!entries || entries.length === 0) {
      return []
    }

    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()

    const lastMonthDate = subMonths(today, 1);
    const lastMonthDay = lastMonthDate.getDate();
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    // The entries are now pre-sorted chronologically from the parent
    const filtered = entries.filter(entry => {
      if (!entry.date) return false
      const entryDate = (entry.date as any).toDate()
      
      // Don't show today's entry
      if (format(today, 'yyyy-MM-dd') === format(entryDate, 'yyyy-MM-dd')) {
        return false;
      }

      const entryDay = entryDate.getDate()
      const entryMonth = entryDate.getMonth()
      const entryYear = entryDate.getFullYear()
      
      // Condition for same day, same month, past years
      const isPastYearMemory = entryDay === currentDay && entryMonth === currentMonth;

      // Condition for same day, previous month
      const isPastMonthMemory = entryDay === lastMonthDay && entryMonth === lastMonth && entryYear === lastMonthYear;

      return isPastYearMemory || isPastMonthMemory;
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
        <CardTitle>On This Day</CardTitle>
        <CardDescription>A look back at entries from this day last month and in past years.</CardDescription>
      </CardHeader>
      <CardContent>
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <Clock className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Memories Yet</h3>
            <p>Entries you write on this day will appear here in the future.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {memories.map(entry => (
                <Card key={entry.id} className="bg-secondary/30">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-xl">
                    <span>{format((entry.date as any).toDate(), "MMMM d, yyyy")}</span>
                    <span className="text-3xl">{MOODS[entry.mood].emoji}</span>
                    </CardTitle>
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
