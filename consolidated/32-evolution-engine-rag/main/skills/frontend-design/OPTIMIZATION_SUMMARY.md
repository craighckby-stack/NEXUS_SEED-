// Import necessary modules
import { useState, useEffect } from 'react';
import { ThemeProvider } from './theme-provider';
import { cn } from './utils';

// Define the Button component
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  isLoading: boolean;
  leftIcon: JSX.Element;
  onClick: () => void;
  children: string;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  isLoading,
  leftIcon,
  onClick,
  children,
}) => {
  // Use state to manage the button's hover state
  const [isHovered, setIsHovered] = useState(false);

  // Use effect to handle mouse events
  useEffect(() => {
    const handleMouseOver = () => {
      setIsHovered(true);
    };
    const handleMouseOut = () => {
      setIsHovered(false);
    };
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  // Define the button's class names based on the props
  const className = cn(
    'button',
    variant === 'primary' ? 'button-primary' : 'button-secondary',
    size === 'sm' ? 'button-sm' : size === 'md' ? 'button-md' : 'button-lg',
    isLoading ? 'button-loading' : '',
    isHovered ? 'button-hover' : ''
  );

  // Render the button
  return (
    <button className={className} onClick={onClick}>
      {leftIcon}
      {children}
    </button>
  );
};

// Define the ThemeToggle component
interface ThemeToggleProps {
  defaultTheme: 'light' | 'dark' | 'system';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ defaultTheme }) => {
  // Use state to manage the theme
  const [theme, setTheme] = useState(defaultTheme);

  // Use effect to handle theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(theme === 'light' ? 'dark' : 'light');
    };
    document.addEventListener('themeChange', handleThemeChange);
    return () => {
      document.removeEventListener('themeChange', handleThemeChange);
    };
  }, [theme]);

  // Render the theme toggle
  return (
    <div className="theme-toggle">
      <button
        className={theme === 'light' ? 'theme-toggle-light' : 'theme-toggle-dark'}
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
      </button>
    </div>
  );
};

// Define the App component
const App = () => {
  // Render the app
  return (
    <ThemeProvider defaultTheme="system">
      <Button
        variant="primary"
        size="md"
        isLoading={false}
        leftIcon={<CheckIcon />}
        onClick={() => console.log('Button clicked')}
      >
        Save Changes
      </Button>
      <ThemeToggle defaultTheme="system" />
    </ThemeProvider>
  );
};

// Export the App component
export default App;