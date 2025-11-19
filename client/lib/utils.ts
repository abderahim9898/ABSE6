import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseISO, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: any): string {
  if (!value) return "";

  const dateStr = String(value).trim();

  // Check if it's already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Check if it looks like an ISO date (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
  const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})(T|[ ])/;
  const isoMatch = dateStr.match(isoDateRegex);

  if (isoMatch) {
    try {
      // Extract just the date part (YYYY-MM-DD) without timezone
      const [, year, month, day] = isoMatch;

      // Create date using UTC to avoid timezone conversion
      const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr;
      }

      // Format as DD/MM/YYYY
      return format(date, "dd/MM/yyyy", { useAdditionalWeekYearTokens: true });
    } catch {
      return dateStr;
    }
  }

  // If it doesn't match any date pattern, return as-is
  return dateStr;
}

export function isTimeFormat(value: any): boolean {
  if (!value) return false;
  const str = String(value).trim();
  // Check if it matches HH:mm:ss format
  return /^\d{2}:\d{2}:\d{2}$/.test(str);
}

export function formatCellValue(value: any, headerName?: string): string {
  if (!value) return "";

  const cellStr = String(value);

  // If it's a time column (format HH:mm:ss), keep it as is
  if (isTimeFormat(cellStr)) {
    return cellStr;
  }

  // Otherwise try to format as date
  return formatDate(value);
}
