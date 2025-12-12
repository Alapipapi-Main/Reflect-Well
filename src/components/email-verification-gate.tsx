'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { sendEmailVerification, reload } from 'firebase/auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { MailCheck, Loader2, RefreshCw } from 'lucide-react';
import { UserMenu } from './user-menu';
import { useRouter } from 'next/navigation';

interface EmailVerificationGateProps {
  user: User;
}

export function EmailVerificationGate({ user }: EmailVerificationGateProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Function to reload the user and check verification status
  const handleReload = async () => {
    if (isReloading) return;
    setIsReloading(true);
    try {
      // The user object needs to be reloaded to get the latest emailVerified status
      await reload(user);
      // After reload, the onAuthStateChanged listener in FirebaseProvider
      // will fire if the user object has changed (e.g., emailVerified is now true),
      // which will cause the parent component to re-render and this gate to be removed.
      if (user.emailVerified) {
        toast({
            title: "Email Verified!",
            description: "Redirecting to your journal...",
        });
        router.push('/journal');
      } else {
        toast({
            title: "Status Checked",
            description: "Email not verified yet. Please check your inbox.",
        });
      }
    } catch (error) {
      console.error('Error reloading user:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Check Status',
        description: 'Could not check your verification status. Please try again in a moment.',
      });
    } finally {
      setIsReloading(false);
    }
  };

  // Poll for verification status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      // Make sure we have the latest user data before reloading
      if (user && !user.emailVerified) {
        await reload(user).catch(err => {
          // Errors are expected if the user is signed out, the network is down, etc.
          // We can silently ignore them during polling as to not bother the user.
          console.warn("Polling for user reload failed silently:", err.code);
          // Stop polling if we get an error that indicates the user is no longer valid
          if (err.code === 'auth/user-token-expired' || err.code === 'auth/user-not-found') {
            clearInterval(interval);
          }
        });

        // After reload, the user object might be updated.
        // We need to check its `emailVerified` status again.
        if (user.emailVerified) {
          clearInterval(interval);
          toast({
              title: "Email Verified!",
              description: "Redirecting to your journal...",
          });
          router.push('/journal');
        }
      } else if (user.emailVerified) {
        // If user is verified, we can stop polling and redirect.
        clearInterval(interval);
        router.push('/journal');
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [user, router, toast]);


  const handleResendVerification = async () => {
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox (and spam folder) for the verification link.',
      });
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send Email',
        description: error.code === 'auth/too-many-requests' 
          ? 'You have requested this too many times. Please wait a while before trying again.'
          : 'An error occurred. Please try again later.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
       <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end items-center">
        <UserMenu user={user} />
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
              <MailCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{user.email}</strong>. Please check your inbox to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once you've verified, this page will automatically update. You can also check manually.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={handleReload} disabled={isReloading}>
                {isReloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    I've Verified
                  </>
                )}
              </Button>
              <Button onClick={handleResendVerification} disabled={isSending} variant="secondary">
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Email"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Can't find the email? Make sure to check your spam or junk folder.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
