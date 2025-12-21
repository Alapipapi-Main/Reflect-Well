
'use client'

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JournalForm } from "@/components/journal-form"
import { PastEntries } from "@/components/past-entries"
import { MoodChart } from "@/components/mood-chart"
import { BookHeart, Loader, MoreHorizontal, PlusCircle, BookOpen, TrendingUp } from "lucide-react"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import type { JournalEntry, JournalTemplate, TimeCapsuleEntry } from "@/lib/types"
import { UserMenu } from '@/components/user-menu';
import { EmailVerificationGate } from '@/components/email-verification-gate';
import { WeeklyInsights } from '@/components/weekly-insights';
import { YesterdaysReflection } from '@/components/yesterdays-reflection';
import { JournalStats } from '@/components/journal-stats';
import { OnThisDay } from '@/components/on-this-day';
import { AskJournal } from '@/components/ask-journal';
import { JournalGoals } from '@/components/journal-goals';
import { GuidedJournaling } from '@/components/guided-journaling';
import { GratitudeWall } from '@/components/gratitude-wall';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { VisualPrompt } from '@/components/visual-prompt';
import { TemplateManager } from '@/components/template-manager';
import { TimeCapsuleManager } from '@/components/time-capsule-manager';
import { DreamInterpreter } from '@/components/dream-interpreter';
import { MoreFeaturesSheet } from '@/components/more-features-sheet';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';

function JournalPageContent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [isSubmittingNewEntry, setIsSubmittingNewEntry] = useState(false);
  const [activeTab, setActiveTab] = useState("new-entry");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  const templatesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'templates'), orderBy('title'));
  }, [firestore, user]);
  
  const timeCapsulesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'timeCapsules'), orderBy('lockUntil', 'desc'));
  }, [firestore, user]);

  const { data: rawEntries, isLoading: areEntriesLoading } = useCollection<JournalEntry>(journalEntriesQuery);
  const { data: templates, isLoading: areTemplatesLoading } = useCollection<JournalTemplate>(templatesQuery);
  const { data: timeCapsules, isLoading: areTimeCapsulesLoading } = useCollection<TimeCapsuleEntry>(timeCapsulesQuery);

  const entries = useMemo(() => {
    if (!rawEntries) return [];
    return [...rawEntries].sort((a, b) => {
      const dateA = a.date ? (a.date as any).toDate() : new Date(0);
      const dateB = b.date ? (b.date as any).toDate() : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
  }, [rawEntries]);

  if (isUserLoading || !user || areEntriesLoading || areTemplatesLoading || areTimeCapsulesLoading) {
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
                <TabsList className="p-1.5 h-auto flex-wrap justify-center gap-1.5">
                  <TabsTrigger value="new-entry">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Entry
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <BookOpen className="mr-2 h-4 w-4" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="trends">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Trends
                  </TabsTrigger>
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <button
                            data-state={isSheetOpen ? 'active' : 'inactive'}
                            className={cn(
                              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md',
                              !isSheetOpen && 'text-muted-foreground'
                            )}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className='ml-2'>More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent>
                        <MoreFeaturesSheet setActiveTab={setActiveTab} />
                    </SheetContent>
                  </Sheet>
                </TabsList>
            </div>
          
          <TabsContent value="new-entry" className="mt-6 space-y-6">
            <JournalForm 
              entries={entries || []} 
              onSubmittingChange={setIsSubmittingNewEntry}
              templates={templates || []}
            />
          </TabsContent>
          <TabsContent value="visual-prompt" className="mt-6">
            <VisualPrompt onSubmittingChange={setIsSubmittingNewEntry} />
          </TabsContent>
          <TabsContent value="templates" className="mt-6">
            <TemplateManager templates={templates || []} />
          </TabsContent>
          <TabsContent value="time-capsule" className="mt-6">
            <TimeCapsuleManager timeCapsules={timeCapsules || []} />
          </TabsContent>
          <TabsContent value="dream-interpreter" className="mt-6">
            <DreamInterpreter />
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
  );
}

export default function JournalPage() {
  return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <JournalPageContent />
      </ThemeProvider>
  )
}
