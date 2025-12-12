'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookHeart, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  // Common state
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Password reset specific state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      setError('Invalid request. The link is missing required information.');
      setStatus('error');
      return;
    }

    const handleAction = async () => {
      try {
        switch (mode) {
          case 'resetPassword':
            await verifyPasswordResetCode(auth, oobCode);
            setStatus('ready'); // Ready to show the password reset form
            break;
          case 'verifyEmail':
            await applyActionCode(auth, oobCode);
            setStatus('success');
            setTimeout(() => router.push('/journal'), 3000);
            break;
          default:
            setError('Unsupported action. The link is invalid.');
            setStatus('error');
            break;
        }
      } catch (err: any) {
        let message = 'An unexpected error occurred. Please try again.';
        if (err.code === 'auth/invalid-action-code') {
          message = 'This link is invalid or has expired. It may have already been used. Please request a new one.';
        } else if (err.code === 'auth/user-disabled') {
          message = 'Your account has been disabled.';
        }
        setError(message);
        setStatus('error');
      }
    };

    handleAction();
  }, [mode, oobCode, auth, router]);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Password is too weak.', description: 'Password must be at least 6 characters.' });
      return;
    }
    if (!oobCode) return;

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError('Failed to reset password. The link may have expired.');
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER LOGIC ---

  const toast = useToast().toast;

  const renderLoading = () => (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle>Processing Request</CardTitle>
        <CardDescription>Please wait a moment...</CardDescription>
      </CardHeader>
      <CardContent>
        <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
      </CardContent>
    </Card>
  );

  const renderError = () => (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
         <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        <CardTitle>Action Failed</CardTitle>
        <CardDescription>{error}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={mode === 'resetPassword' ? "/forgot-password" : "/login"}>
            {mode === 'resetPassword' ? 'Request a New Link' : 'Back to Login'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const renderSuccess = () => (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
         <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        <CardTitle>{mode === 'resetPassword' ? 'Password Changed!' : 'Email Verified!'}</CardTitle>
        <CardDescription>
          {mode === 'resetPassword' ? 'You can now log in with your new password.' : 'Thank you for verifying your email.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Redirecting you shortly...</p>
        <Loader2 className="h-8 w-8 mx-auto mt-4 animate-spin text-primary" />
      </CardContent>
    </Card>
  );

  const renderPasswordResetForm = () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a New Password</CardTitle>
        <CardDescription>Please enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-password">New Password</label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
             {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <BookHeart className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-headline font-bold">ReflectWell</h1>
          </Link>
        </div>
        
        {status === 'loading' && renderLoading()}
        {status === 'error' && renderError()}
        {status === 'success' && renderSuccess()}
        {status === 'ready' && mode === 'resetPassword' && renderPasswordResetForm()}

      </div>
    </div>
  );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AuthActionContent />
        </Suspense>
    )
}
