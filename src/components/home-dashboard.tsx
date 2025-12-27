
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { JournalEntry, UserSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { Target, Wand, Loader2, BookCheck, Sparkles } from 'lucide-react';
import Balancer from 'react-wrap-balancer';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { MOODS } from '@/lib/constants';
import Image from 'next/image';

declare const puter: any;

interface HomeDashboardProps {
  user: User;
  entries: JournalEntry[];
  settings: UserSettings | null;
}

const DEFAULT_GOAL = 3;

const VISUAL_PROMPTS = [
    "A dreamy landscape representing new beginnings, pastel colors, ethereal, soft light.",
    "An abstract visualization of inner peace, flowing lines, cool tones of blue and green, tranquil.",
    "The feeling of a breakthrough moment, explosive light, dynamic shapes, vibrant energy.",
    "A cozy, safe space for quiet reflection, warm tones, soft textures, gentle shadows.",
    "The essence of joyful energy, bright yellows and oranges, sunburst patterns, playful.",
    "A representation of overcoming a challenge, a single light source in a dark space, sense of hope.",
    "The feeling of nostalgia and memory, sepia tones, blurry edges, dreamlike quality."
];

export function HomeDashboard({ user, entries, settings }: HomeDashboardProps) {
  const { toast } = useToast();
  const [inspirationUrl, setInspirationUrl] = useState<string | null>(null);
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
      setInspirationUrl(null);
      
      const randomPrompt = VISUAL_PROMPTS[Math.floor(Math.random() * VISUAL_PROMPTS.length)];
      const fullPrompt = `Generate a beautiful, abstract, and artistic image that is evocative and inspires emotion. Style: ethereal, painterly. Theme: ${randomPrompt}`;

      try {
        const imageElement = await puter.ai.txt2img(fullPrompt, {});
        setInspirationUrl(imageElement.src);
      } catch (error) {
        console.error("Error generating inspiration:", error);
        toast({ variant: 'destructive', title: 'Could not generate image.' });
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
    const latestEntry = entries && entries.length > 0 ? entries[entries.length - 1] : null;

    if (!entries || entries.length === 0) {
      return {
        goal,
        weeklyProgress: 0,
        progressPercentage: 0,
        latestEntry: null,
      };
    }
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const entriesThisWeek = entries.filter(entry => {
      if (!entry.date) return false;
      const entryDate = (entry.date as any).toDate();
      return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
    });
    const uniqueDays = new Set(entriesThisWeek.map(entry => format((entry.date as any).toDate(), 'yyyy-MM-dd')));
    const weeklyProgress = uniqueDays.size;
    const progressPercentage = Math.min((weeklyProgress / goal) * 100, 100);

    return {
      goal,
      weeklyProgress,
      progressPercentage,
      latestEntry,
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
        
        {/* Inspirational Image */}
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Inspirational Image
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center text-center min-h-[120px]">
                {isGenerating ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : inspirationUrl ? (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                        <Image src={inspirationUrl} alt="AI-generated visual prompt" layout="fill" objectFit="cover" />
                    </div>
                ) : (
                    <p className="text-muted-foreground">Could not load an image. Try generating a new one.</p>
                )}
            </CardContent>
            <div className="p-6 pt-0">
                <Button variant="ghost" onClick={generateInspiration} disabled={isGenerating} className="w-full">
                    <Wand className="mr-2 h-4 w-4" />
                    Get another one
                </Button>
            </div>
        </Card>
        
        {/* Latest Reflection */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookCheck className="h-5 w-5 text-primary" />
                    Latest Reflection
                </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[120px]">
                {dashboardData.latestEntry ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format((dashboardData.latestEntry.date as any).toDate(), "MMMM d, yyyy")}</span>
                            <span className="text-lg">{MOODS[dashboardData.latestEntry.mood].emoji}</span>
                        </div>
                        <p className="text-foreground/90 line-clamp-3 italic">
                           "{dashboardData.latestEntry.content}"
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground">
                        <p>Your most recent entry will appear here.</p>
                    </div>
                )}
            </CardContent>
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
