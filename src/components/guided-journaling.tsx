
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand, CheckCircle, Mic, StopCircle, Bot, BookCopy } from 'lucide-react';
import Balancer from 'react-wrap-balancer';
import MicRecorder from 'mic-recorder-to-mp3';
import { cn } from '@/lib/utils';

declare const puter: any;

type SessionState = 'idle' | 'loading_questions' | 'narrating' | 'listening' | 'recording' | 'transcribing' | 'saving' | 'complete';

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

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
  
  // Audio and recording state
  const recorder = useRef<MicRecorder | null>(null);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const [isPuterReady, setIsPuterReady] = useState(false);

  useEffect(() => {
    if (typeof puter !== 'undefined') {
      setIsPuterReady(true);
      recorder.current = new MicRecorder({ bitRate: 128 });
    }
  }, []);

  const narrateQuestion = useCallback(async (question: string) => {
    if (!isPuterReady) return;
    setSessionState('narrating');
    try {
      const audio = await puter.ai.txt2speech(question, { voice: 'Matthew', engine: 'neural', language: 'en-US' });
      audioPlayer.current = audio;
      audio.onended = () => setSessionState('listening');
      audio.play().catch(() => setSessionState('listening')); // Autoplay might fail
    } catch (error) {
      console.error('Narration failed:', error);
      setSessionState('listening'); // Fail gracefully
    }
  }, [isPuterReady]);

  const startSession = async (themeKey: string) => {
    if (!isPuterReady) {
      toast({ variant: 'destructive', title: 'AI Feature Not Available' });
      return;
    }

    setSessionState('loading_questions');
    setSelectedTheme(themeKey as ThemeKey);
    setAllAnswers([]);

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
        await narrateQuestion(parsedQuestions[0]);
      } else {
        throw new Error('AI did not return valid questions.');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast({ variant: 'destructive', title: 'Could Not Start Session' });
      setSessionState('idle');
    }
  };

  const handleStartRecording = async () => {
    if (!recorder.current) return;
    setSessionState('recording');
    try {
      await recorder.current.start();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not start recording.' });
      setSessionState('listening');
    }
  };

  const handleStopRecording = async () => {
    if (!recorder.current) return;
    setSessionState('transcribing');
    try {
      const [buffer, blob] = await recorder.current.stop().getMp3();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const transcriptionResult = await puter.ai.speech2txt(base64data);
        const newAnswer: Answer = {
          question: questions[currentQuestionIndex],
          answer: transcriptionResult.text,
        };
        const updatedAnswers = [...allAnswers, newAnswer];
        setAllAnswers(updatedAnswers);

        if (currentQuestionIndex < questions.length - 1) {
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          await narrateQuestion(questions[nextIndex]);
        } else {
          saveJournalEntry(updatedAnswers);
        }
      };
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Transcription Failed' });
      setSessionState('listening');
    }
  };
  
  const saveJournalEntry = async (finalAnswers: Answer[]) => {
    if (!user || !firestore) return;
    setSessionState('saving');

    const formattedContent = finalAnswers
      .map(a => `> ${a.question}\n\n${a.answer}`)
      .join('\n\n---\n\n');
    
    const title = selectedTheme ? THEMES[selectedTheme] : 'Guided Session';
    const finalContent = `# ${title}\n\n${formattedContent}`;
    
    const tags = selectedTheme ? [selectedTheme.replace(/_/g, ' ')] : ['guided session'];
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

    toast({ title: 'Entry Saved!', description: 'Your guided session has been saved.' });
    setSessionState('complete');
  };

  const resetSession = () => {
    setSessionState('idle');
    setSelectedTheme(null);
    setQuestions([]);
    setAllAnswers([]);
    setCurrentQuestionIndex(0);
    if(audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current = null;
    }
  };

  const getSessionCardContent = () => {
    switch (sessionState) {
      case 'idle':
        return (
          <div className="space-y-4">
            <label className="font-medium">Choose a theme to begin:</label>
            <Select onValueChange={(value) => startSession(value)} disabled={!isPuterReady}>
              <SelectTrigger>
                <SelectValue placeholder={!isPuterReady ? "Initializing AI..." : "Select a theme..."} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(THEMES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'loading_questions':
      case 'saving':
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">
              {sessionState === 'loading_questions' ? 'Preparing your session...' : 'Saving your entry...'}
            </p>
          </div>
        );
      
      case 'complete':
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 text-green-600 dark:text-green-400 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Session Complete!</h3>
                <p className="text-foreground/90 mb-6">Your entry has been saved to your journal history.</p>
                <Button onClick={resetSession}>Start a New Session</Button>
            </div>
        );
        
      case 'narrating':
      case 'listening':
      case 'recording':
      case 'transcribing':
        return (
          <div className="space-y-6">
            <div className={cn(
              "text-center p-6 rounded-lg transition-colors",
              sessionState === 'narrating' ? 'bg-primary/20' : 'bg-secondary/30'
            )}>
              <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
                <Bot className="h-4 w-4" />
                {sessionState === 'narrating' ? 'Guide is speaking...' : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
              </p>
              <h3 className="text-xl font-semibold text-foreground">
                <Balancer>{questions[currentQuestionIndex]}</Balancer>
              </h3>
            </div>
            
            <div className="space-y-4">
              {allAnswers.map((item, index) => (
                <div key={index} className="p-4 bg-background border rounded-lg text-sm">
                  <p className="font-semibold text-muted-foreground italic">"{item.question}"</p>
                  <p className="text-foreground/80 mt-2 whitespace-pre-wrap">{item.answer}</p>
                </div>
              ))}
            </div>

            {sessionState === 'transcribing' && (
              <div className="flex items-center justify-center p-4 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Transcribing your thoughts...
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getSessionCardFooter = () => {
    switch (sessionState) {
        case 'listening':
            return (
                <Button onClick={handleStartRecording} size="lg" className='w-full sm:w-auto'>
                    <Mic className="mr-2" />
                    Record Your Answer
                </Button>
            );
        case 'recording':
            return (
                <Button onClick={handleStopRecording} size="lg" variant="destructive" className='w-full sm:w-auto'>
                    <StopCircle className="mr-2 animate-pulse" />
                    Stop Recording
                </Button>
            );
        default:
            return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice-Guided Journaling</CardTitle>
        <CardDescription>
          Let an AI guide lead you through a reflective session. Just listen and speak your mind.
        </CardDescription>
      </CardHeader>

      <CardContent className="min-h-[200px]">
        {getSessionCardContent()}
      </CardContent>

      {sessionState !== 'idle' && sessionState !== 'complete' && sessionState !== 'loading_questions' && sessionState !== 'saving' && (
        <CardFooter className="flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <BookCopy className="h-4 w-4"/>
            <span>Entry will be saved automatically.</span>
          </div>
          <div className="flex justify-end">
            {getSessionCardFooter()}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
