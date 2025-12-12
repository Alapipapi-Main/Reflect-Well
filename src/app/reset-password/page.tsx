'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookHeart, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const oobCode = searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const checkCode = async () => {
      if (!oobCode) {
        setError('Invalid or missing password reset code.');
        setIsLoading(false);
        return;
      }
      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsLoading(false);
      } catch (error: any) {
        if (error.code === 'auth/invalid-action-code') {
          setError('This password reset link is invalid or has expired. Please try requesting a new one.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
        setIsLoading(false);
      }
    };
    checkCode();
  }, [auth, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same.',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password is too weak',
        description: 'Your new password must be at least 6 characters long.',
      });
      return;
    }
    if (!oobCode) return;

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
      toast({
        title: 'Password Reset Successful!',
        description: 'You can now log in with your new password.',
      });
      setTimeout(() => router.push('/login'), 3000);
    } catch (error: any) {
      console.error('Password Reset Confirmation Error:', error);
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: 'Could not reset your password. The link may have expired.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <BookHeart className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-headline font-bold">ReflectWell</h1>
          </Link>
        </div>

        <Card>
          {isLoading && (
            <>
              <CardHeader>
                <CardTitle>Verifying Reset Link</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </CardContent>
            </>
          )}

          {error && !isLoading && (
             <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Invalid Link</CardTitle>
              <CardDescription>{error}</CardDescription>
              <CardContent>
                <Button asChild className="mt-4">
                  <Link href="/forgot-password">Request a New Link</Link>
                </Button>
              </CardContent>
            </CardHeader>
          )}

          {isSuccess && !isLoading && (
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>Password Changed!</CardTitle>
              <CardDescription>Redirecting you to the login page...</CardDescription>
               <CardContent className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </CardHeader>
          )}

          {!isLoading && !error && !isSuccess && (
            <>
              <CardHeader>
                <CardTitle>Create a New Password</CardTitle>
                <CardDescription>
                  Please enter your new password below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="new-password">New Password</label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
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
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Reset Password
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    )
}
