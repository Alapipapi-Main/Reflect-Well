
'use client'

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JournalForm } from "@/components/journal-form"
import { PastEntries } from "@/components/past-entries"
import { MoodChart } from "@/components/mood-chart"
import { BookHeart, Loader, History } from "lucide-react"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import type { JournalEntry } from "@/lib/types"
import { UserMenu } from '@/components/user-menu';
import { EmailVerificationGate } from '@/components/email-verification-gate';
import { ThemeProvider } from '@/components/theme-provider';
import { WeeklyInsights } from '@/components/weekly-insights';
import { YesterdaysReflection } from '@/components/yesterdays-reflection';
import { JournalStats } from '@/components/journal-stats';
import { OnThisDay } from '@/components/on-this-day';
import { AskJournal } from '@/components/ask-journal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { JournalGoals } from '@/components/journal-goals';
import { GuidedJournaling } from '@/components/guided-journaling';
import { GratitudeWall } from '@/components/gratitude-wall';

function JournalPageContent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [isSubmittingNewEntry, setIsSubmittingNewEntry] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // We can keep the 'desc' order here as it's often efficient for 'latest' queries,
    // and we will reverse it client-side for chronological display.
    return query(
      collection(firestore, 'users', user.uid, 'journalEntries'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: rawEntries, isLoading: areEntriesLoading } = useCollection<JournalEntry>(journalEntriesQuery);

  const entries = useMemo(() => {
    if (!rawEntries) return [];
    // Sort once here to ensure chronological order (oldest first)
    return [...rawEntries].sort((a, b) => {
      const dateA = a.date ? (a.date as any).toDate() : new Date(0);
      const dateB = b.date ? (b.date as any).toDate() : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
  }, [rawEntries]);

  if (isUserLoading || !user || areEntriesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user.emailVerified) {
    return <EmailVerificationGate user={user} />;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <main className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <BookHeart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-headline font-bold">ReflectWell</h1>
          </div>
          <UserMenu user={user} entries={entries || []} />
        </header>
        <p className="text-muted-foreground mb-8 -mt-6">Your personal space for daily reflection and mindfulness.</p>
        
        <Tabs defaultValue="new-entry" className="w-full">
           <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="w-full justify-start sm:justify-center p-2 h-auto bg-muted/50">
              <TabsTrigger value="new-entry">New Entry</TabsTrigger>
              <TabsTrigger value="guided">Guided</TabsTrigger>
              <TabsTrigger value="gratitude">Gratitude</TabsTrigger>
              <TabsTrigger value="ask">Ask</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
              <TabsTrigger value="on-this-day">On This Day</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <TabsContent value="new-entry" className="mt-6 space-y-6">
            <JournalForm entries={entries || []} onSubmittingChange={setIsSubmittingNewEntry} />
          </TabsContent>
          <TabsContent value="guided" className="mt-6">
            <GuidedJournaling />
          </TabsContent>
          <TabsContent value="gratitude" className="mt-6">
            <GratitudeWall />
          </TabsContent>
          <TabsContent value="ask" className="mt-6">
            <AskJournal entries={entries || []} />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <PastEntries entries={entries || []} isFormSubmitting={isSubmittingNewEntry} />
          </TabsContent>
          <TabsContent value="trends" className="mt-6">
            <MoodChart entries={entries || []} />
          </TabsContent>
          <TabsContent value="insights" className="mt-6">
            <WeeklyInsights entries={entries || []} />
          </TabsContent>
          <TabsContent value="stats" className="mt-6">
            <JournalStats entries={entries || []} />
          </TabsContent>
          <TabsContent value="goals" className="mt-6">
            <JournalGoals entries={entries || []} />
          </TabsContent>
           <TabsContent value="yesterday" className="mt-6">
            <YesterdaysReflection entries={entries || []} />
          </TabsContent>
          <TabsContent value="on-this-day" className="mt-6">
            <OnThisDay entries={entries || []} />
          </TabsContent>
        </Tabs>
      </main>
    </ThemeProvider>
  );
}

export default function JournalPage() {
  return (
      <JournalPageContent />
  )
}
