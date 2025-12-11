import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JournalForm } from "@/components/journal-form"
import { PastEntries } from "@/components/past-entries"
import { MoodChart } from "@/components/mood-chart"
import { mockJournalEntries } from "@/lib/data"
import { BookHeart } from "lucide-react"

export default function Home() {
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
          <PastEntries entries={mockJournalEntries} />
        </TabsContent>
        <TabsContent value="trends" className="mt-6">
          <MoodChart entries={mockJournalEntries} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
