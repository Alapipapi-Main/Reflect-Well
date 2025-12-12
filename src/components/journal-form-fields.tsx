
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
import { MOODS } from "@/lib/constants"
import type { Mood } from "@/lib/types"

interface JournalFormFieldsProps {
  isGenerating?: boolean
}

export function JournalFormFields({ isGenerating }: JournalFormFieldsProps) {
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
            <FormLabel>Your journal entry</FormLabel>
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
    </>
  )
}
