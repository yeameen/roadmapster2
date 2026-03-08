/**
 * Calculate the number of working days (weekdays) between two dates,
 * excluding any specified holidays.
 */
export function calculateWorkingDays(
  startDate: string,
  endDate: string,
  holidays: string[] = []
): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const holidaySet = new Set(holidays);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (day !== 0 && day !== 6) {
      // Skip holidays
      const dateStr = current.toISOString().slice(0, 10);
      if (!holidaySet.has(dateStr)) {
        count++;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
