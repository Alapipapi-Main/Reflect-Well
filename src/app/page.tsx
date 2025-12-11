'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JournalForm } from "@/components/journal-form"
import { PastEntries } from "@/components/past-entries"
import { MoodChart } from "@/components/mood-chart"
import { BookHeart, Loader } from "lucide-react"
import { useUser } from "@/firebase/auth/use-user"
import { useCollection } from "@/firebase/firestore/use-collection"
import { collection, query, orderBy } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { useMemoFirebase } from "@/firebase"
import type { JournalEntry } from "@/lib/types"

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'journalEntries'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: entries, isLoading: areEntriesLoading } = useCollection<JournalEntry>(journalEntriesQuery);

  if (isUserLoading || areEntriesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <BookHeart className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-headline font-bold">ReflectWell</h1>
        </div>
        <p className="text-muted-foreground">Your personal space for daily reflection and mindfulness.</p>
      </header>
      
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
