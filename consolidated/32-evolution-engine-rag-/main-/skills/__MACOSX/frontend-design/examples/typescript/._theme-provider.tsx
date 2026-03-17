// theme-provider.tsx
import React, { createContext, useState } from 'react';

/**
 * Theme interface representing the application's visual theme.
 */
interface Theme {
  primaryColor: string;
  secondaryColor: string;
}

/**
 * ThemeContextValue interface representing the context value.
 */
interface ThemeContextValue {
  theme: Theme;
  updateTheme: (newTheme: Theme) => void;
}

/**
 * Creates a context for theme management.
 */
const ThemeContext = createContext<ThemeContextValue>({
  theme: {
    primaryColor: '#000',
    secondaryColor: '#fff',
  },
  updateTheme: () => {},
});

/**
 * ThemeProvider component managing the application's theme.
 */
const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>({
    primaryColor: '#000',
    secondaryColor: '#fff',
  });

  const updateTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeProvider, ThemeContext };