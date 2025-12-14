
"use client"

import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

import type { JournalEntry, Mood } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { format, isSameDay } from "date-fns"
import { CalendarIcon, CalendarDays, Edit, Trash2, Search, XIcon } from "lucide-react"
import { JournalFormFields } from "@/components/journal-form-fields"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PastEntriesProps {
  entries: JournalEntry[]
}

const formSchema = z.object({
  content: z.string().min(10, {
    message: "Journal entry must be at least 10 characters.",
  }).max(5000, {
    message: "Journal entry must not exceed 5000 characters.",
  }),
  mood: z.enum(["ecstatic", "happy", "neutral", "sad", "angry"], {
    required_error: "You need to select a mood.",
  }),
})

export function PastEntries({ entries }: PastEntriesProps) {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null)
  const [dateFilter, setDateFilter] = useState<Date | null>(null)

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.date ? (a.date as any).toDate() : new Date(0)
    const dateB = b.date ? (b.date as any).toDate() : new Date(0)
    return dateB.getTime() - dateA.getTime()
  })

  const filteredEntries = sortedEntries.filter(entry => {
    const entryDate = entry.date ? (entry.date as any).toDate() : null
    const matchesSearchTerm = entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMoodFilter = moodFilter ? entry.mood === moodFilter : true
    const matchesDateFilter = dateFilter && entryDate ? isSameDay(entryDate, dateFilter) : true
    return matchesSearchTerm && matchesMoodFilter && matchesDateFilter
  });

  const handleEditClick = (event: React.MouseEvent, entryId: string) => {
    event.stopPropagation()
    setEditingEntryId(entryId === editingEntryId ? null : entryId)
  }

  const handleDeleteClick = (event: React.MouseEvent, entryId: string) => {
    event.stopPropagation()
    setDeleteCandidateId(entryId)
  }

  const confirmDelete = () => {
    if (!user || !firestore || !deleteCandidateId) return

    const entryRef = doc(firestore, 'users', user.uid, 'journalEntries', deleteCandidateId)
    deleteDocumentNonBlocking(entryRef)

    toast({
      title: "Entry Deleted",
      description: "Your journal entry has been removed.",
    })
    setDeleteCandidateId(null)
  }

  const handleUpdate = (entryId: string, values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return

    const entryRef = doc(firestore, 'users', user.uid, 'journalEntries', entryId)
    updateDocumentNonBlocking(entryRef, {
      content: values.content,
      mood: values.mood,
    })

    toast({
      title: "Entry Updated",
      description: "Your changes have been saved.",
    })
    setEditingEntryId(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Journal History</CardTitle>
          <CardDescription>A look back at your thoughts and feelings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search your entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal",
                      !dateFilter && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter || undefined}
                    onSelect={(date) => setDateFilter(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
               {dateFilter && (
                <Button variant="ghost" size="icon" onClick={() => setDateFilter(null)}>
                  <XIcon className="h-5 w-5" />
                  <span className="sr-only">Clear date filter</span>
                </Button>
              )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by mood:</span>
              <div className="flex flex-wrap gap-2">
                {Object.keys(MOODS).map((moodKey) => {
                  const mood = MOODS[moodKey as Mood]
                  return (
                    <button
                      key={moodKey}
                      onClick={() => setMoodFilter(moodFilter === moodKey as Mood ? null : moodKey as Mood)}
                      className={cn(
                        "text-2xl p-1 rounded-full transition-all duration-200 ease-in-out",
                        moodFilter === moodKey ? 'grayscale-0 scale-110' : 'grayscale-100 opacity-60 hover:opacity-100 hover:grayscale-0'
                      )}
                      title={`Filter by ${mood.label}`}
                    >
                      {mood.emoji}
                      <span className="sr-only">Filter by {mood.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          {sortedEntries.length > 0 ? (
            filteredEntries.length > 0 ? (
            <Accordion type="single" collapsible className="w-full"
              value={editingEntryId || undefined}
              onValueChange={(value) => {
                if (editingEntryId && value !== editingEntryId) {
                  setEditingEntryId(value)
                }
              }}
            >
              {filteredEntries.map((entry) => (
                <AccordionItem value={entry.id} key={entry.id}>
                    {entry.imageUrl && (
                      <div className="relative aspect-video w-full rounded-t-lg overflow-hidden mb-2">
                        <Image src={entry.imageUrl} alt="AI-generated image for the entry" layout="fill" objectFit="cover" />
                      </div>
                    )}
                  <div className="flex items-center w-full">
                    <AccordionTrigger>
                      <div className="flex items-center gap-4 text-lg">
                        <span className="text-3xl">{MOODS[entry.mood].emoji}</span>
                        <span>{format(entry.date ? (entry.date as any).toDate() : new Date(), "MMMM d, yyyy")}</span>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 pr-4 pl-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEditClick(e, entry.id)}
                          aria-label="Edit entry"
                        >
                          <Edit className={`h-5 w-5 ${editingEntryId === entry.id ? 'text-primary' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteClick(e, entry.id)}
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-5 w-5 text-destructive/80 hover:text-destructive dark:text-red-400 dark:hover:text-red-300" />
                        </Button>
                      </div>
                  </div>
                  <AccordionContent className="text-base leading-relaxed whitespace-pre-wrap px-2">
                    {editingEntryId === entry.id ? (
                      <EditJournalForm 
                        entry={entry} 
                        onSave={(values) => handleUpdate(entry.id, values)} 
                        onCancel={() => setEditingEntryId(null)}
                      />
                    ) : (
                      entry.content
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Search className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Matching Entries</h3>
                <p>We couldn't find any journal entries that match your search or filter criteria.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <CalendarDays className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Entries Yet</h3>
              <p>Your past journal entries will appear here once you add them.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!deleteCandidateId} onOpenChange={(open) => !open && setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your journal entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCandidateId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-red-700 dark:hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface EditJournalFormProps {
  entry: JournalEntry
  onSave: (values: z.infer<typeof formSchema>) => void
  onCancel: () => void
}

function EditJournalForm({ entry, onSave, onCancel }: EditJournalFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: entry.content,
      mood: entry.mood,
    },
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 pt-4">
        <JournalFormFields />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </FormProvider>
  )
}
 
    

    