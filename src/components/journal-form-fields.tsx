
"use client"

import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { MOODS } from "@/lib/constants"
import type { Mood } from "@/lib/types"
import { Button } from "./ui/button"
import { Wand, Loader2, Sparkles } from "lucide-react"
import { Badge } from "./ui/badge"

interface JournalFormFieldsProps {
  isGenerating?: boolean
  isGettingPrompt?: boolean
  onGeneratePrompt?: () => void
  isEditing?: boolean
  suggestedTags?: string[]
  isSuggestingTags?: boolean
  onAddTag?: (tag: string) => void
}

export function JournalFormFields({ 
  isGenerating, 
  isGettingPrompt, 
  onGeneratePrompt, 
  isEditing = false,
  suggestedTags = [],
  isSuggestingTags = false,
  onAddTag
}: JournalFormFieldsProps) {
  const { control, watch } = useFormContext()
  const moodValue = watch("mood")

  return (
    <>
      <FormField
        control={control}
        name="mood"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>How are you feeling?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-wrap gap-4"
              >
                {Object.keys(MOODS).map((moodKey) => {
                  const mood = MOODS[moodKey as Mood]
                  return (
                    <FormItem key={moodKey} className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={moodKey} id={`${field.name}-${moodKey}`} className="sr-only" />
                      </FormControl>
                      <FormLabel
                        htmlFor={`${field.name}-${moodKey}`}
                        className="text-4xl p-2 rounded-full cursor-pointer transition-all duration-200 ease-in-out ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{
                          filter: moodValue === moodKey ? 'grayscale(0)' : 'grayscale(1)',
                          transform: moodValue === moodKey ? 'scale(1.2)' : 'scale(1)',
                          opacity: moodValue === moodKey ? 1 : 0.6,
                        }}
                      >
                        {mood.emoji}
                        <span className="sr-only">{mood.label}</span>
                      </FormLabel>
                    </FormItem>
                  )
                })}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center mb-2">
              <FormLabel>Your journal entry</FormLabel>
              {!isEditing && onGeneratePrompt && (
                <Button type="button" variant="ghost" size="sm" onClick={onGeneratePrompt} disabled={isGettingPrompt || !moodValue}>
                  {isGettingPrompt ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand className="mr-2 h-4 w-4" />
                      Inspire Me
                    </>
                  )}
                </Button>
              )}
            </div>
            <FormControl>
              <Textarea
                placeholder="Tell me about your day..."
                rows={8}
                {...field}
                disabled={isGenerating}
              />
            </FormControl>
            <FormDescription>
              This is your private space. Feel free to be open and honest.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField
        control={control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <Input
                placeholder="work, gratitude, fun"
                {...field}
                disabled={isGenerating}
              />
            </FormControl>
            <FormDescription>
              Add comma-separated tags to organize your entries.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {(isSuggestingTags || suggestedTags.length > 0) && (
        <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Suggestions
            </h4>
            <div className="flex flex-wrap gap-2 items-center">
                {isSuggestingTags && <Loader2 className="h-4 w-4 animate-spin" />}
                {suggestedTags.map((tag) => (
                    <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-primary/20"
                        onClick={() => onAddTag && onAddTag(tag)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onAddTag && onAddTag(tag);
                            }
                        }}
                    >
                        {tag}
                    </Badge>
                ))}
            </div>
        </div>
      )}
    </>
  )
}
