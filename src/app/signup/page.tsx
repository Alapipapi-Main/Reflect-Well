'use client';

import { AuthForm } from '@/components/auth-form';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { BookHeart } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      toast({
        title: 'Account Created!',
        description: 'A verification email has been sent. Please check your inbox to continue.',
      });
      router.push('/journal');
    } catch (error: any) {
      console.error('Signup Error:', error);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'An unexpected error occurred.',
      });
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
          <p className="text-muted-foreground">Create an account to start journaling.</p>
        </div>
        <AuthForm
          mode="signup"
          onSubmit={handleSignup}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
