'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JournalForm } from "@/components/journal-form"
import { PastEntries } from "@/components/past-entries"
import { MoodChart } from "@/components/mood-chart"
import { BookHeart, Loader } from "lucide-react"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import type { JournalEntry } from "@/lib/types"
import { UserMenu } from '@/components/user-menu';
import { EmailVerificationGate } from '@/components/email-verification-gate';

export default function JournalPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

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

  const { data: entries, isLoading: areEntriesLoading } = useCollection<JournalEntry>(journalEntriesQuery);

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
    <main className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <BookHeart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-4xl font-headline font-bold">ReflectWell</h1>
        </div>
        <UserMenu user={user} />
      </header>
      <p className="text-muted-foreground mb-8 -mt-6">Your personal space for daily reflection and mindfulness.</p>
      
      <Tabs defaultValue="new-entry" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new-entry">New Entry</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="new-entry" className="mt-6">
          <JournalForm />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <PastEntries entries={entries || []} />
        </TabsContent>
        <TabsContent value="trends" className="mt-6">
          <MoodChart entries={entries || []} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
