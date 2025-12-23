
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EMOTIONS, type PrimaryEmotion, type SecondaryEmotion } from '@/lib/emotions';
import { cn } from '@/lib/utils';
import Balancer from 'react-wrap-balancer';

export function EmotionExplorer() {
  const [activePrimary, setActivePrimary] = useState<PrimaryEmotion | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<SecondaryEmotion | null>(null);

  const handlePrimaryClick = (emotion: PrimaryEmotion) => {
    setActivePrimary(emotion);
  };

  const handleSecondaryClick = (emotion: SecondaryEmotion) => {
    setSelectedSecondary(emotion);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Emotion Explorer</CardTitle>
          <CardDescription>
            <Balancer>
              Discover and understand your feelings with more depth. Click a primary emotion to see related feelings, then select one to learn more.
            </Balancer>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Primary Emotions Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Primary Emotions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion.name}
                  onClick={() => handlePrimaryClick(emotion)}
                  className={cn(
                    'p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'bg-secondary/30 hover:bg-secondary/60',
                    activePrimary?.name === emotion.name
                      ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
                      : 'opacity-70 hover:opacity-100'
                  )}
                >
                  <span className="text-3xl sm:text-4xl">{emotion.emoji}</span>
                  <span className="font-semibold text-sm sm:text-base text-foreground">{emotion.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Emotions for Active Primary */}
          {activePrimary && (
            <div className="p-6 bg-secondary/30 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Nuances of {activePrimary.name}
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {activePrimary.emotions.map((sec) => (
                  <Button
                    key={sec.name}
                    variant="secondary"
                    onClick={() => handleSecondaryClick(sec)}
                    className="shadow-sm"
                  >
                    {sec.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Secondary Emotion Details */}
      <Dialog open={!!selectedSecondary} onOpenChange={(isOpen) => !isOpen && setSelectedSecondary(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedSecondary?.name}</DialogTitle>
            <DialogDescription className="text-base pt-2">
              {selectedSecondary?.definition}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h4 className="font-semibold mb-2">A Prompt for Your Journal</h4>
            <p className="italic text-muted-foreground p-4 border-l-4 rounded-r-md bg-secondary/50">
              "{selectedSecondary?.prompt}"
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
