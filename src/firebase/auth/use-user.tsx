'use client';

import { useEffect } from 'react';
import { useAuth, useFirebase } from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user && !userError) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, userError, auth]);

  return { user, isUserLoading, userError };
};
