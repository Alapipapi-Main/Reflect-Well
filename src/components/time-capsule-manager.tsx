
'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { TimeCapsuleEntry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PlusCircle, Trash2, Loader2, Calendar as CalendarIcon, Lock, Unlock, Mail, Clock } from 'lucide-react';
import { format, isFuture, startOfTomorrow, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import Balancer from 'react-wrap-balancer';

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

  const onSubmit = async (values: z.infer<typeof timeCapsuleSchema>) => {
    if (!user || !firestore) return;

    setIsSubmitting(true);

    try {
      const timeCapsulesRef = collection(firestore, 'users', user.uid, 'timeCapsules');
      await addDocumentNonBlocking(timeCapsulesRef, {
        ...values,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Time Capsule Sealed!', description: `Your message will be available to read on ${format(values.lockUntil, 'PPP')}.` });
      form.reset({ content: '', lockUntil: undefined });
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

  return (
    <>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Dear Future Self...</CardTitle>
            <CardDescription>Write a message to your future self. It will be sealed and locked until the date you choose.</CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Message</label>
                <AutosizeTextarea
                  placeholder="What do you want to remember? What are your hopes? What advice would you give?"
                  minRows={4}
                  {...form.register('content')}
                  disabled={isSubmitting}
                />
                {form.formState.errors.content && <p className="text-sm font-medium text-destructive">{form.formState.errors.content.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unlock On</label>
                 <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-[240px] justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sealing...</>
                ) : <><Lock className="mr-2 h-4 w-4" /> Seal Time Capsule</>}
              </Button>
            </CardContent>
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
                  const isLocked = isFuture((capsule.lockUntil as any).toDate());
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
                                    {isLocked ? `Opens on ${format((capsule.lockUntil as any).toDate(), 'PPP')}` : `Unlocked on ${format((capsule.lockUntil as any).toDate(), 'PPP')}`}
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
                             <CardDescription>Written on {format((capsule.createdAt as any).toDate(), 'PPP')}</CardDescription>
                           </CardHeader>
                           <CardContent>
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
