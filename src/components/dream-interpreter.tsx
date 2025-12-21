
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Moon } from 'lucide-react';
import Balancer from 'react-wrap-balancer';

declare const puter: any;

export function DreamInterpreter() {
  const { toast } = useToast();
  const [dreamDescription, setDreamDescription] = useState('');
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInterpretDream = async () => {
    if (typeof puter === 'undefined') {
      toast({
        variant: 'destructive',
        title: 'AI Feature Not Available',
        description: 'The AI service could not be loaded.',
      });
      return;
    }

    if (dreamDescription.trim().length < 15) {
      toast({
        variant: 'destructive',
        title: 'More Detail Needed',
        description: 'Please describe your dream in a little more detail.',
      });
      return;
    }

    setIsLoading(true);
    setInterpretation(null);

    const prompt = `You are a gentle and insightful dream interpreter. Your goal is to analyze a user's dream description and offer a symbolic, reflective interpretation based on common dream archetypes and themes.

- **Do NOT present yourself as a psychologist or a scientist.** Your tone should be mystical, gentle, and reflective, like a wise guide.
- Focus on symbols, feelings, and actions described in the dream.
- Frame your interpretation as a series of possibilities or questions for the user to reflect on. Use phrases like "Perhaps this represents...", "It might symbolize...", "How did it feel when...?", or "This could suggest a connection to...".
- Keep the interpretation to 2-3 short paragraphs.
- Do not make definitive statements. The goal is to spark the user's own introspection, not to provide concrete answers.
- End with a gentle, open-ended question that encourages the user to think more deeply about the dream's connection to their waking life.

**Dream Description:**
"${dreamDescription}"`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      setInterpretation(aiResponse.message.content);
    } catch (error) {
      console.error('Error getting AI interpretation from Puter.ai:', error);
      toast({
        variant: 'destructive',
        title: 'Interpretation Failed',
        description: 'Could not interpret your dream at this time. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Dream Interpreter</CardTitle>
        <CardDescription>
          <Balancer>
            Describe a dream you've had, and our AI guide will offer a symbolic interpretation to spark your reflection.
          </Balancer>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="dream-description" className="text-sm font-medium">
            Describe Your Dream
          </label>
          <Textarea
            id="dream-description"
            placeholder="e.g., I was flying over a city made of glass, but I was afraid of falling..."
            value={dreamDescription}
            onChange={(e) => setDreamDescription(e.target.value)}
            rows={6}
            disabled={isLoading}
          />
        </div>

        {interpretation && (
          <div className="p-4 bg-secondary/50 border rounded-lg space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="text-primary" /> An Interpretation for You
            </h3>
            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {interpretation}
            </p>
          </div>
        )}

        {isLoading && !interpretation && (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Interpreting your dream...
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleInterpretDream} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Interpret Dream
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
