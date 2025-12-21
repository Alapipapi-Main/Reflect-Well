
'use client';

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
  } from '@/components/ui/dropdown-menu';
import { SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { BarChart, BookCopy, Bot, Clock, Gift, Heart, HelpCircle, Image, Moon, Star, Sun, Trophy } from 'lucide-react';
  
interface MoreFeaturesSheetProps {
    setActiveTab: (tab: string) => void;
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

export function MoreFeaturesSheet({ setActiveTab }: MoreFeaturesSheetProps) {
    const handleSelect = (value: string) => {
      setActiveTab(value);
    };
  
    return (
      <>
        <SheetHeader>
          <SheetTitle>More Features</SheetTitle>
        </SheetHeader>
        <div className="py-4">
            {features.map((group, index) => (
                <DropdownMenuGroup key={group.label}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                    {group.items.map(tab => (
                         <SheetClose asChild key={tab.value}>
                            <DropdownMenuItem onSelect={() => handleSelect(tab.value)}>
                                <tab.icon className="mr-2 h-4 w-4" />
                                {tab.label}
                            </DropdownMenuItem>
                        </SheetClose>
                    ))}
                </DropdownMenuGroup>
            ))}
        </div>
      </>
    );
}
