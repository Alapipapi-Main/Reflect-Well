
'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JournalForm } from './journal-form';
import Image from 'next/image';

declare const puter: any;

interface VisualPromptProps {
    onSubmittingChange: (isSubmitting: boolean) => void;
}

const INSPIRATION_PROMPTS = [
    "A dreamy landscape representing new beginnings, pastel colors, ethereal, soft light.",
    "An abstract visualization of inner peace, flowing lines, cool tones of blue and green, tranquil.",
    "The feeling of a breakthrough moment, explosive light, dynamic shapes, vibrant energy.",
    "A cozy, safe space for quiet reflection, warm tones, soft textures, gentle shadows.",
    "The essence of joyful energy, bright yellows and oranges, sunburst patterns, playful.",
    "A representation of overcoming a challenge, a single light source in a dark space, sense of hope.",
    "The feeling of nostalgia and memory, sepia tones, blurry edges, dreamlike quality."
];

export function VisualPrompt({ onSubmittingChange }: VisualPromptProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const handleGeneratePrompt = useCallback(async () => {
        if (typeof puter === 'undefined') {
            toast({
                variant: 'destructive',
                title: 'AI Feature Not Available',
                description: 'The AI image service could not be loaded.',
            });
            return;
        }

        setIsLoading(true);
        setImageUrl(null);

        const randomPrompt = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
        const fullPrompt = `Generate a beautiful, abstract, and artistic image that is evocative and inspires emotion. Style: ethereal, painterly. Theme: ${randomPrompt}`;

        try {
            const imageElement = await puter.ai.txt2img(fullPrompt, {});
            setImageUrl(imageElement.src);
        } catch (error) {
            console.error("Error getting AI visual prompt from Puter.ai:", error);
            toast({
                variant: "destructive",
                title: "Visual Prompt Failed",
                description: "Could not generate an image at this time. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    if (imageUrl) {
        return (
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Your Visual Prompt</CardTitle>
                        <CardDescription>Use the image below as inspiration for your journal entry.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                            <Image src={imageUrl} alt="AI-generated visual prompt" layout="fill" objectFit="cover" />
                        </div>
                    </CardContent>
                </Card>
                <JournalForm 
                    onSubmittingChange={onSubmittingChange}
                    externalImageUrl={imageUrl}
                    formContext={{
                        title: "What does this image bring up for you?",
                        description: "Let your thoughts flow freely as you reflect on the visual prompt."
                    }}
                />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Visual Prompt Journaling</CardTitle>
                <CardDescription>
                    Spark your creativity with an AI-generated image. Let the visual guide your reflection.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 text-center min-h-[250px]">
                    {isLoading ? (
                        <>
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Creating your inspiration...</p>
                        </>
                    ) : (
                        <>
                            <div className="bg-secondary p-4 rounded-full">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground max-w-xs">
                                Generate a unique image to use as a starting point for your journal entry.
                            </p>
                            <Button onClick={handleGeneratePrompt}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate a Visual Prompt
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
