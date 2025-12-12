
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

import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { format } from "date-fns"
import { CalendarDays, Edit, Trash2, Search } from "lucide-react"
import { JournalFormFields } from "@/components/journal-form-fields"
import { useToast } from "@/hooks/use-toast"

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

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.date ? (a.date as any).toDate() : new Date(0)
    const dateB = b.date ? (b.date as any).toDate() : new Date(0)
    return dateB.getTime() - dateA.getTime()
  })

  const filteredEntries = sortedEntries.filter(entry => 
    entry.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Input 
            placeholder="Search your entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-6"
          />
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
                <p>We couldn't find any journal entries that match your search.</p>
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
 
    
