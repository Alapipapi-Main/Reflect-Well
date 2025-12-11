"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { JournalEntry } from "@/lib/types"
import { MOODS } from "@/lib/constants"
import { TrendingUp } from "lucide-react"

interface MoodChartProps {
  entries: JournalEntry[]
}

const moodValues = Object.values(MOODS);

export function MoodChart({ entries }: MoodChartProps) {
  const chartData = useMemo(() => {
    return [...entries]
      .sort((a, b) => {
        const dateA = a.date ? (a.date as any).toDate() : new Date(0);
        const dateB = b.date ? (b.date as any).toDate() : new Date(0);
        return dateA.getTime() - dateB.getTime();
      })
      .map(entry => ({
        date: format(entry.date ? (entry.date as any).toDate() : new Date(), "MMM d"),
        moodValue: MOODS[entry.mood].value,
      }))
  }, [entries])

  const chartConfig = {
    mood: {
      label: "Mood",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Trends</CardTitle>
        <CardDescription>A visual journey of your mood over time.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 1 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <YAxis 
                domain={[0.5, 5.5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(value) => moodValues.find(m => m.value === value)?.emoji || ''}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={30}
              />
              <Tooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, props) => {
                      const mood = moodValues.find(m => m.value === value);
                      if (mood) {
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{mood.emoji}</span>
                            <span className="font-semibold">{mood.label}</span>
                          </div>
                        )
                      }
                      return null;
                    }}
                  />
                }
              />
              <Line
                dataKey="moodValue"
                type="monotone"
                stroke="var(--color-mood)"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "var(--color-mood)",
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg h-[250px]">
            <TrendingUp className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Not Enough Data</h3>
            <p>Your mood trend chart will appear here once you have at least two entries.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
