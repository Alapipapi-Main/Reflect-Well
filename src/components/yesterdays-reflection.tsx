
"use client"

import { useMemo } from "react"
import { format, isYesterday } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { CalendarClock } from "lucide-react"

interface YesterdaysReflectionProps {
  entries: JournalEntry[]
}

export function YesterdaysReflection({ entries }: YesterdaysReflectionProps) {
  const yesterdaysEntry = useMemo(() => {
    if (!entries || entries.length === 0) {
      return null
    }
    
    // Find the first entry that was from yesterday
    return entries.find(entry => {
      if (!entry.date) return false
      const entryDate = (entry.date as any).toDate()
      return isYesterday(entryDate)
    })
  }, [entries])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yesterday's Reflection</CardTitle>
        <CardDescription>A look back at how you were feeling yesterday.</CardDescription>
      </CardHeader>
      <CardContent>
        {!yesterdaysEntry ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <CalendarClock className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Entry From Yesterday</h3>
            <p>If you wrote an entry yesterday, it would appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card key={yesterdaysEntry.id} className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  <span>{format((yesterdaysEntry.date as any).toDate(), "MMMM d, yyyy")}</span>
                  <span className="text-3xl">{MOODS[yesterdaysEntry.mood].emoji}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{yesterdaysEntry.content}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
