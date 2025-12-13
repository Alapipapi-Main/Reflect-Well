
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Sparkles, Wand } from "lucide-react"
import { collection, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { useState } from "react"
import { JournalFormFields } from "./journal-form-fields"

import { Button } from "@/components/ui/button"
import {
  Form,
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
import { useToast } from "@/hooks/use-toast"

declare const puter: any;

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
  const [isGettingPrompt, setIsGettingPrompt] = useState(false)
  const [reflection, setReflection] = useState<string | null>(null)
  const [showReflectionDialog, setShowReflectionDialog] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  })

  const handleAiReflection = async (entryText: string) => {
    if (typeof puter === 'undefined') {
      console.error("Puter.js is not loaded.");
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI reflection service could not be loaded.",
      });
      return;
    }

    const prompt = `You are a compassionate and insightful journaling companion. Your role is to provide a brief, gentle, and encouraging reflection on a user's journal entry.

You can either provide a warm, affirming statement or ask a soft, open-ended question that encourages deeper thought. Your response should feel like a supportive friend listening without judgment.

Keep your reflection to one or two sentences. Do not give advice.

Journal Entry:
"${entryText}"`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      setReflection(aiResponse.message.content);
      setShowReflectionDialog(true);
    } catch (error) {
      console.error("Error getting AI reflection from Puter.ai:", error);
      toast({
        variant: "destructive",
        title: "AI Reflection Failed",
        description: "Could not generate a reflection for this entry.",
      });
    }
  }

  const handleGeneratePrompt = async () => {
    if (typeof puter === 'undefined') {
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI prompt service could not be loaded.",
      });
      return;
    }

    setIsGettingPrompt(true);

    const prompt = `You are an insightful and creative journaling assistant. Your task is to generate a single, open-ended, and thought-provoking journal prompt for a user.

The prompt should encourage self-reflection, mindfulness, or creativity. Avoid simple "yes/no" questions. Make it personal and gentle.

Examples:
- What is one thing you're proud of from the past week, no matter how small?
- Describe a place, real or imagined, where you feel completely at peace.
- If you could give your younger self one piece of advice, what would it be and why?
- What's a worry that's been on your mind, and what's a more compassionate way to look at it?
- Write about a sound, smell, or taste that brings back a strong memory.

Generate one new prompt now.`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      const generatedPrompt = aiResponse.message.content;
      form.setValue("content", generatedPrompt);
      toast({
        title: "Prompt Generated!",
        description: "A new prompt has been added to your entry.",
      });
    } catch (error) {
      console.error("Error getting AI prompt from Puter.ai:", error);
      toast({
        variant: "destructive",
        title: "AI Prompt Failed",
        description: "Could not generate a prompt at this time.",
      });
    } finally {
      setIsGettingPrompt(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "You must be signed in to save an entry.",
      });
      return;
    }
    
    setIsGenerating(true);

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
    await handleAiReflection(values.content);

    // 3. Reset form and state
    setIsGenerating(false);
    form.reset();
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
              <JournalFormFields 
                isGenerating={isGenerating || isGettingPrompt} 
                onGeneratePrompt={handleGeneratePrompt}
                isGettingPrompt={isGettingPrompt}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGenerating || isGettingPrompt}>
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
