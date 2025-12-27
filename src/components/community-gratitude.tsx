
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { GratitudePost } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Heart, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { formatDistanceToNow } from 'date-fns';

export function CommunityGratitude() {
  const firestore = useFirestore();
  const [randomPost, setRandomPost] = useState<GratitudePost | null>(null);

  // Fetch the 10 most recent posts
  const gratitudeQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'gratitudeWall'), orderBy('createdAt', 'desc'), limit(10));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<GratitudePost>(gratitudeQuery);

  // Function to select a random post from the fetched posts
  const selectRandomPost = () => {
    if (posts && posts.length > 0) {
      const randomIndex = Math.floor(Math.random() * posts.length);
      setRandomPost(posts[randomIndex]);
    } else {
      setRandomPost(null);
    }
  };

  // Select a random post when the component mounts or when posts data changes
  useEffect(() => {
    selectRandomPost();
  }, [posts]);


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Community Gratitude
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center min-h-[120px]">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : randomPost ? (
          <div className="w-full">
            <blockquote className="text-lg italic text-foreground/90">
              “{randomPost.text}”
            </blockquote>
            <p className="text-sm text-muted-foreground mt-2">
              Shared {formatDistanceToNow((randomPost.createdAt as any).toDate(), { addSuffix: true })}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">The gratitude wall is waiting for its first post.</p>
        )}
      </CardContent>
      <div className="p-6 pt-0">
        <Button variant="ghost" onClick={selectRandomPost} disabled={isLoading || !posts || posts.length === 0} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          See Another
        </Button>
      </div>
    </Card>
  );
}
