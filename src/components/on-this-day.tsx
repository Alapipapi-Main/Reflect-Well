

"use client"

import { useMemo, useState } from "react"
import { format, subMonths } from "date-fns"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { Clock, Tag } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

interface OnThisDayProps {
  entries: JournalEntry[]
}

const ENTRIES_PER_PAGE = 3;

export function OnThisDay({ entries }: OnThisDayProps) {
  const [currentPage, setCurrentPage] = useState(1);

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
        return dateB.getTime() - dateA.getTime();
    });
  }, [entries]);

  const totalPages = Math.ceil(memories.length / ENTRIES_PER_PAGE);
  const paginatedMemories = memories.slice(
    (currentPage - 1) * ENTRIES_PER_PAGE,
    currentPage * ENTRIES_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(p - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(p => Math.min(p + 1, totalPages));
  };

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
            {paginatedMemories.map(entry => (
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
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-muted-foreground">{format((entry.date as any).toDate(), 'p')}</span>
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
            ))}
          </div>
        )}
      </CardContent>
       {totalPages > 1 && (
        <CardFooter className="flex justify-between items-center">
          <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline">
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline">
            Next
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
