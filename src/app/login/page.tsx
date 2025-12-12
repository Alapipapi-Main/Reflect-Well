'use client';

import { AuthForm } from '@/components/auth-form';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { BookHeart } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Logged In!',
        description: 'Welcome back to ReflectWell.',
      });
      router.push('/journal');
    } catch (error: any) {
      console.error('Login Error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
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
          <p className="text-muted-foreground">Log in to continue your journey.</p>
        </div>
        <AuthForm
          mode="login"
          onSubmit={handleLogin}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
