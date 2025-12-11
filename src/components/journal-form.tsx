"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Sparkles } from "lucide-react"
import { collection, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { useState } from "react"
import { getReflection } from "@/ai/flows/reflection-flow"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MOODS } from "@/lib/constants"
import type { Mood } from "@/lib/types"

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

export function JournalForm() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const [isGenerating, setIsGenerating] = useState(false)
  const [reflection, setReflection] = useState<string | null>(null)
  const [showReflectionDialog, setShowReflectionDialog] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "You must be signed in to save an entry.",
      });
      return;
    }

    // 1. Save the entry to Firestore
    const journalEntriesRef = collection(firestore, 'users', user.uid, 'journalEntries');
    addDocumentNonBlocking(journalEntriesRef, {
      userId: user.uid,
      date: serverTimestamp(),
      mood: values.mood,
      content: values.content,
    });
    
    toast({
      title: "Entry Saved!",
      description: "Your journal entry has been saved.",
    });

    // 2. Trigger the AI reflection
    setIsGenerating(true);
    try {
      const aiResponse = await getReflection({ entry: values.content });
      setReflection(aiResponse.reflection);
      setShowReflectionDialog(true);
    } catch (error) {
      console.error("Error getting AI reflection:", error);
      toast({
        variant: "destructive",
        title: "AI Reflection Failed",
        description: "Could not generate a reflection for this entry.",
      })
    } finally {
      setIsGenerating(false);
      form.reset();
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Today's Reflection</CardTitle>
          <CardDescription>What's on your mind today? Let it all out.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>How are you feeling?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {Object.keys(MOODS).map((moodKey) => {
                          const mood = MOODS[moodKey as Mood]
                          return (
                            <FormItem key={moodKey} className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={moodKey} id={moodKey} className="sr-only" />
                              </FormControl>
                              <FormLabel
                                htmlFor={moodKey}
                                className="text-4xl p-2 rounded-full cursor-pointer transition-all duration-200 ease-in-out ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                style={{
                                  filter: field.value === moodKey ? 'grayscale(0)' : 'grayscale(1)',
                                  transform: field.value === moodKey ? 'scale(1.2)' : 'scale(1)',
                                  opacity: field.value === moodKey ? 1 : 0.6,
                                }}
                              >
                                {mood.emoji}
                                <span className="sr-only">{mood.label}</span>
                              </FormLabel>
                            </FormItem>
                          )
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your journal entry</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell me about your day..."
                        rows={8}
                        {...field}
                        disabled={isGenerating}
                      />
                    </FormControl>
                    <FormDescription>
                      This is your private space. Feel free to be open and honest.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Saving & Reflecting...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Entry
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <AlertDialog open={showReflectionDialog} onOpenChange={setShowReflectionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              A Moment of Reflection
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground pt-4">
              {reflection}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowReflectionDialog(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
