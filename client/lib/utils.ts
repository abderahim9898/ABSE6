import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

  // Check if it looks like an ISO date (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T|[ ])/;
  if (isoDateRegex.test(dateStr)) {
    try {
      const date = new Date(dateStr);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr;
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
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
