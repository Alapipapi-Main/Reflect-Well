
"use client"

import { useState } from "react"
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
import { Loader2, Sparkles, Wand } from "lucide-react"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { format } from "date-fns"
import { Textarea } from "./ui/textarea"

declare const puter: any;

interface AskJournalProps {
  entries: JournalEntry[]
}

export function AskJournal({ entries }: AskJournalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<string | null>(null)

  const handleAskJournal = async () => {
    if (typeof puter === 'undefined') {
      toast({
        variant: "destructive",
        title: "AI Feature Not Available",
        description: "The AI service could not be loaded.",
      });
      return;
    }
    
    if (entries.length < 1) {
      toast({
        variant: "destructive",
        title: "Not Enough Entries",
        description: "You need at least one journal entry to ask a question.",
      });
      return;
    }

    if (!question.trim()) {
        toast({
            variant: "destructive",
            title: "Question Required",
            description: "Please enter a question to ask your journal.",
        });
        return;
    }

    setIsLoading(true);
    setAnswer(null);

    const formattedEntries = entries
      .sort((a, b) => (a.date as any).toDate().getTime() - (b.date as any).toDate().getTime())
      .map(entry => {
        const date = format((entry.date as any).toDate(), "EEEE, MMMM d, yyyy");
        const mood = MOODS[entry.mood].label;
        const tags = entry.tags && entry.tags.length > 0 ? `Tags: ${entry.tags.join(', ')}\n` : '';
        const voiceMemo = entry.audioUrl ? `(Voice memo attached)\n` : '';
        const content = entry.content || '(No text content)';
        return `Date: ${date}\nMood: ${mood}\n${tags}${voiceMemo}Entry: "${content}"`;
      }).join("\n\n---\n\n");

    const prompt = `You are an AI assistant with access to a user's private journal. Your task is to answer the user's question based *only* on the content and associated tags of their journal entries provided below.

- Your tone should be helpful, private, and aligned with the reflective nature of a journal.
- Synthesize information from multiple entries if necessary to form a comprehensive answer.
- Pay close attention to the provided tags (e.g., 'work', 'gratitude') as they provide important context.
- Some entries may have a "(Voice memo attached)" note. If the text does not contain the answer, but the entry seems relevant, you should mention that the answer might be in the voice memo. For example: "On May 5th, you wrote about your project, and a voice memo was attached. The details might be in there."
- If the journal does not contain information to answer the question, you MUST explicitly state that. For example, say "I couldn't find any entries in your journal that mention that."
- Do not make up information or answer questions that are not related to the journal's content.
- Quote short, relevant snippets from the journal entries to support your answer where appropriate. Always cite the date of the entry you're quoting.

**User's Question:**
"${question}"

**User's Journal Entries (including content and tags):**
${formattedEntries}
`;

    try {
      const aiResponse = await puter.ai.chat(prompt);
      setAnswer(aiResponse.message.content);
    } catch (error) {
      console.error("Error getting AI answer from Puter.ai:", error);
      toast({
        variant: "destructive",
        title: "AI Search Failed",
        description: "Could not get an answer from your journal at this time.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask Your Journal</CardTitle>
        <CardDescription>
          Ask a question in natural language and get answers based on your past entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea 
          placeholder="e.g., When did I last write about feeling proud of my work?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          disabled={isLoading}
        />
        {answer && (
          <div className="p-4 bg-secondary/50 border rounded-lg space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="text-primary" /> Answer from your Journal</h3>
            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{answer}</p>
          </div>
        )}
        {isLoading && !answer && (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Searching your journal...
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAskJournal} disabled={isLoading || entries.length < 1}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Wand className="mr-2 h-4 w-4" />
              Ask Question
            </>
          )}
        </Button>
      </CardFooter>
      {entries.length < 1 && (
         <p className="px-6 pb-4 text-sm text-muted-foreground -mt-4">
            You need at least one journal entry to ask a question.
        </p>
      )}
    </Card>
  );
}
