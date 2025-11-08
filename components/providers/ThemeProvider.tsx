'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    hover: string;
  };
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const themeColors = {
  dark: {
    background: '#000000', // Page background - black
    surface: '#1f1f1f', // Sections/cards background - deep grey
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    primary: '#00ff00', // lime green
    border: '#2a2a2a', // Slightly lighter border for better contrast with deep grey sections
    hover: '#00cc00',
  },
  light: {
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#000000',
    textSecondary: '#6b7280',
    primary: '#006400', // deep green
    border: '#e5e7eb',
    hover: '#004d00',
  },
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Load theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colors = themeColors[theme];

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      colors,
    }),
    [theme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

