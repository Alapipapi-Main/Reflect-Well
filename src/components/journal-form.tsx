
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Sparkles, Wand, Image as ImageIcon, Loader2, Mic, PlayCircle, Trash2, X, Film, Eye, FileText } from "lucide-react"
import { collection, serverTimestamp, doc } from "firebase/firestore"
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, setDocumentNonBlocking, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useToast } from "@/hooks/use-toast"
import { MOODS } from "@/lib/constants"
import type { JournalEntry, Mood, UserSettings, JournalTemplate } from "@/lib/types"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import { AiCompanionThought } from "./ai-companion-thought"
import { format } from "date-fns"

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
  entries?: JournalEntry[]; // Make entries optional
  onSubmittingChange: (isSubmitting: boolean) => void;
  externalImageUrl?: string | null;
  formContext?: {
    title: string;
    description: string;
  };
  onSave?: () => void;
  templates?: JournalTemplate[];
}

export function JournalForm({ 
    entries = [],
    onSubmittingChange,
    externalImageUrl,
    formContext,
    onSave,
    templates = [],
 }: JournalFormProps) {
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
  const [activeEntry, setActiveEntry] = useState<{ id: string; content: string; mood: Mood, imageUrl: string | null } | null>(null)
  const [reflection, setReflection] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [showReflectionDialog, setShowReflectionDialog] = useState(false)
  const [formKey, setFormKey] = useState(() => Date.now());

  const [inspirationPrompt, setInspirationPrompt] = useState<string | null>(null);
  const [showInspirationDialog, setShowInspirationDialog] = useState(false)

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [audioReflection, setAudioReflection] = useState<HTMLAudioElement | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const [isCompanionLoading, setIsCompanionLoading] = useState(false);
  const [companionThought, setCompanionThought] = useState<string | null>(null);
  const [showCompanionDialog, setShowCompanionDialog] = useState(false);

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

  // Effect to handle external image URL
  useEffect(() => {
    if (externalImageUrl) {
        setImageUrl(externalImageUrl);
    }
  }, [externalImageUrl]);
  
  useEffect(() => {
    if (settings?.inspirationPrompt) {
      setInspirationPrompt(settings.inspirationPrompt);
    }
  }, [settings]);

  useEffect(() => {
    onSubmittingChange(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const entryContent = form.watch("content");
  const mood = form.watch("mood");

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
  
  const isGenerating = isGeneratingVideo || isGeneratingAudio || isCompanionLoading;

  const resetDialogState = () => {
    setReflection(null);
    setActiveEntry(null);
    setVideoUrl(null);
    setIsGeneratingVideo(false);
  }

  const handleAiReflection = async (entry: { content: string, audioUrl?: string | null }) => {
    if (typeof puter === 'undefined') {
      console.error("Puter.js is not loaded.");
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI reflection service could not be loaded.",
      });
      return;
    }

    setIsGeneratingAudio(true);

    const recentEntries = [...entries]
        .sort((a, b) => (b.date as any).toDate().getTime() - (a.date as any).toDate().getTime())
        .slice(0, 3);
        
    const history = recentEntries.map(e => {
        const date = format((e.date as any).toDate(), "MMMM d, yyyy");
        const mood = MOODS[e.mood].label;
        return `On ${date}, I felt ${mood} and wrote: "${e.content}"`;
    }).join("\n\n");

    const voiceMemoContext = entry.audioUrl ? "Note: The user has also attached a voice memo to this new entry. You don't have access to the audio content, but you can acknowledge its presence." : "";

    const prompt = `You are a compassionate and insightful journaling companion. Your role is to provide a brief, gentle, and encouraging reflection on a user's newest journal entry, keeping their recent history in mind.

- Your tone should be warm and encouraging, like a supportive friend.
- Briefly review the user's recent journal history for context.
- Read the user's newest entry.
- Your reflection should be 1-2 sentences. It can be an affirming statement or a soft, open-ended question.
- If you notice a connection, a contrast, or a recurring theme between the new entry and the past entries, gently point it out. For example: "It's lovely to see you writing about joy again after a tough week." or "This feeling of uncertainty seems to be a recurring theme for you lately. What does it feel like in this specific moment?"
- If there's no strong connection, just focus on the current entry.
- Do not give advice or pass judgment.

**Recent Journal History:**
${history || "No recent history available."}

**User's Newest Entry:**
"${entry.content}"
${voiceMemoContext}`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      const reflectionText = aiResponse.message.content;
      setReflection(reflectionText);

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
    if (typeof puter === 'undefined') {
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI image service could not be loaded.",
      });
      return;
    }

    const content = form.getValues('content');
    const moodValue = form.getValues('mood');

    if (!content || !moodValue) {
      toast({
        variant: "destructive",
        title: "Content & Mood Required",
        description: "Please write an entry and select a mood before generating art.",
      });
      return;
    }

    setIsGeneratingImage(true);

    const moodLabel = MOODS[moodValue as Mood].label;
    const prompt = `Create a beautiful, abstract, and artistic image that visually represents the mood and themes of the following journal entry. The dominant mood is "${moodLabel}". The style should be ethereal, painterly, and evocative, not literal. Use a soft color palette that matches the mood.

Journal Entry:
"${content}"`;

    try {
      const imageElement = await puter.ai.txt2img(prompt, {});
      setImageUrl(imageElement.src);
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

  const handleAiVideo = async () => {
    if (!activeEntry || !user || !firestore) return;
  
    if (typeof puter === 'undefined') {
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI video service could not be loaded.",
      });
      return;
    }
  
    setIsGeneratingVideo(true);
  
    const moodLabel = MOODS[activeEntry.mood].label;
    const prompt = `Create a short, looping, cinematic video that visually represents the mood and themes of the following journal entry. The dominant mood is "${moodLabel}". The style should be ethereal, painterly, and evocative, not literal. The source of inspiration is the text, not any associated image.
  
  Journal Entry:
  "${activeEntry.content}"`;
  
    try {
      const videoElement = await puter.ai.txt2vid(prompt, { model: "Wan-AI/Wan2.2-T2V-A14B" });
      const generatedVideoUrl = videoElement.src;
      setVideoUrl(generatedVideoUrl);
      
      videoElement.addEventListener('loadeddata', () => videoElement.play().catch(() => {}));
  
      const entryRef = doc(firestore, 'users', user.uid, 'journalEntries', activeEntry.id);
      await updateDocumentNonBlocking(entryRef, { videoUrl: generatedVideoUrl });
  
      toast({
        title: "Video Generated!",
        description: "A short video clip has been added to your entry.",
      });
    } catch (error) {
      console.error("Error getting AI video from Puter.ai:", error);
      toast({
        variant: "destructive",
        title: "AI Video Failed",
        description: "Could not generate a video for this entry.",
      });
    } finally {
      setIsGeneratingVideo(false);
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

  const handleAskCompanion = async () => {
    const content = form.getValues("content");
    if (!content || content.length < 20) {
      toast({
        variant: "destructive",
        title: "More Content Needed",
        description: "Please write a little more before asking for a thought.",
      });
      return;
    }

    setIsCompanionLoading(true);

    // Get the last 3 entries for context
    const recentEntries = [...entries]
        .sort((a, b) => (b.date as any).toDate().getTime() - (a.date as any).toDate().getTime())
        .slice(0, 3);
        
    const history = recentEntries.map(entry => {
        const date = format((entry.date as any).toDate(), "MMMM d, yyyy");
        const mood = MOODS[entry.mood].label;
        return `On ${date}, I felt ${mood} and wrote: "${entry.content}"`;
    }).join("\n\n");

    const prompt = `You are a gentle, Socratic journaling companion with "memory". A user is writing in their journal and has asked you for a thought.
Your goal is to help them reflect more deeply by asking one, and only one, gentle, open-ended question.

1.  Read their recent journal history to understand their ongoing narrative.
2.  Read their current, unfinished entry.
3.  If relevant, ask a question that connects their current thoughts to a theme from their past entries. This makes you feel like a continuous, attentive guide.
4.  If past entries aren't relevant, just ask a thoughtful question about their current entry.
5.  Do not offer advice, summaries, or affirmations. Just ask one insightful question.

Examples:
- If a past entry mentioned stress and the current one is calm: "I notice you wrote about feeling calm today, which feels different from the stress you mentioned last week. What do you think contributed to this shift?"
- If the current entry is about a success: "It sounds like this was a really positive moment. What was it about this achievement that felt most meaningful to you?"

**Recent Journal History:**
${history || "No recent history available."}

**User's Current (Unfinished) Entry:**
"${content}"`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      setCompanionThought(aiResponse.message.content);
      setShowCompanionDialog(true);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Companion Error" });
    } finally {
      setIsCompanionLoading(false);
    }
  };

  const clearInspirationPrompt = () => {
    if (settingsDocRef) {
        setDocumentNonBlocking(settingsDocRef, { inspirationPrompt: null }, { merge: true });
    }
    setInspirationPrompt(null);
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

    let finalContent = values.content;

    // Transcribe audio if present
    if (audioUrl && typeof puter !== 'undefined') {
        try {
            const transcriptionResult = await puter.ai.speech2txt(audioUrl);
            const transcriptionText = transcriptionResult.text;
            finalContent += `\n\n---\n\n**Voice Memo Transcription:**\n*${transcriptionText}*`;
            toast({ title: "Memo Transcribed!", description: "Your voice memo has been transcribed and added to the entry." });
        } catch(err) {
            console.error("Transcription failed:", err);
            toast({ variant: 'destructive', title: 'Transcription Failed', description: 'Could not transcribe the voice memo. The audio is still saved.' });
        }
    }

    // 1. Save the entry to Firestore
    const journalEntriesRef = collection(firestore, 'users', user.uid, 'journalEntries');
    const newDoc = await addDocumentNonBlocking(journalEntriesRef, {
      userId: user.uid,
      date: serverTimestamp(),
      mood: values.mood,
      content: finalContent,
      imageUrl: imageUrl, // Save the generated image URL
      audioUrl: audioUrl,
      tags: tagsArray,
    });

    if (newDoc) {
      setActiveEntry({ id: newDoc.id, content: finalContent, mood: values.mood, imageUrl: imageUrl });
    }
    
    toast({
      title: "Entry Saved!",
      description: "Your journal entry has been saved.",
    });

    // 2. Trigger the AI reflection and show dialog
    await handleAiReflection({ content: finalContent, audioUrl });
    setShowReflectionDialog(true);
    
    // 3. Reset form and state
    clearInspirationPrompt();
    setIsSubmitting(false);
    setSuggestedTags([]);
    resetRecorder();
    setImageUrl(null); // Clear the image after saving
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

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleUseTemplate = (templateContent: string) => {
    form.setValue('content', templateContent);
  };

  const defaultTitle = "Today's Reflection";
  const defaultDescription = "What's on your mind today? Let it all out.";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{formContext?.title || defaultTitle}</CardTitle>
          <CardDescription>{formContext?.description || defaultDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
               {inspirationPrompt && !externalImageUrl && (
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
                    <Button type="button" variant="ghost" size="icon" onClick={resetRecorder} disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive dark:text-red-500 dark:hover:text-red-400" />
                      <span className="sr-only">Delete recording</span>
                    </Button>
                  </div>
                </div>
              )}
              <JournalFormFields
                key={formKey} 
                isGenerating={isSubmitting}
                onGeneratePrompt={!externalImageUrl ? handleGeneratePrompt : undefined}
                isGettingPrompt={isGettingPrompt}
                isEditing={false}
                suggestedTags={suggestedTags}
                isSuggestingTags={isSuggestingTags && !isSubmitting}
                onAddTag={handleAddTag}
                onAskCompanion={handleAskCompanion}
                isCompanionLoading={isCompanionLoading}
              />
              {/* AI Cover Art Section */}
              {!externalImageUrl && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">AI Cover Art</h3>
                    <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 text-center min-h-[180px]">
                    {isGeneratingImage ? (
                        <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Generating your cover art...</p>
                        </>
                    ) : imageUrl ? (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden">
                        <Image src={imageUrl} alt="AI-generated cover art for the journal entry" layout="fill" objectFit="cover" />
                        <Button 
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => setImageUrl(null)}
                            disabled={isSubmitting}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove image</span>
                        </Button>
                        </div>
                    ) : (
                        <>
                        <div className="bg-secondary p-3 rounded-full">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground max-w-xs">
                            Create a unique image for your entry based on its content and mood.
                        </p>
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={handleAiImage}
                            disabled={isSubmitting || !entryContent || !mood}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Image
                        </Button>
                        </>
                    )}
                    </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                 <Button type="submit" disabled={isSubmitting || isGettingPrompt || isRecording || isProcessingAudio || isGeneratingImage} className="w-full sm:w-auto flex-1">
                  {isSubmitting ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Entry
                    </>
                  )}
                 </Button>
                {templates.length > 0 && !formContext && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto flex-1">
                          <FileText className="mr-2 h-4 w-4" />
                          Use Template
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {templates.map(template => (
                          <DropdownMenuItem key={template.id} onSelect={() => handleUseTemplate(template.content)}>
                            {template.title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </div>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                onClick={handleVoiceButtonClick}
                disabled={isSubmitting || isGettingPrompt || isProcessingAudio}
                className="w-full"
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
          if (isGenerating) return;
          if (!isOpen) {
            resetDialogState();
            // Call onSave when the dialog closes
            if (onSave) {
              onSave();
            }
          }
          setShowReflectionDialog(isOpen);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              A Moment of Reflection
            </AlertDialogTitle>
             {(activeEntry?.imageUrl || isGeneratingVideo || videoUrl) && (
              <div className="relative aspect-video w-full mt-4 rounded-lg overflow-hidden bg-secondary">
                  {isGeneratingVideo && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10 bg-black/20">
                          <Loader2 className="h-8 w-8 animate-spin mb-2" />
                          <span>Creating video...</span>
                      </div>
                  )}
                  {videoUrl && !isGeneratingVideo ? (
                      <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : activeEntry?.imageUrl && !videoUrl ? (
                     <Image src={activeEntry.imageUrl} alt="AI-generated art for the entry" layout="fill" objectFit="cover" />
                  ) : null}
              </div>
            )}
            <AlertDialogDescription className="text-base text-foreground pt-4">
              {reflection || <Loader2 className="h-5 w-5 animate-spin mx-auto" />}
            </AlertDialogDescription>
          </AlertDialogHeader>
           <AlertDialogFooter className="flex-col sm:flex-row gap-2 items-stretch">
             <div className="flex flex-wrap items-center gap-2 sm:flex-1">
                  <Button
                      onClick={handleAiVideo}
                      disabled={isGenerating || !!videoUrl}
                      variant="outline"
                      className="flex-1"
                  >
                      {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                      <span>{videoUrl ? 'Video Added' : 'Create Video'}</span>
                  </Button>
                  <Button 
                      onClick={() => audioReflection?.play()} 
                      disabled={isGeneratingAudio || !audioReflection}
                      variant="outline"
                      className="flex-1"
                  >
                      {isGeneratingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                      <span className="ml-2">Listen</span>
                  </Button>
              </div>
              <AlertDialogAction onClick={() => setShowReflectionDialog(false)} className="w-full sm:w-auto mt-2 sm:mt-0" disabled={isGenerating}>
                {isGenerating ? 'Please wait...' : 'Close'}
              </AlertDialogAction>
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
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Companion Dialog */}
      <AiCompanionThought
        isOpen={showCompanionDialog}
        onOpenChange={setShowCompanionDialog}
        thought={companionThought}
        isLoading={isCompanionLoading}
      />
    </>
  )
}
