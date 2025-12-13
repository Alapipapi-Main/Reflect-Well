
"use client"

import { useMemo } from "react"
import { format, subDays, isSameDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { History } from "lucide-react"

interface OnThisDayProps {
  entries: JournalEntry[]
}

export function OnThisDay({ entries }: OnThisDayProps) {
  const yesterdayEntries = useMemo(() => {
    if (!entries || entries.length === 0) {
      return []
    }
    const yesterday = subDays(new Date(), 1)

    return entries.filter(entry => {
      if (!entry.date) return false
      const entryDate = (entry.date as any).toDate()
      return isSameDay(entryDate, yesterday)
    })
  }, [entries])

  if (yesterdayEntries.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
        <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2">
            <History className="text-primary" />
            Yesterday's Reflection
        </h2>
      {yesterdayEntries.map(entry => (
        <Card key={entry.id} className="mb-4 bg-secondary/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl">
              <span>{format( (entry.date as any).toDate(), "MMMM d, yyyy")}</span>
              <span className="text-3xl">{MOODS[entry.mood].emoji}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{entry.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
