/**
 * A utility for filtering and detecting potentially inappropriate content in forum posts and comments.
 * It helps to maintain a respectful and inclusive forum environment.
 * 
 * Features:
 * - Detects inappropriate language based on severity levels
 * - Supports filtering and warning levels
 * - Provides utility functions for text processing
 */

export type FilterLevel = 'none' | 'low' | 'medium' | 'high';

// Dictionaries of terms to filter separated by severity
// Note: This is just a minimal example. In a real implementation, these lists would be more comprehensive
// and would be stored in a database or configuration file on the server
const lowSeverityTerms = [
  "stupid",
  "idiot",
  "dumb",
  "sucks",
  "lame",
  "crap",
  "hell",
  "damn",
];

const mediumSeverityTerms = [
  "bastard",
  "bitch",
  "ass",
  "screw",
  "jerk",
];

const highSeverityTerms = [
  "profanity",  // placeholder, actual terms would be more explicit
  "slurs",      // placeholder, actual terms would be more explicit
  "hate speech",// placeholder, actual terms would be more explicit
];

/**
 * Analyzes text content and determines if it contains inappropriate language
 * @param text The text content to analyze
 * @returns The detected filter level based on content
 */
export function analyzeContent(text: string): FilterLevel {
  if (!text) return 'none';
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\b/);
  
  // Check for high severity terms first
  for (const term of highSeverityTerms) {
    if (lowerText.includes(term)) {
      return 'high';
    }
  }
  
  // Check for medium severity terms
  for (const term of mediumSeverityTerms) {
    if (words.includes(term)) {
      return 'medium';
    }
  }
  
  // Check for low severity terms
  for (const term of lowSeverityTerms) {
    if (words.includes(term)) {
      return 'low';
    }
  }
  
  return 'none';
}

/**
 * Filters inappropriate language from text content by replacing with asterisks
 * @param text The text content to filter
 * @param level The minimum severity level to filter (defaults to 'low')
 * @returns Filtered text content
 */
export function filterInappropriateContent(text: string, level: FilterLevel = 'low'): string {
  if (!text || level === 'none') return text;
  
  let filteredText = text;
  const lowerText = text.toLowerCase();
  
  // Create a single array of terms to filter based on the specified level
  let termsToFilter: string[] = [];
  
  if (level === 'low' || level === 'medium' || level === 'high') {
    termsToFilter = [...lowSeverityTerms];
  }
  
  if (level === 'medium' || level === 'high') {
    termsToFilter = [...termsToFilter, ...mediumSeverityTerms];
  }
  
  if (level === 'high') {
    termsToFilter = [...termsToFilter, ...highSeverityTerms];
  }
  
  // Replace each term with asterisks
  termsToFilter.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(term.length));
  });
  
  return filteredText;
}

/**
 * Determines the appropriate warning level for a piece of content
 * @param text The text content to analyze
 * @param userPreferences User preferences for filter sensitivity
 * @returns The appropriate warning level
 */
export function getContentWarningLevel(
  text: string, 
  userPreferences: { filterSensitivity: 'low' | 'medium' | 'high' | 'none' } = { filterSensitivity: 'medium' }
): FilterLevel {
  const detectedLevel = analyzeContent(text);
  
  // If no inappropriate content detected, or user has filtering disabled
  if (detectedLevel === 'none' || userPreferences.filterSensitivity === 'none') {
    return 'none';
  }
  
  // Map user sensitivity preferences to warning thresholds
  const sensitivityMap: Record<string, FilterLevel> = {
    low: 'high',      // Only warn for high severity content when sensitivity is low
    medium: 'medium', // Warn for medium and high when sensitivity is medium
    high: 'low',      // Warn for all levels when sensitivity is high
    none: 'none'      // No warnings when sensitivity is none
  };
  
  // Determine the minimum level that should trigger a warning
  const warningThreshold = sensitivityMap[userPreferences.filterSensitivity];
  
  // Mapping filter levels to numerical values for comparison
  const levelValues: Record<FilterLevel, number> = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3
  };
  
  // Only return a warning if the detected level is at or above the threshold
  return levelValues[detectedLevel] >= levelValues[warningThreshold] ? detectedLevel : 'none';
}

/**
 * Gets the description text for different filter levels
 * @returns Descriptions for each filter level
 */
export function getFilterLevelDescriptions(): Record<FilterLevel, string> {
  return {
    none: 'No inappropriate content detected',
    low: 'This content contains mild inappropriate language',
    medium: 'This content contains moderately inappropriate language',
    high: 'This content contains strongly inappropriate language'
  };
}

/**
 * Counts the number of inappropriate terms in a text
 * @param text The text to analyze
 * @returns The count of inappropriate terms by severity level
 */
export function countInappropriateTerms(text: string): { low: number, medium: number, high: number, total: number } {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\b/);
  
  const counts = {
    low: 0,
    medium: 0,
    high: 0,
    total: 0
  };
  
  // Check low severity terms
  lowSeverityTerms.forEach(term => {
    if (words.includes(term)) {
      counts.low++;
      counts.total++;
    }
  });
  
  // Check medium severity terms
  mediumSeverityTerms.forEach(term => {
    if (words.includes(term)) {
      counts.medium++;
      counts.total++;
    }
  });
  
  // Check high severity terms
  highSeverityTerms.forEach(term => {
    if (lowerText.includes(term)) {
      counts.high++;
      counts.total++;
    }
  });
  
  return counts;
}

export default {
  analyzeContent,
  filterInappropriateContent,
  getContentWarningLevel,
  getFilterLevelDescriptions,
  countInappropriateTerms
};