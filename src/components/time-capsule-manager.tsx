
'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { TimeCapsuleEntry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AutosizeTextarea } from '@/components/ui/autosize-textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CustomCalendar, type DateRange } from './custom-calendar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Calendar as CalendarIcon, Lock, Unlock, Mail, Clock, Film, Sparkles, X, Bot } from 'lucide-react';
import { format, isFuture, startOfTomorrow, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import Balancer from 'react-wrap-balancer';
import Image from 'next/image';

declare const puter: any;

interface TimeCapsuleManagerProps {
  timeCapsules: TimeCapsuleEntry[];
}

const timeCapsuleSchema = z.object({
  content: z.string().min(10, 'Your message must be at least 10 characters long.'),
  lockUntil: z.date({
    required_error: "An unlock date is required.",
  }).min(startOfTomorrow(), { message: "Unlock date must be in the future." }),
});

export function TimeCapsuleManager({ timeCapsules }: TimeCapsuleManagerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGettingReply, setIsGettingReply] = useState(false);
  const [futureSelfReply, setFutureSelfReply] = useState<string | null>(null);


  const form = useForm<z.infer<typeof timeCapsuleSchema>>({
    resolver: zodResolver(timeCapsuleSchema),
  });
  
  const handleDateSelect = (range: DateRange) => {
    if (range.from) {
      form.setValue('lockUntil', range.from, { shouldValidate: true });
      // Automatically close the calendar after a single date is selected
      setIsCalendarOpen(false);
    }
  };

  const handleGenerateVideo = async () => {
    const content = form.getValues('content');
    if (!content) {
        toast({ variant: 'destructive', title: 'Message Required', description: 'Please write your message before generating a video.' });
        return;
    }
    if (typeof puter === 'undefined') {
        toast({ variant: 'destructive', title: 'AI Not Available' });
        return;
    }

    setIsGeneratingVideo(true);
    setVideoUrl(null);

    const prompt = `Create a short, cinematic, and emotionally resonant video that captures the essence of this message to a person's future self. The tone should be reflective, hopeful, and a little nostalgic. The style should be abstract and beautiful, not literal.

Message: "${content}"`;

    try {
        const videoElement = await puter.ai.txt2vid(prompt, { model: "Wan-AI/Wan2.2-T2V-A14B" });
        const generatedVideoUrl = videoElement.src;
        setVideoUrl(generatedVideoUrl);
        videoElement.addEventListener('loadeddata', () => videoElement.play().catch(() => {}));
        toast({ title: 'Video Generated!', description: 'A video has been created for your time capsule.' });
    } catch (error) {
        console.error("Error generating video for time capsule:", error);
        toast({ variant: 'destructive', title: 'Video Generation Failed', description: 'Could not create a video at this time.' });
    } finally {
        setIsGeneratingVideo(false);
    }
};

const handleGetFutureSelfReply = async () => {
    const content = form.getValues('content');
    if (!content || content.length < 15) {
      toast({ variant: 'destructive', title: 'More Detail Needed', description: 'Write a bit more in your message to get a thoughtful reply.' });
      return;
    }
    if (typeof puter === 'undefined') {
      toast({ variant: 'destructive', title: 'AI Not Available' });
      return;
    }

    setIsGettingReply(true);
    setFutureSelfReply(null);

    const prompt = `You are an AI role-playing as a person's wise, compassionate, and optimistic "Future Self".
The user has written a message to you. Your task is to provide one single, encouraging, and insightful reply.

- Your tone should be warm, reassuring, and full of perspective. You've been through it, and you've come out stronger and wiser.
- Read the user's message and identify their core emotion, hope, or fear.
- Your reply should be short (2-3 sentences).
- Do not offer concrete advice or predictions. Instead, offer perspective and encouragement.
- Use "I" statements from the perspective of their future self. For example: "I remember feeling that way. It's amazing to look back now and see..."
- End with a feeling of hope and reassurance.

**User's Message to You (Their Future Self):**
"${content}"`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      setFutureSelfReply(aiResponse.message.content);
    } catch (error) {
      console.error("Error getting future self reply:", error);
      toast({ variant: 'destructive', title: 'AI Reply Failed', description: 'Could not get a reply at this time.' });
    } finally {
      setIsGettingReply(false);
    }
  };


  const onSubmit = async (values: z.infer<typeof timeCapsuleSchema>) => {
    if (!user || !firestore) return;

    setIsSubmitting(true);

    let finalContent = values.content;
    if (futureSelfReply) {
        finalContent += `\n\n---\n\n**A Reply from My Future Self:**\n*${futureSelfReply}*`;
    }

    try {
      const timeCapsulesRef = collection(firestore, 'users', user.uid, 'timeCapsules');
      await addDocumentNonBlocking(timeCapsulesRef, {
        userId: user.uid,
        content: finalContent,
        lockUntil: values.lockUntil,
        createdAt: serverTimestamp(),
        videoUrl: videoUrl,
      });
      toast({ title: 'Time Capsule Sealed!', description: `Your message will be available to read on ${format(values.lockUntil, 'PPP')}.` });
      form.reset({ content: '', lockUntil: undefined });
      setVideoUrl(null);
      setFutureSelfReply(null);
    } catch (error) {
      console.error('Error saving time capsule:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the time capsule.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const confirmDelete = () => {
    if (!user || !firestore || !deleteCandidateId) return;
    const templateRef = doc(firestore, 'users', user.uid, 'timeCapsules', deleteCandidateId);
    deleteDocumentNonBlocking(templateRef);
    toast({ title: "Time Capsule Discarded", description: "Your time capsule has been removed." });
    setDeleteCandidateId(null);
  };
  
  const markAsOpened = (capsule: TimeCapsuleEntry) => {
    if (!user || !firestore || capsule.openedAt) return;

    const capsuleRef = doc(firestore, 'users', user.uid, 'timeCapsules', capsule.id);
    updateDocumentNonBlocking(capsuleRef, { openedAt: serverTimestamp() });
  };

  const selectedDate = form.watch('lockUntil');
  const messageContent = form.watch('content');
  const isGenerating = isSubmitting || isGeneratingVideo || isGettingReply;

  return (
    <>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Dear Future Self...</CardTitle>
            <CardDescription>Write a message to your future self. It will be sealed and locked until the date you choose.</CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Message</label>
                <AutosizeTextarea
                  placeholder="What do you want to remember? What are your hopes? What advice would you give?"
                  minRows={4}
                  {...form.register('content')}
                  disabled={isGenerating}
                />
                {form.formState.errors.content && <p className="text-sm font-medium text-destructive">{form.formState.errors.content.message}</p>}
              </div>

               <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleGetFutureSelfReply}
                        disabled={isGenerating || !messageContent || messageContent.length < 15}
                    >
                        {isGettingReply ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...</>
                        ) : (
                            <><Bot className="mr-2 h-4 w-4" /> Ask for a thought from your Future Self</>
                        )}
                    </Button>
               </div>

                {futureSelfReply && (
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-2 border">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Bot className="text-primary" /> A Reply from Your Future Self
                        </h4>
                        <p className="text-foreground/90 italic">"{futureSelfReply}"</p>
                    </div>
                )}
                {isGettingReply && (
                    <div className="flex items-center justify-center p-4 text-muted-foreground gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Your future self is reflecting...
                    </div>
                )}


               <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">AI Video Message (Optional)</h3>
                    <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 text-center min-h-[180px]">
                    {isGeneratingVideo ? (
                        <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Generating your video...</p>
                        </>
                    ) : videoUrl ? (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden">
                          <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          <Button 
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7"
                              onClick={() => setVideoUrl(null)}
                              disabled={isGenerating}
                          >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove video</span>
                          </Button>
                        </div>
                    ) : (
                        <>
                        <div className="bg-secondary p-3 rounded-full">
                            <Film className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground max-w-xs">
                            Add a short, cinematic video to your message based on what you write.
                        </p>
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={handleGenerateVideo}
                            disabled={isGenerating || !messageContent}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Video
                        </Button>
                        </>
                    )}
                    </div>
                </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unlock On</label>
                 <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        disabled={isGenerating}
                        className={cn(
                          "w-full sm:w-[240px] justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                       <CustomCalendar
                         selectionMode="single"
                         selectedRange={{ from: selectedDate, to: null }}
                         onDateRangeSelect={handleDateSelect}
                         disabled={(date) => isPast(date) && !isToday(date)}
                       />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.lockUntil && <p className="text-sm font-medium text-destructive">{form.formState.errors.lockUntil.message}</p>}
              </div>
            </CardContent>
             <CardFooter>
                 <Button type="submit" disabled={isGenerating}>
                    {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sealing...</>
                    ) : <><Lock className="mr-2 h-4 w-4" /> Seal Time Capsule</>}
                </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Time Capsules</CardTitle>
            <CardDescription>A list of your past messages to yourself, both locked and unlocked.</CardDescription>
          </CardHeader>
          <CardContent>
            {timeCapsules.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {timeCapsules.map(capsule => {
                  const isLocked = capsule.lockUntil && isFuture((capsule.lockUntil as any).toDate());
                  return (
                    <AccordionItem value={capsule.id} key={capsule.id}>
                      <div className="flex items-center w-full">
                        <AccordionTrigger
                           disabled={isLocked}
                           className={cn(isLocked && "cursor-not-allowed hover:no-underline")}
                           onClick={() => !isLocked && markAsOpened(capsule)}
                        >
                            <div className="flex items-center gap-4">
                                {isLocked ? <Lock className="h-5 w-5 text-muted-foreground" /> : <Unlock className="h-5 w-5 text-primary" />}
                                <div className="text-left">
                                <p className="font-medium">
                                    {isLocked ? "Locked" : "Unlocked"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isLocked && capsule.lockUntil ? `Opens on ${format((capsule.lockUntil as any).toDate(), 'PPP')}` : capsule.lockUntil ? `Unlocked on ${format((capsule.lockUntil as any).toDate(), 'PPP')}` : 'Date not set'}
                                </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <div className="flex items-center gap-2 pr-4 pl-2">
                          {!isLocked && !capsule.openedAt && <div title="New" className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>}
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteCandidateId(capsule.id)}
                            aria-label="Delete time capsule"
                           >
                            <Trash2 className="h-5 w-5 text-destructive/80 hover:text-destructive dark:text-red-500 dark:hover:text-red-400" />
                           </Button>
                        </div>
                      </div>
                      <AccordionContent>
                        <Card className="bg-secondary/30">
                           <CardHeader>
                             <CardTitle className="text-lg">Your message from the past</CardTitle>
                             <CardDescription>
                                Written on {capsule.createdAt ? format((capsule.createdAt as any).toDate(), 'PPP') : 'just now'}
                             </CardDescription>
                           </CardHeader>
                           <CardContent className="space-y-4">
                            {capsule.videoUrl && (
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary">
                                    <video src={capsule.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                </div>
                            )}
                              <p className="whitespace-pre-wrap">{capsule.content}</p>
                           </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Clock className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Time Capsules Yet</h3>
                <p>
                  <Balancer>
                    Write a message to your future self using the form above. It's a gift you give to yourself.
                  </Balancer>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
       <AlertDialog open={!!deleteCandidateId} onOpenChange={(open) => !open && setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this time capsule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCandidateId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-red-800 dark:text-red-50 dark:hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
