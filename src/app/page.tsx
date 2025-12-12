'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { BookHeart, Feather, TrendingUp, Lock } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { usePublicPageTheme } from '@/hooks/use-public-page-theme';

export default function LandingPage() {
  usePublicPageTheme();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to the journal page.
    if (!isUserLoading && user) {
      router.replace('/journal');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    // Show a loading screen or nothing while checking auth/redirecting
    return (
      <div className="flex items-center justify-center h-screen">
        <BookHeart className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookHeart className="h-8 w-8 text-primary" />
          <h1 className="text-xl sm:text-2xl font-headline font-bold">ReflectWell</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" asChild className="px-2 sm:px-4">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="px-2 sm:px-4">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-16 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4">
              Your Personal Space for Mindfulness
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              ReflectWell is a simple, beautiful, and private journal to help you track your moods and understand your emotional well-being.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Your First Entry
                <Feather className="ml-2" />
              </Link>
            </Button>
            <div className="mt-12 rounded-lg shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <Image
                src="https://picsum.photos/seed/journal/1200/600"
                alt="ReflectWell app screenshot"
                width={1200}
                height={600}
                data-ai-hint="calm desk flatlay"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center mb-12 font-headline">Why You'll Love ReflectWell</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary/20 rounded-full p-4 mb-4">
                  <Feather className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Effortless Journaling</h4>
                <p className="text-muted-foreground">
                  A clean, distraction-free editor to capture your thoughts and feelings easily.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/20 rounded-full p-4 mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Visualize Your Mood</h4>
                <p className="text-muted-foreground">
                  Track your emotional trends over time with an insightful and beautiful chart.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/20 rounded-full p-4 mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Completely Private</h4>
                <p className="text-muted-foreground">
                  Your entries are your own. Securely stored and only accessible by you.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ReflectWell. All rights reserved.</p>
      </footer>
    </div>
  );
}
