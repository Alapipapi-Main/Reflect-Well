
'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { sendEmailVerification, reload } from 'firebase/auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { MailCheck, Loader2 } from 'lucide-react';
import { UserMenu } from './user-menu';
import { useRouter } from 'next/navigation';

interface EmailVerificationGateProps {
  user: User;
}

export function EmailVerificationGate({ user }: EmailVerificationGateProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  // Effect to force light theme
  useEffect(() => {
    const root = document.documentElement;
    // Store original classes to restore them on unmount
    const originalClasses = root.className;
    
    // Force light mode by removing 'dark' and adding 'light'
    root.classList.remove('dark');
    root.classList.add('light');

    // Cleanup function to run when the component unmounts
    return () => {
      // Restore the original classes, which will respect the user's
      // system/saved preference on other pages.
      root.className = originalClasses;
    };
  }, []);

  // Poll for verification status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      // It's important to get the latest user object before reloading
      const currentUser = user;
      if (currentUser && !currentUser.emailVerified) {
        try {
          await reload(currentUser);
          // After reloading, the `user` object in the parent component's state
          // will be updated by the `onAuthStateChanged` listener if `emailVerified` changed.
          // This will cause a re-render and this component will no longer be shown.
          // We can check it here as well for an immediate redirect.
          if (currentUser.emailVerified) {
            clearInterval(interval);
            toast({
              title: "Email Verified!",
              description: "Refreshing your journal...",
            });
            window.location.reload();
          }
        } catch (err: any) {
          console.warn("Polling for user reload failed silently:", err.code);
          // Stop polling if we get an error that indicates the user is no longer valid
          if (err.code === 'auth/user-token-expired' || err.code === 'auth/user-not-found') {
            clearInterval(interval);
          }
        }
      } else if (currentUser?.emailVerified) {
        // If user is verified, we can stop polling.
        clearInterval(interval);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [user, router, toast]);

  const handleResendVerification = async () => {
    setIsSending(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
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
        <UserMenu user={user} showThemeToggle={false} />
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
              Once you've verified, this page will automatically update.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
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
