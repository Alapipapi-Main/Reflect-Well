
"use client"

import { useMemo } from "react"
import { format, isSameDay, getYear } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { History, CalendarClock } from "lucide-react"

interface OnThisDayProps {
  entries: JournalEntry[]
}

export function OnThisDay({ entries }: OnThisDayProps) {
  const onThisDayEntries = useMemo(() => {
    if (!entries || entries.length === 0) {
      return []
    }
    const today = new Date()
    const currentYear = getYear(today)

    return entries.filter(entry => {
      if (!entry.date) return false
      const entryDate = (entry.date as any).toDate()
      // Check if it's the same month and day, but not the same year
      return (
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getDate() === today.getDate() &&
        getYear(entryDate) !== currentYear
      )
    }).sort((a, b) => (b.date as any).toDate().getTime() - (a.date as any).toDate().getTime()); // Sort most recent year first
  }, [entries])

  return (
    <Card>
      <CardHeader>
        <CardTitle>On This Day</CardTitle>
        <CardDescription>A look back at your memories from this day in previous years.</CardDescription>
      </CardHeader>
      <CardContent>
        {onThisDayEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <CalendarClock className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Memories Yet</h3>
            <p>When you have entries from this day in past years, they will appear here as a pleasant surprise.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {onThisDayEntries.map(entry => (
              <Card key={entry.id} className="bg-secondary/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>{format((entry.date as any).toDate(), "MMMM d, yyyy")}</span>
                    <span className="text-3xl">{MOODS[entry.mood].emoji}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
