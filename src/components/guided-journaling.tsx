
'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand, CornerDownLeft, CheckCircle } from 'lucide-react';
import Balancer from 'react-wrap-balancer';

declare const puter: any;

type SessionState = 'idle' | 'loading' | 'active' | 'saving' | 'complete';
interface Answer {
  question: string;
  answer: string;
}

const THEMES = {
  gratitude: 'Practicing Gratitude',
  weekly_review: 'My Weekly Review',
  self_compassion: 'A Moment of Self-Compassion',
  overcoming_challenge: 'Overcoming a Challenge',
  morning_intention: 'Morning Intentions',
};

type ThemeKey = keyof typeof THEMES;

export function GuidedJournaling() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);

  const startSession = async (themeKey: string) => {
    if (typeof puter === 'undefined') {
      toast({
        variant: 'destructive',
        title: 'AI Feature Not Available',
        description: 'The AI service could not be loaded.',
      });
      return;
    }

    setSessionState('loading');
    setSelectedTheme(themeKey as ThemeKey);
    setAllAnswers([]);
    setCurrentAnswer('');

    const prompt = `You are a gentle and insightful guide for journaling. Generate a series of 3 short, open-ended questions for a guided journaling session on the theme "${THEMES[themeKey as ThemeKey]}".
The questions should build on each other to encourage deeper reflection.
Return the questions as a JSON string array. For example: ["Question 1?", "Question 2?", "Question 3?"]
Do not include any other text or explanation in your response.`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      const parsedQuestions = JSON.parse(aiResponse.message.content);
      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
        setCurrentQuestionIndex(0);
        setSessionState('active');
      } else {
        throw new Error('AI did not return a valid list of questions.');
      }
    } catch (error) {
      console.error('Error starting guided session:', error);
      toast({
        variant: 'destructive',
        title: 'Could Not Start Session',
        description: 'Failed to generate questions from the AI. Please try again.',
      });
      setSessionState('idle');
    }
  };

  const handleNextQuestion = () => {
    if (currentAnswer.trim().length < 5) {
        toast({ variant: 'destructive', title: 'Please write a bit more.' });
        return;
    }
    const newAnswers = [...allAnswers, { question: questions[currentQuestionIndex], answer: currentAnswer }];
    setAllAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of session, save the entry
      saveJournalEntry(newAnswers);
    }
  };

  const saveJournalEntry = async (finalAnswers: Answer[]) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Could not save entry.', description: 'You must be logged in.' });
      return;
    }
    setSessionState('saving');

    const formattedContent = finalAnswers
      .map(a => `> ${a.question}\n\n${a.answer}`)
      .join('\n\n---\n\n');
    
    const title = selectedTheme ? THEMES[selectedTheme] : 'Guided Session';
    const finalContent = `# ${title}\n\n${formattedContent}`;
    
    const tags = selectedTheme ? [selectedTheme.replace(/_/g, ' ')] : ['guided session'];
    
    // Determine mood based on theme
    const mood = (selectedTheme === 'gratitude' || selectedTheme === 'self_compassion' || selectedTheme === 'morning_intention') ? 'happy' : 'neutral';

    const journalEntriesRef = collection(firestore, 'users', user.uid, 'journalEntries');
    await addDocumentNonBlocking(journalEntriesRef, {
      userId: user.uid,
      date: serverTimestamp(),
      mood: mood,
      content: finalContent,
      tags: tags,
      imageUrl: null,
    });

    toast({ title: 'Entry Saved!', description: 'Your guided session has been saved to your journal.' });
    setSessionState('complete');
  };
  
  const resetSession = () => {
      setSessionState('idle');
      setSelectedTheme(null);
      setQuestions([]);
      setAllAnswers([]);
      setCurrentAnswer('');
      setCurrentQuestionIndex(0);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guided Journaling</CardTitle>
        <CardDescription>
          Select a theme and let our AI guide you through a thoughtful reflection.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {sessionState === 'idle' && (
          <div className="space-y-4">
            <label className="font-medium">Choose a theme to begin:</label>
            <Select onValueChange={(value) => startSession(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a theme..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(THEMES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(sessionState === 'loading' || sessionState === 'saving') && (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium">{sessionState === 'loading' ? 'Preparing your session...' : 'Saving your entry...'}</p>
            </div>
        )}

        {sessionState === 'active' && (
          <div className="space-y-6">
            <div className="text-center p-6 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
              <h3 className="text-xl font-semibold text-foreground">
                <Balancer>{questions[currentQuestionIndex]}</Balancer>
              </h3>
            </div>
            <Textarea
              placeholder="Write your thoughts here..."
              rows={8}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              autoFocus
            />
          </div>
        )}
        
        {sessionState === 'complete' && (
            <div className="flex flex-col items-center justify-center text-center p-8 text-green-600 dark:text-green-400 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Session Complete!</h3>
                <p className="text-foreground/90 mb-6">Your entry has been saved to your journal history.</p>
                <Button onClick={resetSession}>Start a New Session</Button>
            </div>
        )}
      </CardContent>

      {sessionState === 'active' && (
        <CardFooter className="flex justify-end">
          <Button onClick={handleNextQuestion}>
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish & Save Entry'}
            <CornerDownLeft className="ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
