
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Music4, Play, Pause, X } from 'lucide-react';
import Balancer from 'react-wrap-balancer';

declare const puter: any;

export function AudioAmbiance() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (typeof puter === 'undefined') {
      toast({
        variant: 'destructive',
        title: 'AI Feature Not Available',
        description: 'The AI audio service could not be loaded.',
      });
      return;
    }
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Prompt Required', description: 'Please describe the audio you want to create.' });
      return;
    }

    setIsLoading(true);
    setGeneratedPrompt('');
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
    }
    
    const fullPrompt = `Generate a seamless, looping ambient soundscape based on the following theme: "${prompt}". Focus on creating an atmosphere, not speech or distinct melodies. For example, for "rainy library", generate sounds of rain, quiet page turns, and distant muffled sounds.`;

    try {
      const audio = await puter.ai.txt2audio(fullPrompt);
      audioRef.current = audio;
      setGeneratedPrompt(prompt);
      
      audio.loop = true;
      audio.play().catch(() => {});
      setIsPlaying(true);

      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);

    } catch (error) {
      console.error('Error generating audio ambiance:', error);
      toast({
        variant: 'destructive',
        title: 'Audio Generation Failed',
        description: 'Could not create a soundscape at this time. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleClear = () => {
    setPrompt('');
    setGeneratedPrompt('');
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
    }
  };

  // Cleanup effect
  useEffect(() => {
    const currentAudio = audioRef.current;
    return () => {
        currentAudio?.pause();
    };
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Music4 className="h-5 w-5 text-primary" />
            Audio Ambiance
        </CardTitle>
        <CardDescription>
            <Balancer>
                Create a unique soundscape for your journaling session with AI.
            </Balancer>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {generatedPrompt ? (
            <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg h-full">
                <p className="text-sm text-muted-foreground">Now playing:</p>
                <p className="font-semibold text-lg capitalize mb-4">{generatedPrompt}</p>
                <Button onClick={handlePlayPause} size="lg" className="rounded-full w-16 h-16">
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
            </div>
        ) : (
            <div className="space-y-2">
                <label htmlFor="ambiance-prompt" className="text-sm font-medium">
                    Describe a mood or scene...
                </label>
                <Input
                    id="ambiance-prompt"
                    placeholder="e.g., calm rainy library, peaceful forest"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {generatedPrompt && (
            <Button variant="ghost" onClick={handleClear} disabled={isLoading}>
                <X className="mr-2 h-4 w-4"/>
                Clear
            </Button>
        )}
        {!generatedPrompt && (
            <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate</>
                )}
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
