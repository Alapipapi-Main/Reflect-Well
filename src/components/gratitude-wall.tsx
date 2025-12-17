
'use client';

import { useState } from 'react';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import type { GratitudePost } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

export function GratitudeWall() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gratitudeWallQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'gratitudeWall'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: posts, isLoading: arePostsLoading } = useCollection<GratitudePost>(gratitudeWallQuery);

  const handleSubmitPost = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to share your gratitude.',
      });
      return;
    }
    if (postContent.trim().length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty Post',
        description: 'Please write something you are grateful for.',
      });
      return;
    }
     if (postContent.trim().length > 280) {
      toast({
        variant: 'destructive',
        title: 'Post Too Long',
        description: 'Your message must be 280 characters or fewer.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const gratitudeWallRef = collection(firestore, 'gratitudeWall');
      await addDocumentNonBlocking(gratitudeWallRef, {
        text: postContent,
        createdAt: serverTimestamp(),
        authorId: user.uid, // Store authorId for rule validation, not for display
      });
      setPostContent('');
      toast({
        title: 'Gratitude Shared!',
        description: 'Thank you for contributing to the wall.',
      });
    } catch (error) {
        // The addDocumentNonBlocking will handle emitting the permission error
        // But we can show a generic toast here as a fallback for other types of errors.
        toast({
            variant: 'destructive',
            title: 'Failed to Post',
            description: 'Could not share your gratitude at this time.',
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>The Gratitude Wall</CardTitle>
        <CardDescription>
          Anonymously share something you're grateful for and read what others are thankful for. A collective space for positivity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            <Textarea
              placeholder="Today, I am grateful for..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={3}
              disabled={isSubmitting}
              maxLength={280}
            />
            <p className="text-xs text-muted-foreground text-right">
                {postContent.length} / 280
            </p>
            <div className="flex justify-end">
                 <Button onClick={handleSubmitPost} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sharing...
                        </>
                    ) : (
                        <>
                        <Send className="mr-2 h-4 w-4" />
                        Share Anonymously
                        </>
                    )}
                 </Button>
            </div>
        </div>

        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-center">What We're Grateful For</h3>
             <ScrollArea className="h-72 w-full rounded-md border p-4 bg-secondary/20">
                {arePostsLoading && (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {!arePostsLoading && posts && posts.length > 0 ? (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <Card key={post.id} className="bg-background/70 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-foreground/90 whitespace-pre-wrap">{post.text}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Shared {post.createdAt ? formatDistanceToNow((post.createdAt as any).toDate(), { addSuffix: true }) : 'just now'}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-full">
                        <Heart className="h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">The Wall is Waiting</h3>
                        <p>Be the first to share your gratitude and spread some positivity.</p>
                    </div>
                )}
             </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
