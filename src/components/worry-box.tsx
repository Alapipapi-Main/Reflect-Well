
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
import type { WorryPost } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import Balancer from 'react-wrap-balancer';

export function WorryBox() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const worryBoxQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'worryBox'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: posts, isLoading: arePostsLoading } = useCollection<WorryPost>(worryBoxQuery);

  const handleSubmitPost = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to release a worry.',
      });
      return;
    }
    if (postContent.trim().length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty Post',
        description: 'Please write down a worry to release it.',
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
      const worryBoxRef = collection(firestore, 'worryBox');
      await addDocumentNonBlocking(worryBoxRef, {
        text: postContent,
        createdAt: serverTimestamp(),
        authorId: user.uid,
      });
      setPostContent('');
      toast({
        title: 'Worry Released!',
        description: 'You have shared your worry with the void.',
      });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to Post',
            description: 'Could not release your worry at this time.',
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>The Worry Box</CardTitle>
        <CardDescription>
          <Balancer>
            An anonymous space to write down your worries and release them. You are not alone in your feelings.
          </Balancer>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            <Textarea
              placeholder="What's weighing on your mind...?"
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
                        Releasing...
                        </>
                    ) : (
                        <>
                        <Send className="mr-2 h-4 w-4" />
                        Release Worry
                        </>
                    )}
                 </Button>
            </div>
        </div>

        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Shared Worries</h3>
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
                                        Released {post.createdAt ? formatDistanceToNow((post.createdAt as any).toDate(), { addSuffix: true }) : 'just now'}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-full">
                        <Trash2 className="h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">The Box is Empty</h3>
                        <p>Be the first to release a worry and lighten your load.</p>
                    </div>
                )}
             </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
