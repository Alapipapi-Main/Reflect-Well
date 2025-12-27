
'use client';

import { useState } from 'react';
import type { JournalEntry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { MOODS } from '@/lib/constants';
import Balancer from 'react-wrap-balancer';

declare const puter: any;

interface AiStoryWeaverProps {
  selectedEntries: JournalEntry[];
}

export function AiStoryWeaver({ selectedEntries }: AiStoryWeaverProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);

  const handleWeaveStory = async () => {
    if (typeof puter === 'undefined') {
      toast({
        variant: 'destructive',
        title: 'AI Feature Not Available',
        description: 'The AI story service could not be loaded.',
      });
      return;
    }
    if (selectedEntries.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Not Enough Entries',
        description: 'Please select at least two journal entries to weave a story.',
      });
      return;
    }

    setIsLoading(true);
    setStory(null);

    const sortedEntries = [...selectedEntries].sort((a, b) => {
        const dateA = a.date ? (a.date as any).toDate() : new Date(0);
        const dateB = b.date ? (b.date as any).toDate() : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });

    const formattedEntries = sortedEntries
      .map(entry => {
        const date = format((entry.date as any).toDate(), 'EEEE, MMMM d, yyyy');
        const mood = MOODS[entry.mood].label;
        const tags = entry.tags && entry.tags.length > 0 ? `Tags: ${entry.tags.join(', ')}` : '';
        const voiceMemoContext = entry.audioUrl ? '(Voice memo attached)' : '';
        return `On ${date}, the feeling was ${mood}. The entry, tagged with '${tags}', reads:\n"${entry.content}" ${voiceMemoContext}`;
      })
      .join('\n\n---\n\n');

    const prompt = `You are a gentle and creative storyteller named the "Story Weaver". Your task is to take a series of first-person journal entries from a user and weave them into a short, cohesive, third-person narrative story.

- **Perspective:** Write in the third person (e.g., "they felt," "she experienced," "he wondered"). Refer to the protagonist of the story as "the journaler" or "they".
- **Tone:** Your tone should be empathetic, reflective, and slightly literary or poetic.
- **Narrative Arc:** Find a common thread or a sense of progression through the entries. It could be a changing mood, a recurring theme, or a journey from a problem to a resolution (or acceptance).
- **Incorporate Details:** Gently incorporate key feelings, events, and symbols from the entries. Mention the moods and tags if they are relevant to the story's emotional arc. If an entry notes "(Voice memo attached)", you can acknowledge that more thoughts might be in the audio, e.g., "They recorded a voice memo that day, perhaps to capture more of the feeling."
- **Do Not Judge or Advise:** Your role is to narrate and reflect, not to analyze or give advice.
- **Structure:** The story should be a few paragraphs long. It should have a beginning, a middle, and an end that provides a sense of summary or thoughtful conclusion based on the provided entries.

**The User's Selected Journal Entries (in chronological order):**
${formattedEntries}

Now, weave these moments into a single, flowing story.`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      setStory(aiResponse.message.content);
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        variant: 'destructive',
        title: 'Story Weaving Failed',
        description: 'The AI could not create a story at this time.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-secondary/30 border-primary/20 border-2">
      <CardHeader>
        <CardTitle>AI Story Weaver</CardTitle>
        <CardDescription>
            <Balancer>
                You've selected {selectedEntries.length} {selectedEntries.length > 1 ? 'entries' : 'entry'}.
                The Story Weaver can transform these moments into a short, third-person narrative to help you see your journey from a new perspective.
            </Balancer>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium">Weaving your story...</p>
            </div>
        )}
        {story && (
            <div className="p-4 sm:p-6 bg-background rounded-lg space-y-4 shadow-inner">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Wand2 className="text-primary" /> A Story from Your Journal
                </h3>
                <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed font-serif">{story}</p>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleWeaveStory} disabled={isLoading || selectedEntries.length < 2}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Weaving...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Weave My Story
            </>
          )}
        </Button>
      </CardFooter>
       {selectedEntries.length < 2 && (
         <p className="px-6 pb-4 text-sm text-muted-foreground -mt-4">
            Please select at least two entries to create a story.
        </p>
      )}
    </Card>
  );
}
