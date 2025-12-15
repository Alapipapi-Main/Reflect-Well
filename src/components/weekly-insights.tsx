
"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, Wand, Star } from "lucide-react"
import type { JournalEntry, Mood } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { format, subDays } from "date-fns"
import { Badge } from "./ui/badge"

declare const puter: any;

interface WeeklyInsightsProps {
  entries: JournalEntry[]
}

export function WeeklyInsights({ entries }: WeeklyInsightsProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<{ mostFrequentMood: Mood | null; topTags: string[] }>({
    mostFrequentMood: null,
    topTags: [],
  });

  const weeklyEntries = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return entries.filter(entry => {
      const entryDate = entry.date ? (entry.date as any).toDate() : new Date(0);
      return entryDate >= sevenDaysAgo;
    });
  }, [entries]);

  const calculateWeeklyStats = () => {
    if (weeklyEntries.length === 0) {
      return { mostFrequentMood: null, topTags: [] };
    }

    // Calculate most frequent mood
    const moodCounts = weeklyEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<Mood, number>);

    let mostFrequentMood: Mood | null = null;
    let maxMoodCount = 0;
    for (const mood in moodCounts) {
      if (moodCounts[mood as Mood] > maxMoodCount) {
        maxMoodCount = moodCounts[mood as Mood];
        mostFrequentMood = mood as Mood;
      }
    }

    // Calculate top tags
    const tagCounts = weeklyEntries.flatMap(entry => entry.tags || []).reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(item => item[0]);

    return { mostFrequentMood, topTags };
  };


  const handleGenerateSummary = async () => {
    if (typeof puter === 'undefined') {
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI insights service could not be loaded.",
      });
      return;
    }
    
    if (weeklyEntries.length < 2) {
      toast({
        variant: "destructive",
        title: "Not Enough Entries",
        description: "You need at least two journal entries in the last 7 days to generate a summary.",
      });
      return;
    }

    setIsLoading(true);
    setSummary(null);

    const stats = calculateWeeklyStats();
    setWeeklyStats(stats);

    const formattedEntries = weeklyEntries
      .sort((a, b) => (a.date as any).toDate().getTime() - (b.date as any).toDate().getTime())
      .map(entry => {
        const date = format((entry.date as any).toDate(), "EEEE, MMMM d");
        const mood = MOODS[entry.mood].label;
        const tags = entry.tags && entry.tags.length > 0 ? `Tags: ${entry.tags.join(', ')}` : '';
        return `Date: ${date}\nMood: ${mood}\n${tags}Entry: "${entry.content}"`;
      }).join("\n\n---\n\n");
    
    const statsContext = `
This week's primary mood was: ${stats.mostFrequentMood ? MOODS[stats.mostFrequentMood].label : 'varied'}.
The most common themes (tags) were: ${stats.topTags.length > 0 ? stats.topTags.join(', ') : 'not specified'}.
`;

    const prompt = `You are a compassionate and insightful journaling companion named ReflectWell. Your role is to analyze a user's journal entries from the past week and provide a gentle, high-level summary that helps them see patterns and themes.

- Your tone should be warm, encouraging, and empathetic.
- Look for recurring moods, topics, or shifts in feeling.
- Use the provided weekly stats to inform your summary. For example, if the primary mood was "Sad" and a common tag was "work", you could gently connect these themes.
- Synthesize the user's feelings and experiences into a short, cohesive narrative (2-4 sentences).
- Do NOT give advice, pass judgment, or use clinical language.
- Frame your observations gently, using phrases like "It seems like..." or "I notice that...".
- End with a soft, open-ended question to encourage further reflection.
- Keep the entire response to a maximum of 5 sentences.

**Weekly Stats:**
${statsContext}

**User's Journal Entries:**
${formattedEntries}
`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      setSummary(aiResponse.message.content);
    } catch (error) {
      console.error("Error getting AI summary from Puter.ai:", error);
      toast({
        variant: "destructive",
        title: "AI Summary Failed",
        description: "Could not generate a summary for your week.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription>
          Generate an AI-powered summary to reflect on the themes and moods of your past week.
        </CardDescription>
        {(summary || isLoading) && (
          <div className="p-4 bg-secondary/50 border rounded-lg space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="text-primary" /> Your Weekly Reflection</h3>
            {summary && <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{summary}</p>}
            {isLoading && (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating your weekly insights...
              </div>
            )}
            {!isLoading && weeklyStats.mostFrequentMood && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">This Week's Highlights</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  {weeklyStats.mostFrequentMood && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">Top Mood:</span>
                      <div className="flex items-center gap-1 font-semibold">
                        <span className="text-xl">{MOODS[weeklyStats.mostFrequentMood].emoji}</span>
                        <span>{MOODS[weeklyStats.mostFrequentMood].label}</span>
                      </div>
                    </div>
                  )}
                  {weeklyStats.topTags.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                       <span className="font-medium text-muted-foreground">Top Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {weeklyStats.topTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateSummary} disabled={isLoading || weeklyEntries.length < 2}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand className="mr-2 h-4 w-4" />
              <span className="sm:hidden">Generate Summary</span>
              <span className="hidden sm:inline">Generate Your Weekly Summary</span>
            </>
          )}
        </Button>
      </CardFooter>
      {weeklyEntries.length < 2 && (
         <p className="px-6 pb-4 text-sm text-muted-foreground -mt-4">
            You need at least two journal entries in the last 7 days to generate a summary. You currently have {weeklyEntries.length}.
        </p>
      )}
    </Card>
  );
}
