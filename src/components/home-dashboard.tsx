
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { JournalEntry, UserSettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { Target, Wand, Loader2 } from 'lucide-react';
import Balancer from 'react-wrap-balancer';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

declare const puter: any;

interface HomeDashboardProps {
  user: User;
  entries: JournalEntry[];
  settings: UserSettings | null;
}

const DEFAULT_GOAL = 3;

export function HomeDashboard({ user, entries, settings }: HomeDashboardProps) {
  const { toast } = useToast();
  const [inspiration, setInspiration] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const generateInspiration = async () => {
      if (typeof puter === 'undefined') {
          toast({
              variant: 'destructive',
              title: 'AI Not Available',
              description: 'The inspiration service could not be loaded.'
          });
          return;
      }
      setIsGenerating(true);
      
      const prompt = `You are an insightful and creative journaling assistant. Your task is to generate a single, open-ended, and thought-provoking journal prompt for a user.
The prompt should encourage self-reflection, mindfulness, or creativity. Avoid simple "yes/no" questions. Make it personal and gentle.
Generate one new prompt.`;

      try {
        const aiResponse = await puter.ai.chat(prompt);
        setInspiration(aiResponse.message.content);
      } catch (error) {
        console.error("Error generating inspiration:", error);
        toast({ variant: 'destructive', title: 'Could not generate prompt.' });
      } finally {
        setIsGenerating(false);
      }
  }

  // Generate inspiration on component mount
  useEffect(() => {
    generateInspiration();
  }, []);

  const dashboardData = useMemo(() => {
    const goal = settings?.goal ?? DEFAULT_GOAL;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    if (!entries || entries.length === 0) {
      return {
        goal,
        weeklyProgress: 0,
        progressPercentage: 0,
      };
    }

    const entriesThisWeek = entries.filter(entry => isWithinInterval((entry.date as any).toDate(), { start: weekStart, end: weekEnd }));
    const uniqueDays = new Set(entriesThisWeek.map(entry => format((entry.date as any).toDate(), 'yyyy-MM-dd')));
    const weeklyProgress = uniqueDays.size;
    const progressPercentage = Math.min((weeklyProgress / goal) * 100, 100);

    return {
      goal,
      weeklyProgress,
      progressPercentage,
    };
  }, [entries, settings]);


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold font-headline">
          <Balancer>{getGreeting()}.</Balancer>
        </h2>
        <p className="text-muted-foreground">Ready to reflect?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Inspirational Prompt */}
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand className="h-5 w-5 text-primary" />
                    A Prompt for Today
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center min-h-[120px]">
                {isGenerating ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : inspiration ? (
                    <blockquote className="text-lg italic text-foreground/90">"{inspiration}"</blockquote>
                ) : (
                    <p className="text-muted-foreground">Could not load a prompt. Try generating a new one.</p>
                )}
            </CardContent>
             <CardFooter>
                <Button variant="ghost" onClick={generateInspiration} disabled={isGenerating}>
                    <Wand className="mr-2 h-4 w-4" />
                    Get another one
                </Button>
            </CardFooter>
        </Card>

        {/* Weekly Goal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You've written on {dashboardData.weeklyProgress} out of {dashboardData.goal} days this week.
              </p>
              <Progress value={dashboardData.progressPercentage} />
               {dashboardData.weeklyProgress >= dashboardData.goal && (
                <p className="text-sm font-semibold text-green-600 dark:text-green-400 pt-2">
                  Goal achieved! Great job!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
