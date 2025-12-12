'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { applyActionCode } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!oobCode) {
      setErrorMessage('Invalid verification link. Please try again from your email.');
      setStatus('error');
      return;
    }

    const verifyEmail = async () => {
      try {
        await applyActionCode(auth, oobCode);
        setStatus('success');
        // Give user a moment to see the success message before redirecting
        setTimeout(() => {
          router.push('/journal');
        }, 3000);
      } catch (error: any) {
        let message = 'An unknown error occurred.';
        if (error.code === 'auth/expired-action-code') {
          message = 'This verification link has expired. Please request a new one.';
        } else if (error.code === 'auth/invalid-action-code') {
          message = 'This verification link is invalid. It may have already been used.';
        } else if (error.code === 'auth/user-disabled') {
          message = 'Your account has been disabled.';
        }
        setErrorMessage(message);
        setStatus('error');
      }
    };

    verifyEmail();
  }, [oobCode, auth, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <CardHeader>
              <CardTitle>Verifying Your Email</CardTitle>
              <CardDescription>Please wait a moment...</CardDescription>
            </CardHeader>
            <CardContent>
              <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
            </CardContent>
          </>
        )}

        {status === 'success' && (
          <>
            <CardHeader>
              <CardTitle className='flex items-center justify-center gap-2'>
                <CheckCircle className="h-8 w-8 text-green-500" />
                Email Verified!
              </CardTitle>
              <CardDescription>Thank you for verifying your email address.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You will be redirected to your journal shortly.</p>
              <Loader2 className="h-8 w-8 mx-auto mt-4 animate-spin text-primary" />
            </CardContent>
          </>
        )}

        {status === 'error' && (
          <>
            <CardHeader>
              <CardTitle className='flex items-center justify-center gap-2'>
                <XCircle className="h-8 w-8 text-destructive" />
                Verification Failed
              </CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login">Back to Login</Link>
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}


export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    )
}
