
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
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function CustomCalendar({ onDateRangeSelect, selectedRange, selectionMode = 'range' }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedRange?.from || new Date());

  const handleDateClick = (day: Date) => {
    if (selectionMode === 'single') {
        onDateRangeSelect({ from: startOfDay(day), to: null });
        return;
    }

    // Logic for 'range' selectionMode
    let { from, to } = selectedRange;

    if (!from || (from && to)) {
      // Start a new selection
      from = startOfDay(day);
      to = null;
    } else {
      // End the selection
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

  const startingDayIndex = (getDay(firstDayOfMonth) + 6) % 7;

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateInRange = (day: Date) => {
    const { from, to } = selectedRange;
    if (!from) return false;
    // If 'to' is not selected yet, only highlight the 'from' date
    if (from && !to) return isSameDay(day, from);
    // If 'to' is selected, check if day is within the interval
    if (from && to) return isWithinInterval(day, { start: from, end: to });
    return false;
  };
  
  const isRangeStart = (day: Date) => selectedRange.from && isSameDay(day, selectedRange.from);
  const isRangeEnd = (day: Date) => selectedRange.to && isSameDay(day, selectedRange.to);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="w-9 h-9 flex items-center justify-center">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {Array.from({ length: startingDayIndex }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {daysInMonth.map((day) => (
          <Button
            key={day.toString()}
            variant="ghost"
            className={cn(
              "w-9 h-9 p-0 font-normal",
              isToday(day) && "bg-accent text-accent-foreground",
              isDateInRange(day) && "bg-primary/20",
              isRangeStart(day) && "bg-primary text-primary-foreground rounded-r-none",
              isRangeEnd(day) && "bg-primary text-primary-foreground rounded-l-none",
               (isRangeStart(day) && isRangeEnd(day)) && "rounded-full"
            )}
            onClick={() => handleDateClick(day)}
          >
            {format(day, "d")}
          </Button>
        ))}
      </div>
    </div>
  );
}
