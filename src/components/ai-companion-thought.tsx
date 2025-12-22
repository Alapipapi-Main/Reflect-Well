
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, MessageCircleQuestion } from 'lucide-react';

interface AiCompanionThoughtProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  thought: string | null;
  isLoading: boolean;
}

export function AiCompanionThought({ isOpen, onOpenChange, thought, isLoading }: AiCompanionThoughtProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="text-primary" />
            A Thought From Your Companion
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground pt-4 min-h-[6rem] flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              `"${thought}"`
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction disabled={isLoading}>Got it, thanks!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
