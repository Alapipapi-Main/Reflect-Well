
"use client"

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameDay, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface CustomCalendarProps {
  onDateRangeSelect: (range: DateRange) => void;
  selectedRange: DateRange;
  selectionMode?: 'single' | 'range';
  disabled?: (date: Date) => boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CustomCalendar({ onDateRangeSelect, selectedRange, selectionMode = 'range', disabled }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedRange?.from || new Date());

  const handleDateClick = (day: Date) => {
    if (disabled && disabled(day)) {
      return;
    }
    
    if (selectionMode === 'single') {
        onDateRangeSelect({ from: startOfDay(day), to: null });
        return;
    }

    let { from, to } = selectedRange;

    if (!from || (from && to)) {
      from = startOfDay(day);
      to = null;
    } else {
      if (day < from) {
        to = from;
        from = startOfDay(day);
      } else {
        to = endOfDay(day);
      }
    }
    onDateRangeSelect({ from, to });
  };


  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateInRange = (day: Date) => {
    const { from, to } = selectedRange;
    if (!from) return false;
    if (from && !to) return isSameDay(day, from);
    if (from && to) return isWithinInterval(day, { start: from, end: to });
    return false;
  };
  
  const isRangeStart = (day: Date) => selectedRange.from && isSameDay(day, selectedRange.from);
  const isRangeEnd = (day: Date) => selectedRange.to && isSameDay(day, selectedRange.to);

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold pl-2">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="w-8 h-8 flex items-center justify-center font-medium">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1">
        {Array.from({ length: startingDayIndex }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {daysInMonth.map((day) => {
            const isSelected = isDateInRange(day);
            const isStart = isRangeStart(day);
            const isEnd = isRangeEnd(day);
            const isSingleSelection = isStart && (!selectedRange.to || isSameDay(selectedRange.from, selectedRange.to));
            const isDisabled = disabled ? disabled(day) : false;

            return (
                <Button
                    key={day.toString()}
                    variant="ghost"
                    className={cn(
                    "w-8 h-8 p-0 text-sm font-normal relative",
                    isToday(day) && !isSelected && "bg-accent/50 text-accent-foreground",
                    isSelected && "bg-primary/20 text-primary-foreground",
                    isStart && "bg-primary text-primary-foreground rounded-full",
                    isEnd && !isSingleSelection && "bg-primary text-primary-foreground rounded-full",
                    isSelected && !isStart && !isEnd && "rounded-none",
                    isStart && !isSingleSelection && "rounded-r-none",
                    isEnd && !isSingleSelection && "rounded-l-none",
                    isDisabled && "text-muted-foreground/50 cursor-not-allowed"
                    )}
                    onClick={() => handleDateClick(day)}
                    disabled={isDisabled}
                >
                    {format(day, "d")}
                     {isToday(day) && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                </Button>
            );
        })}
      </div>
    </div>
  );
}
