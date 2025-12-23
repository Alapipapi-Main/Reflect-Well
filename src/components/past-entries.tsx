

"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CustomCalendar, type DateRange } from "@/components/custom-calendar"
import { Badge } from "@/components/ui/badge"

import type { JournalEntry, Mood } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { CalendarIcon, CalendarDays, Edit, Trash2, Search, XIcon, Tag, Mic, Loader2, MessageSquareQuote, PlayCircle, StopCircle } from "lucide-react"
import { JournalFormFields } from "./journal-form-fields"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"

declare const puter: any;

interface PastEntriesProps {
  entries: JournalEntry[];
  isFormSubmitting: boolean;
}

const ENTRIES_PER_PAGE = 5;

const formSchema = z.object({
  content: z.string().min(10, {
    message: "Journal entry must be at least 10 characters.",
  }).max(5000, {
    message: "Journal entry must not exceed 5000 characters.",
  }),
  mood: z.enum(["ecstatic", "happy", "neutral", "sad", "angry"], {
    required_error: "You need to select a mood.",
  }),
  tags: z.string().optional(),
})

export function PastEntries({ entries, isFormSubmitting }: PastEntriesProps) {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedEntries = useMemo(() => [...entries].sort((a, b) => {
    const dateA = a.date ? (a.date as any).toDate() : new Date(0)
    const dateB = b.date ? (b.date as any).toDate() : new Date(0)
    return dateB.getTime() - dateA.getTime()
  }), [entries]);

  const filteredEntries = useMemo(() => sortedEntries.filter(entry => {
    const entryDate = entry.date ? (entry.date as any).toDate() : null
    const content = entry.content || "";
    const tags = entry.tags || [];
    const voiceMemoContext = entry.audioUrl ? "voice memo" : "";
    const searchString = `${content} ${tags.join(' ')} ${voiceMemoContext}`.toLowerCase();

    const matchesSearchTerm = searchString.includes(searchTerm.toLowerCase());
    const matchesMoodFilter = moodFilter ? entry.mood === moodFilter : true
    const matchesDateFilter = () => {
        if (!dateRange.from || !entryDate) return true;
        const toDate = dateRange.to || dateRange.from;
        return isWithinInterval(entryDate, { start: startOfDay(dateRange.from), end: endOfDay(toDate) });
    };
    return matchesSearchTerm && matchesMoodFilter && matchesDateFilter()
  }), [sortedEntries, searchTerm, moodFilter, dateRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, moodFilter, dateRange]);

  const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ENTRIES_PER_PAGE,
    currentPage * ENTRIES_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(p - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(p => Math.min(p + 1, totalPages));
  };

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

  const handleUpdate = (entryId: string, values: z.infer<typeof formSchema>, audioUrl?: string | null) => {
    if (!user || !firestore) return

    const tagsArray = values.tags 
    ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) 
    : [];

    const dataToUpdate: Partial<JournalEntry> = {
      content: values.content,
      mood: values.mood,
      tags: tagsArray,
      audioUrl: audioUrl, // Always update audioUrl, even if it's null
    };

    const entryRef = doc(firestore, 'users', user.uid, 'journalEntries', entryId)
    updateDocumentNonBlocking(entryRef, dataToUpdate)

    toast({
      title: "Entry Updated",
      description: "Your changes have been saved.",
    })
    setEditingEntryId(null)
  }
  
  const handleDateRangeSelect = (range: DateRange) => {
      setDateRange(range);
      if (range.from && range.to) {
          setIsCalendarOpen(false);
      }
  }

  const clearDateFilter = () => {
    setDateRange({ from: null, to: null });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Journal History</CardTitle>
          <CardDescription>A look back at your thoughts and feelings.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search your entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
               <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL d, y")} - {format(dateRange.to, "LLL d, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL d, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <CustomCalendar
                    selectionMode="range"
                    onDateRangeSelect={handleDateRangeSelect}
                    selectedRange={dateRange}
                  />
                </PopoverContent>
              </Popover>
               {dateRange.from && (
                <Button variant="ghost" size="icon" onClick={clearDateFilter}>
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
                      <span className="sr-only">Filter by ${mood.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          {entries.length > 0 ? (
            paginatedEntries.length > 0 ? (
            <Accordion type="single" collapsible className="w-full"
              value={editingEntryId || undefined}
              onValueChange={(value) => {
                if (editingEntryId && value !== editingEntryId) {
                  setEditingEntryId(value)
                }
              }}
            >
              {paginatedEntries.map((entry) => (
                <AccordionItem value={entry.id} key={entry.id}>
                  <div className="flex items-center w-full">
                    <AccordionTrigger>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-left">
                        <span className="text-3xl">{MOODS[entry.mood].emoji}</span>
                        <div className="flex flex-col">
                            <span className="font-semibold text-base">{format(entry.date ? (entry.date as any).toDate() : new Date(), "MMMM d, yyyy")}</span>
                            <span className="text-sm text-muted-foreground font-normal">{format(entry.date ? (entry.date as any).toDate() : new Date(), "p")}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 pr-4 pl-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEditClick(e, entry.id)}
                          aria-label="Edit entry"
                          disabled={isFormSubmitting}
                        >
                          <Edit className={`h-5 w-5 ${editingEntryId === entry.id ? 'text-primary' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteClick(e, entry.id)}
                          aria-label="Delete entry"
                          disabled={isFormSubmitting}
                        >
                          <Trash2 className="h-5 w-5 text-destructive/80 hover:text-destructive dark:text-red-500 dark:hover:text-red-400" />
                        </Button>
                      </div>
                  </div>
                  <AccordionContent className="text-base leading-relaxed whitespace-pre-wrap px-2">
                    {editingEntryId === entry.id ? (
                      <EditJournalForm 
                        entry={entry} 
                        onSave={(values, audioUrl) => handleUpdate(entry.id, values, audioUrl)} 
                        onCancel={() => setEditingEntryId(null)}
                      />
                    ) : (
                       <ViewJournalContent entry={entry} />
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
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-red-900 dark:text-red-50 dark:hover:bg-red-800">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ViewJournalContent({ entry }: { entry: JournalEntry }) {
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={handleListen}
          disabled={isLoadingAudio}
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

      {entry.videoUrl && (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary">
          <video src={entry.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        </div>
      )}
      {entry.imageUrl && !entry.videoUrl && (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
          <Image src={entry.imageUrl} alt="AI-generated image for the entry" fill objectFit="cover" />
        </div>
      )}
      {entry.audioUrl && (
        <audio src={entry.audioUrl} controls className="w-full" />
      )}
      <p className="whitespace-pre-wrap break-words">{entry.content || <span className="text-muted-foreground italic">No text content for this entry.</span>}</p>
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {entry.tags.map(tag => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}


interface EditJournalFormProps {
  entry: JournalEntry
  onSave: (values: z.infer<typeof formSchema>, audioUrl: string | null) => void
  onCancel: () => void
}

function EditJournalForm({ entry, onSave, onCancel }: EditJournalFormProps) {
  const { toast } = useToast();
  const { user, firestore } = useUserAndFirestore();
  const [currentAudioUrl, setCurrentAudioUrl] = useState(entry.audioUrl || null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const {
    startRecording,
    stopRecording,
    reset: resetRecorder,
    isRecording,
    isProcessing: isProcessingAudio,
    audioUrl: newAudioUrl,
    error: recorderError,
  } = useVoiceRecorder();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: entry.content || '',
      mood: entry.mood,
      tags: entry.tags ? entry.tags.join(', ') : '',
    },
  });

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const entryContent = form.watch("content");

  useEffect(() => {
    if (newAudioUrl) {
      setCurrentAudioUrl(newAudioUrl);
      resetRecorder(); // Clear the hook's state after we've captured the URL
    }
  }, [newAudioUrl, resetRecorder]);

  useEffect(() => {
    if (recorderError) {
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: recorderError,
      });
    }
  }, [recorderError, toast]);

  const handleGenerateTags = useCallback(async (content: string) => {
    if (typeof puter === 'undefined' || content.length < 20) {
      setSuggestedTags([]);
      return;
    }

    setIsSuggestingTags(true);

    const prompt = `You are an AI assistant that suggests relevant tags for a journal entry.
Analyze the following journal entry and return a short, comma-separated list of 3-5 relevant, single-word tags in lowercase.
Do not provide any explanation, only the tags.

Example:
Entry: "Had a great day at work, my presentation went really well. Feeling proud of myself. Then I went to the gym."
Response: work, success, proud, fitness

Journal Entry:
"${content}"`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      const tags = aiResponse.message.content
        .split(',')
        .map((tag: string) => tag.trim().toLowerCase())
        .filter((tag: string) => tag);
      setSuggestedTags(tags);
    } catch (error) {
      console.error("Error generating AI tags from Puter.ai:", error);
    } finally {
      setIsSuggestingTags(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (entryContent && entryContent.length > 20) {
      debounceTimeoutRef.current = setTimeout(() => {
        handleGenerateTags(entryContent);
      }, 1500);
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [entryContent, handleGenerateTags]);

  const handleAddTag = (tag: string) => {
    const currentTags = form.getValues("tags") || "";
    const tagsArray = currentTags.split(',').map(t => t.trim()).filter(t => t);
    if (!tagsArray.includes(tag)) {
        const newTags = [...tagsArray, tag].join(', ');
        form.setValue("tags", newTags);
    }
  };

  const handleTranscribe = async () => {
    if (!currentAudioUrl) {
      toast({ variant: 'destructive', title: 'No audio memo to transcribe.' });
      return;
    }
    if (typeof puter === 'undefined') {
        toast({ variant: 'destructive', title: 'AI not available' });
        return;
    }

    setIsTranscribing(true);
    try {
      const transcriptionResult = await puter.ai.speech2txt(currentAudioUrl);
      const transcriptionText = transcriptionResult.text;
      
      const currentContent = form.getValues("content");
      const newContent = `${currentContent}\n\n---\n\n**Voice Memo Transcription:**\n*${transcriptionText}*`;
      form.setValue("content", newContent);

      toast({ title: 'Transcription Added', description: 'The voice memo transcription has been added to your entry content.' });
    } catch (err) {
      console.error("Transcription failed:", err);
      toast({ variant: 'destructive', title: 'Transcription Failed', description: 'Could not transcribe the voice memo at this time.' });
    } finally {
      setIsTranscribing(false);
    }
  };


  const handleDeleteMemo = () => {
    setCurrentAudioUrl(null);
  };

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values, currentAudioUrl);
  };

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const hasTranscription = useMemo(() => {
      return entry.content?.includes('**Voice Memo Transcription:**');
  }, [entry.content]);


  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
        {currentAudioUrl && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Voice Memo</h4>
            <div className="flex items-center gap-2">
              <audio src={currentAudioUrl} controls className="w-full" />
              <Button type="button" variant="ghost" size="icon" onClick={handleDeleteMemo}>
                <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive dark:text-red-500 dark:hover:text-red-400" />
                <span className="sr-only">Delete memo</span>
              </Button>
            </div>
             {!hasTranscription && (
                 <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                 >
                    {isTranscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquareQuote className="mr-2 h-4 w-4" />}
                     Transcribe Memo
                 </Button>
            )}
          </div>
        )}
        <JournalFormFields 
          isEditing={true}
          suggestedTags={suggestedTags}
          isSuggestingTags={isSuggestingTags}
          onAddTag={handleAddTag}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-4">
           <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              onClick={handleVoiceButtonClick}
              disabled={isProcessingAudio}
              className="w-full sm:w-auto"
            >
              {isRecording ? (
                <>
                  <Mic className="mr-2 h-4 w-4 animate-pulse" />
                  Recording...
                </>
              ) : isProcessingAudio ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  {currentAudioUrl ? 'Re-record' : 'Record Memo'}
                </>
              )}
            </Button>
          <div className="flex justify-end gap-2 w-full sm:w-auto">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

function useUserAndFirestore() {
    const { user } = useUser();
    const firestore = useFirestore();
    return { user, firestore };
}
