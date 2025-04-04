import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number with commas and decimal places
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a percentage value
 * @param value Percentage value
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  if (isNaN(value)) return "N/A";
  return `${value.toFixed(2)}%`;
}

/**
 * Formats a timestamp as relative time (e.g., "2 hours ago")
 * @param timestamp Timestamp to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Time units in seconds
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  if (seconds < minute) {
    return 'just now';
  } else if (seconds < hour) {
    const minutes = Math.floor(seconds / minute);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (seconds < day) {
    const hours = Math.floor(seconds / hour);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (seconds < week) {
    const days = Math.floor(seconds / day);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (seconds < month) {
    const weeks = Math.floor(seconds / week);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (seconds < year) {
    const months = Math.floor(seconds / month);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(seconds / year);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}
