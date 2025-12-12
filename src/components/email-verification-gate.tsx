'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import { sendEmailVerification } from 'firebase/auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { MailCheck, Loader2 } from 'lucide-react';
import { UserMenu } from './user-menu';

interface EmailVerificationGateProps {
  user: User;
}

export function EmailVerificationGate({ user }: EmailVerificationGateProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

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
              Once you've verified, this page will automatically update.
            </p>
            <div>
              <Button onClick={handleResendVerification} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
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
