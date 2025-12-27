
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wind } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Balancer from 'react-wrap-balancer';

export function ZenGarden() {
  const [thought, setThought] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);

  const handleRelease = () => {
    if (!thought) return;
    setIsReleasing(true);
    setTimeout(() => {
      setThought('');
      setIsReleasing(false);
    }, 1500); // Duration of the fade-out animation
  };

  return (
    <Card className="flex flex-col">
      <div className="relative h-48 w-full">
        <Image
          src="https://picsum.photos/seed/zen/600/400"
          alt="Zen Garden"
          layout="fill"
          objectFit="cover"
          className="rounded-t-lg"
          data-ai-hint="zen garden"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
            <CardTitle className="text-2xl">Zen Garden</CardTitle>
            <CardDescription>
                <Balancer>
                    A quiet place to release a passing thought.
                </Balancer>
            </CardDescription>
        </div>
      </div>
      <CardContent className="flex-grow flex flex-col justify-center items-center p-6">
        <div className="w-full text-center space-y-4">
            <p
                className={cn(
                "text-2xl italic text-foreground/80 font-serif transition-opacity duration-1000 ease-in-out min-h-[3rem] flex items-center justify-center",
                isReleasing ? "opacity-0" : "opacity-100"
                )}
            >
                "{thought || '...'}"
            </p>
            <Input
                placeholder="Write a thought to release..."
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                className="text-center"
                disabled={isReleasing}
            />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleRelease} disabled={!thought || isReleasing}>
          <Wind className="mr-2 h-4 w-4" />
          Release
        </Button>
      </CardFooter>
    </Card>
  );
}
