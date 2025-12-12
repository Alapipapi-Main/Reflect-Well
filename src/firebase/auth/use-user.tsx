'use client';

import { useFirebase } from '@/firebase/provider';

// This hook is now a simple wrapper around the main useFirebase hook.
// The logic for initiating anonymous sign-in has been removed.
// Authentication is now handled by the login/signup pages.
export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();

  return { user, isUserLoading, userError };
};
