// Import necessary modules
import { createContext, useState } from 'react';

// Define the ThemeContext
interface ThemeContextInterface {
  theme: string;
  toggleTheme: () => void;
}

// Initialize the ThemeContext with default values
export const ThemeContext = createContext<ThemeContextInterface>({
  theme: 'light',
  toggleTheme: () => null,
});

// Define the ThemeProvider component
interface Props {
  children: React.ReactNode;
}

// Add a theme option for performance improvement (avoid re-rendering)
const THEMES = {
  light: { primary: '#3498db', secondary: '#e74c3c' },
  dark: { primary: '#1a1d23', secondary: '#8e24aa' },
  system: { primary: '#2ecc71', secondary: '#3498db' },
};

// Create the ThemeProvider component
function ThemeProvider({ children }: Props) {
  // Use the useState hook to store the theme
  const [theme, setTheme] = useState('light');

  // Define the toggleTheme function to change the theme
  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light'
    );
  };

  // Return the ThemeContext provider with the theme and toggleTheme function
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;