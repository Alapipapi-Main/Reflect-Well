
'use client'

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JournalForm } from "@/components/journal-form"
import { PastEntries } from "@/components/past-entries"
import { MoodChart } from "@/components/mood-chart"
import { BookHeart, Loader, ChevronDown } from "lucide-react"
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
import { JournalGoals } from '@/components/journal-goals';
import { GuidedJournaling } from '@/components/guided-journaling';
import { GratitudeWall } from '@/components/gratitude-wall';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';

function JournalPageContent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [isSubmittingNewEntry, setIsSubmittingNewEntry] = useState(false);
  const [activeTab, setActiveTab] = useState("new-entry");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'journalEntries'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: rawEntries, isLoading: areEntriesLoading } = useCollection<JournalEntry>(journalEntriesQuery);

  const entries = useMemo(() => {
    if (!rawEntries) return [];
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

  const DropdownTabs = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 md:hidden">
          More <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setActiveTab('guided')}>Guided Journaling</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setActiveTab('gratitude')}>Gratitude Wall</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setActiveTab('insights')}>Weekly Insights</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setActiveTab('stats')}>Journal Stats</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setActiveTab('goals')}>Journal Goals</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setActiveTab('yesterday')}>Yesterday's Reflection</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setActiveTab('on-this-day')}>On This Day</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center">
                <TabsList className="p-2 h-auto bg-muted/50 flex-wrap justify-center">
                  <TabsTrigger value="new-entry">New Entry</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="ask">Ask</TabsTrigger>
                  <div className="hidden md:flex">
                    <TabsTrigger value="guided">Guided Journaling</TabsTrigger>
                    <TabsTrigger value="gratitude">Gratitude Wall</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                  </div>
                  <DropdownTabs />
                </TabsList>
            </div>
          
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
