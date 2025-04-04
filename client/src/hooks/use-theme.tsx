import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

type ThemeContextType = {
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useAuth();
  
  // Define preference interface
  interface UserPreferences {
    userId: number;
    darkMode: boolean;
    emailNotifications: boolean;
    priceAlerts: boolean;
  }
  
  // Fetch user preferences if user is logged in
  const { data: preferences, isLoading } = useQuery<UserPreferences | undefined, Error>({
    queryKey: ["/api/preferences"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  useEffect(() => {
    // If we have preferences from the server, use those
    if (preferences && typeof preferences.darkMode === 'boolean') {
      setDarkMode(preferences.darkMode);
    } else {
      // Otherwise check for system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }
  }, [preferences]);
  
  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}