
'use client';

import { useState } from 'react';
import type { JournalEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand, Save } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { MOODS } from '@/lib/constants';

declare const puter: any;

interface LetterToPastSelfProps {
  entry: JournalEntry;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function LetterToPastSelf({ entry, isOpen, onOpenChange }: LetterToPastSelfProps) {
  const { toast } = useToast();
  const { user, firestore } = useUserAndFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [letterContent, setLetterContent] = useState<string | null>(null);

  const handleGenerateLetter = async () => {
    if (typeof puter === 'undefined') {
      toast({ variant: 'destructive', title: 'AI Feature Not Available' });
      return;
    }

    setIsLoading(true);
    setLetterContent(null);

    const entryDate = format((entry.date as any).toDate(), 'MMMM d, yyyy');
    const entryMood = MOODS[entry.mood].label;
    const prompt = `You are an AI role-playing as a person's wise, compassionate, and optimistic "Present Self," writing a letter to their "Past Self."
The user has selected a journal entry from their past. Your task is to draft a short, gentle, and encouraging letter based on it.

1.  **Analyze the Past Entry:** Read the provided journal entry to understand the user's emotional state at that time.
2.  **Adopt a Warm Tone:** Your tone should be full of perspective, empathy, and reassurance. You've been through what your past self was feeling, and you've grown.
3.  **Acknowledge, Don't Dwell:** Gently acknowledge the feelings or situation in the old entry without being dismissive. (e.g., "I know how much that project was weighing on you," or "I remember that feeling of uncertainty.").
4.  **Highlight Growth (Implicitly):** Your perspective should implicitly show that things have changed. You don't need to say "things are better now," but your calm, wise tone will imply it.
5.  **Offer Encouragement:** End with a hopeful and reassuring message. Remind your past self of their strength or resilience.
6.  **Structure:** Start with "Dear Past Self," or "To the me of [Date]," and keep the letter to 2-3 short paragraphs.

**Past Journal Entry from ${entryDate} (Mood: ${entryMood}):**
"${entry.content}"

Now, draft the letter.`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      setLetterContent(aiResponse.message.content);
    } catch (error) {
      console.error('Error generating letter:', error);
      toast({ variant: 'destructive', title: 'Letter Generation Failed' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveLetter = async () => {
    if (!letterContent || !user || !firestore) return;

    setIsSaving(true);
    try {
        const journalEntriesRef = collection(firestore, 'users', user.uid, 'journalEntries');
        const originalEntryDate = format((entry.date as any).toDate(), 'yyyy-MM-dd');
        
        await addDocumentNonBlocking(journalEntriesRef, {
            userId: user.uid,
            date: serverTimestamp(),
            mood: 'neutral', // Letters of reflection are often neutral
            content: `# A Letter to My Past Self\n\n**In response to my entry from ${originalEntryDate}:**\n\n${letterContent}`,
            tags: ['letter to past self', 'reflection'],
            imageUrl: null,
            audioUrl: null,
        });

        toast({ title: 'Letter Saved!', description: 'Your letter has been saved as a new journal entry.' });
        onOpenChange(false); // Close the dialog
    } catch (error) {
        console.error('Error saving letter:', error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your letter.' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>A Letter to Your Past Self</DialogTitle>
          <DialogDescription>
            Reflect on this past entry and, with the help of AI, write a compassionate letter from your present self to the person you were then.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Past Entry Column */}
            <div className="space-y-4">
                <h3 className="font-semibold">Your Entry From {format((entry.date as any).toDate(), 'PPP')}</h3>
                <Card className="bg-secondary/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                           <span className="text-2xl">{MOODS[entry.mood].emoji}</span>
                           <span>{MOODS[entry.mood].label}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
                    </CardContent>
                </Card>
            </div>

            {/* New Letter Column */}
            <div className="space-y-4">
                <h3 className="font-semibold">Your Letter</h3>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full rounded-lg border border-dashed p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : letterContent ? (
                    <Textarea
                        value={letterContent}
                        onChange={(e) => setLetterContent(e.target.value)}
                        rows={12}
                        className="h-full"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center rounded-lg border-2 border-dashed p-8">
                        <p className="text-sm text-muted-foreground mb-4">Generate a draft of your letter based on your past entry.</p>
                        <Button onClick={handleGenerateLetter}>
                            <Wand className="mr-2 h-4 w-4" />
                            Draft My Letter
                        </Button>
                    </div>
                )}
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveLetter} disabled={!letterContent || isSaving || isLoading}>
            {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Letter</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function useUserAndFirestore() {
    const { user } = useUser();
    const firestore = useFirestore();
    return { user, firestore };
}
