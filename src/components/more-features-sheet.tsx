
'use client';

import { SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, BookCopy, Bot, Clock, Compass, Gift, Heart, HelpCircle, Image, Moon, Star, Sun, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
  
interface MoreFeaturesSheetProps {
    setActiveTab: (tab: string) => void;
    hasUnopenedCapsules?: boolean;
}
  
const features = [
    { 
        label: "AI Tools",
        items: [
            { value: 'guided', label: 'Guided Session', icon: Bot },
            { value: 'ask', label: 'Ask Journal', icon: HelpCircle },
            { value: 'dream-interpreter', label: 'Dream Interpreter', icon: Moon },
            { value: 'visual-prompt', label: 'Visual Prompt', icon: Image },
        ]
    },
    {
        label: "Reflections",
        items: [
            { value: 'insights', label: 'Weekly Insights', icon: BarChart },
            { value: 'yesterday', label: 'Yesterday', icon: Sun },
            { value: 'on-this-day', label: 'On This Day', icon: Star },
        ]
    },
    {
        label: "Tools & Features",
        items: [
            { value: 'templates', label: 'Templates', icon: BookCopy },
            { value: 'time-capsule', label: 'Time Capsule', icon: Clock },
            { value: 'gratitude', label: 'Gratitude Wall', icon: Heart },
            { value: 'explorer', label: 'Emotion Explorer', icon: Compass },
        ]
    },
    {
        label: "Progress",
        items: [
            { value: 'stats', label: 'Stats', icon: Gift },
            { value: 'goals', label: 'Goals', icon: Trophy },
        ]
    }
];

export function MoreFeaturesSheet({ setActiveTab, hasUnopenedCapsules }: MoreFeaturesSheetProps) {
    const handleSelect = (value: string) => {
      setActiveTab(value);
    };
  
    return (
      <>
        <SheetHeader>
          <SheetTitle>More Features</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full">
            <div className="py-4 flex flex-col gap-1">
                {features.map((group, index) => (
                    <div key={group.label}>
                        {index > 0 && <Separator className="my-2" />}
                        <h3 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{group.label}</h3>
                        <div className='flex flex-col'>
                            {group.items.map(tab => {
                                const showDot = hasUnopenedCapsules && tab.value === 'time-capsule';
                                return (
                                <SheetClose asChild key={tab.value}>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start relative"
                                        onClick={() => handleSelect(tab.value)}
                                    >
                                        <tab.icon className="mr-2 h-4 w-4" />
                                        <span>{tab.label}</span>
                                        {showDot && (
                                            <div className="absolute right-3 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                        )}
                                    </Button>
                                </SheetClose>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </>
    );
}
