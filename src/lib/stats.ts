import type { JournalEntry } from './types';
import { isToday, isYesterday, differenceInCalendarDays } from 'date-fns';

/**
 * Calculates the current journaling streak from a list of entries.
 * @param entries - An array of JournalEntry objects, assumed to be sorted with the most recent entry first.
 * @returns The number of consecutive days of journaling.
 */
export function calculateStreak(entries: JournalEntry[]): number {
  if (!entries || entries.length === 0) {
    return 0;
  }

  // Ensure entries are properly sorted by date, descending.
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.date ? (a.date as any).toDate() : new Date(0);
    const dateB = b.date ? (b.date as any).toDate() : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const mostRecentEntryDate = (sortedEntries[0].date as any).toDate();

  // If the most recent entry is not from today or yesterday, the streak is 0.
  if (!isToday(mostRecentEntryDate) && !isYesterday(mostRecentEntryDate)) {
    return 0;
  }

  let streak = 1;
  let lastDate = mostRecentEntryDate;

  // We only need to check from the second entry onwards.
  for (let i = 1; i < sortedEntries.length; i++) {
    const currentDate = (sortedEntries[i].date as any).toDate();
    const diff = differenceInCalendarDays(lastDate, currentDate);

    if (diff === 1) {
      // The entry is from the previous day, so continue the streak.
      streak++;
      lastDate = currentDate;
    } else if (diff === 0) {
      // This is another entry on the same day. Ignore it and continue.
      continue;
    } else {
      // There's a gap, so the streak is broken.
      break;
    }
  }

  return streak;
}
