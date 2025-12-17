

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Sparkles, Wand, Image as ImageIcon, Loader2, Mic, PlayCircle, Trash2 } from "lucide-react"
import { collection, serverTimestamp, doc } from "firebase/firestore"
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, setDocumentNonBlocking } from "@/firebase"
import { useEffect, useState, useCallback, useRef } from "react"
import { JournalFormFields } from "./journal-form-fields"
import Image from "next/image"

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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { MOODS } from "@/lib/constants"
import type { JournalEntry, Mood, UserSettings } from "@/lib/types"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"

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
  tags: z.string().optional(),
})

interface JournalFormProps {
  entries: JournalEntry[];
}

export function JournalForm({ entries }: JournalFormProps) {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'main');
  }, [user, firestore]);

  const { data: settings } = useDoc<UserSettings>(settingsDocRef);

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingPrompt, setIsGettingPrompt] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [activeEntry, setActiveEntry] = useState<{ id: string, content: string, mood: Mood } | null>(null)
  const [reflection, setReflection] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showReflectionDialog, setShowReflectionDialog] = useState(false)
  const [formKey, setFormKey] = useState(() => Date.now());

  const [inspirationPrompt, setInspirationPrompt] = useState<string | null>(null);
  const [showInspirationDialog, setShowInspirationDialog] = useState(false)

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [audioReflection, setAudioReflection] = useState<HTMLAudioElement | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const {
    startRecording,
    stopRecording,
    reset: resetRecorder,
    isRecording,
    isProcessing: isProcessingAudio,
    audioUrl,
    error: recorderError,
  } = useVoiceRecorder();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      tags: "",
    },
  })
  
  useEffect(() => {
    if (settings?.inspirationPrompt) {
      setInspirationPrompt(settings.inspirationPrompt);
    }
  }, [settings]);

  const entryContent = form.watch("content");

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
      // Fail silently, don't bother the user with a toast for this
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
      }, 1500); // 1.5-second debounce
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [entryContent, handleGenerateTags]);

  useEffect(() => {
    if (recorderError) {
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: recorderError,
      });
    }
  }, [recorderError, toast]);

  const resetDialogState = () => {
    setReflection(null);
    setImageUrl(null);
    setActiveEntry(null);
    setIsGeneratingImage(false);
    setAudioReflection(null);
    setIsGeneratingAudio(false);
  }

  const handleAiReflection = async (entry: { content: string }) => {
    if (typeof puter === 'undefined') {
      console.error("Puter.js is not loaded.");
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI reflection service could not be loaded.",
      });
      return;
    }

    // Set audio loading state
    setIsGeneratingAudio(true);

    const prompt = `You are a compassionate and insightful journaling companion. Your role is to provide a brief, gentle, and encouraging reflection on a user's journal entry.

You can either provide a warm, affirming statement or ask a soft, open-ended question that encourages deeper thought. Your response should feel like a supportive friend listening without judgment.

Keep your reflection to one or two sentences. Do not give advice.

Journal Entry:
"${entry.content}"`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      const reflectionText = aiResponse.message.content;
      setReflection(reflectionText);

      // Generate audio from the reflection text with a male voice
      const audio = await puter.ai.txt2speech(reflectionText, { voice: 'Matthew', engine: 'neural', language: 'en-US' });
      setAudioReflection(audio);

    } catch (error) {
      console.error("Error getting AI reflection or audio from Puter.ai:", error);
      toast({
        variant: "destructive",
        title: "AI Feature Failed",
        description: "Could not generate a reflection or audio for this entry.",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  }

  const handleAiImage = async () => {
    if (!activeEntry || !user || !firestore) return;

    if (typeof puter === 'undefined') {
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI image service could not be loaded.",
      });
      return;
    }

    setIsGeneratingImage(true);

    const moodLabel = MOODS[activeEntry.mood].label;
    const prompt = `Create a beautiful, abstract, and artistic image that visually represents the mood and themes of the following journal entry. The dominant mood is "${moodLabel}". The style should be ethereal, painterly, and evocative, not literal. Use a soft color palette that matches the mood.

Journal Entry:
"${activeEntry.content}"`;

    try {
      const imageElement = await puter.ai.txt2img(prompt, {});
      const generatedImageUrl = imageElement.src;
      setImageUrl(generatedImageUrl);

      // Save the image URL to the Firestore entry
      const entryRef = doc(firestore, 'users', user.uid, 'journalEntries', activeEntry.id);
      updateDocumentNonBlocking(entryRef, { imageUrl: generatedImageUrl });

      toast({
        title: "Image Generated!",
        description: "A cover image has been created and saved with your entry.",
      });

    } catch (error) {
      console.error("Error getting AI image from Puter.ai:", error);
      toast({
        variant: "destructive",
        title: "AI Image Failed",
        description: "Could not generate an image for this entry.",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (typeof puter === 'undefined' || !settingsDocRef) {
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI prompt service could not be loaded.",
      });
      return;
    }

    setIsGettingPrompt(true);

    const selectedMood = form.getValues("mood");
    const moodLabel = selectedMood ? MOODS[selectedMood as Mood].label : null;

    const moodContext = moodLabel 
      ? `The user is currently feeling ${moodLabel}. The prompt should be relevant to this mood. For example, if they are happy, ask what's bringing them joy. If they are sad, gently ask what's on their mind.`
      : 'The user has not selected a mood. The prompt should be general and open-ended.';

    const prompt = `You are an insightful and creative journaling assistant. Your task is to generate a single, open-ended, and thought-provoking journal prompt for a user.

The prompt should encourage self-reflection, mindfulness, or creativity. Avoid simple "yes/no" questions. Make it personal and gentle.

${moodContext}

Examples of good prompts:
- What is one thing you're proud of from the past week, no matter how small?
- Describe a place, real or imagined, where you feel completely at peace.
- If you could give your younger self one piece of advice, what would it be and why?
- What's a worry that's been on your mind, and what's a more compassionate way to look at it?
- Write about a sound, smell, or taste that brings back a strong memory.

Generate one new prompt for the user now.`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      const generatedPrompt = aiResponse.message.content;
      setDocumentNonBlocking(settingsDocRef, { inspirationPrompt: generatedPrompt }, { merge: true });
      setInspirationPrompt(generatedPrompt);
      setShowInspirationDialog(true);
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
    if (!user || !firestore || !settingsDocRef) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "You must be signed in to save an entry.",
      });
      return;
    }
    
    setIsSubmitting(true);
    resetDialogState();

    const tagsArray = values.tags 
      ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) 
      : [];

    // 1. Save the entry to Firestore
    const journalEntriesRef = collection(firestore, 'users', user.uid, 'journalEntries');
    const newDoc = await addDocumentNonBlocking(journalEntriesRef, {
      userId: user.uid,
      date: serverTimestamp(),
      mood: values.mood,
      content: values.content,
      imageUrl: null,
      audioUrl: audioUrl,
      tags: tagsArray,
    });

    if (newDoc) {
      setActiveEntry({ id: newDoc.id, content: values.content, mood: values.mood });
    }
    
    toast({
      title: "Entry Saved!",
      description: "Your journal entry has been saved.",
    });

    // 2. Trigger the AI reflection and show dialog
    await handleAiReflection(values);
    setShowReflectionDialog(true);
    
    // 3. Reset form and state
    setDocumentNonBlocking(settingsDocRef, { inspirationPrompt: null }, { merge: true });
    setInspirationPrompt(null);
    setIsSubmitting(false);
    setSuggestedTags([]);
    resetRecorder();
    form.reset({
      content: "",
      mood: undefined,
      tags: "",
    });
    setFormKey(Date.now());
  }

  const handleAddTag = (tag: string) => {
    const currentTags = form.getValues("tags") || "";
    const tagsArray = currentTags.split(',').map(t => t.trim()).filter(t => t);
    if (!tagsArray.includes(tag)) {
        const newTags = [...tagsArray, tag].join(', ');
        form.setValue("tags", newTags);
    }
  }

  const handleUseInspiration = () => {
    if (inspirationPrompt) {
      const currentContent = form.getValues("content");
      const newContent = currentContent 
        ? `${currentContent}\n\n${inspirationPrompt}` 
        : inspirationPrompt;
      form.setValue("content", newContent);
    }
    setShowInspirationDialog(false);
  }
  
  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearInspiration = () => {
    if (settingsDocRef) {
      setDocumentNonBlocking(settingsDocRef, { inspirationPrompt: null }, { merge: true });
    }
    setInspirationPrompt(null);
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
               {inspirationPrompt && (
                <div className="p-4 bg-secondary/30 border-l-4 border-primary rounded-r-lg space-y-2 relative">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Wand className="h-4 w-4" />
                    Your Inspired Prompt
                  </h4>
                  <p className="text-foreground/90 italic">"{inspirationPrompt}"</p>
                </div>
              )}
               {audioUrl && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Your Recorded Memo</h4>
                  <div className="flex items-center gap-2">
                    <audio src={audioUrl} controls className="w-full" />
                    <Button type="button" variant="ghost" size="icon" onClick={resetRecorder}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete recording</span>
                    </Button>
                  </div>
                </div>
              )}
              <JournalFormFields
                key={formKey} 
                isGenerating={isSubmitting}
                onGeneratePrompt={handleGeneratePrompt}
                isGettingPrompt={isGettingPrompt}
                isEditing={false}
                suggestedTags={suggestedTags}
                isSuggestingTags={isSuggestingTags && !isSubmitting}
                onAddTag={handleAddTag}
              />
            </CardContent>
            <CardFooter className="flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-2">
              <Button type="submit" disabled={isSubmitting || isGettingPrompt || isRecording || isProcessingAudio}>
                {isSubmitting ? (
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
              
               <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                onClick={handleVoiceButtonClick}
                disabled={isSubmitting || isGettingPrompt || isProcessingAudio}
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
                    Record Memo
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      {/* Reflection Dialog */}
      <AlertDialog open={showReflectionDialog} onOpenChange={(isOpen) => {
          if (!isOpen) {
            resetDialogState();
          }
          setShowReflectionDialog(isOpen);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              A Moment of Reflection
            </AlertDialogTitle>
            {imageUrl && (
              <div className="relative aspect-video w-full mt-4 rounded-lg overflow-hidden">
                <Image src={imageUrl} alt="AI-generated image representing the journal entry" layout="fill" objectFit="cover" />
              </div>
            )}
            <AlertDialogDescription className="text-base text-foreground pt-4">
              {reflection || <Loader2 className="h-5 w-5 animate-spin mx-auto" />}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-y-2">
             <div className="flex w-full gap-2 sm:w-auto">
               <Button 
                  onClick={handleAiImage} 
                  disabled={isGeneratingImage || !reflection || !!imageUrl}
                  variant="outline"
                  className="flex-1"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Visualizing...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {imageUrl ? 'Image Added' : 'Add Image'}
                    </>
                  )}
                </Button>
                <Button 
                    onClick={() => audioReflection?.play()} 
                    disabled={isGeneratingAudio || !audioReflection}
                    variant="outline"
                     className="flex-1"
                >
                    {isGeneratingAudio ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <PlayCircle className="h-4 w-4" />
                    )}
                    <span className="ml-2">Listen</span>
                </Button>
            </div>
            <AlertDialogAction onClick={() => setShowReflectionDialog(false)} className="w-full sm:w-auto">Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inspiration Prompt Dialog */}
      <AlertDialog open={showInspirationDialog} onOpenChange={setShowInspirationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wand className="text-primary" />
              Here's a little inspiration
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground pt-4">
              {isGettingPrompt ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                `"${inspirationPrompt}"`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowInspirationDialog(false)}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
