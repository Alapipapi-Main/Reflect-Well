"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { format } from "date-fns"
import { CalendarDays } from "lucide-react"

interface PastEntriesProps {
  entries: JournalEntry[]
}

export function PastEntries({ entries }: PastEntriesProps) {
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal History</CardTitle>
        <CardDescription>A look back at your thoughts and feelings.</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedEntries.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {sortedEntries.map((entry) => (
              <AccordionItem value={entry.id} key={entry.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-4 text-lg">
                    <span className="text-3xl">{MOODS[entry.mood].emoji}</span>
                    <span>{format(new Date(entry.date), "MMMM d, yyyy")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed whitespace-pre-wrap px-2">
                  {entry.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <CalendarDays className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Entries Yet</h3>
            <p>Your past journal entries will appear here once you add them.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
