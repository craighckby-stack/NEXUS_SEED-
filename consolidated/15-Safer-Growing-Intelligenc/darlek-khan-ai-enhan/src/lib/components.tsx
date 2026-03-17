import { ReactNode } from 'react';

// Enhanced base component props
interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Enhanced card component props
interface EnhancedCardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  header?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

// Enhanced input component props
interface EnhancedInputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

// Enhanced button component props
interface EnhancedButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void | Promise<void>;
}

// Enhanced progress component props
interface EnhancedProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
}

// Enhanced terminal component props
interface EnhancedTerminalProps extends BaseComponentProps {
  lines: TerminalLine[];
  maxHeight?: string;
  onClear?: () => void;
}

// Enhanced repository input component props
interface RepositoryInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label: string;
  id: string;
}

// Enhanced configuration component props
interface ConfigurationSectionProps extends BaseComponentProps {
  title: string;
  description?: string;
  children: ReactNode;
  isVisible: boolean;
  onToggle?: () => void;
}

// Utility functions for better component composition
export const cn = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(' ').trim();
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  
  return `${size} ${sizes[i]}`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 1) {
    return `1m ${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
};

export const validateRepositoryFormat = (repo: string): { isValid: boolean; owner?: string; name?: string } => {
  const trimmed = repo.trim();
  const parts = trimmed.split('/');
  
  if (parts.length !== 2) {
    return { isValid: false };
  }
  
  const [owner, name] = parts;
  
  if (!owner || !name) {
    return { isValid: false };
  }
  
  if (owner.length === 0 || owner.length > 39 || name.length === 0 || name.length > 100) {
    return { isValid: false };
  }
  
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  
  if (!validPattern.test(owner) || !validPattern.test(name)) {
    return { isValid: false };
  }
  
  return { isValid: true, owner, name };
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      func(...args);
      lastCall = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastCall = Date.now();
      }, delay - (now - lastCall));
    }
  };
};

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ hasError: true, error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <details className="mt-2">
            <summary className="cursor-pointer font-medium text-red-700">
              Error Details
            </summary>
            <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading spinner component
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <div 
    className={cn(
      'animate-spin rounded-full border-2 border-gray-300 border-t-transparent',
      {
        'sm': 'h-4 w-4',
        'md': 'h-6 w-6',
        'lg': 'h-8 w-8'
      }[size] || 'h-6 w-6'
    )}
  >
    <div className="border-t-transparent border-solid border-8 border-gray-300 rounded-full w-full h-full"></div>
  </div>
);

// Status indicator component
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  showIcon?: boolean;
}

export const StatusIndicator = ({ 
  status, 
  message, 
  showIcon = true 
}: StatusIndicatorProps) => {
  const statusColors = {
    success: 'text-green-600 bg-green-100 border-green-200',
    warning: 'text-yellow-600 bg-yellow-100 border-yellow-200',
    error: 'text-red-600 bg-red-100 border-red-200',
    info: 'text-blue-600 bg-blue-100 border-blue-200'
  };

  const statusIcons = {
    success: '✓',
    warning: '⚠️',
    error: '✗',
    info: 'ℹ️'
  };

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-md border',
      statusColors[status]
    )}>
      {showIcon && (
        <span className="text-lg">{statusIcons[status]}</span>
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// Reusable hook for local storage
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // Get initial value from localStorage or use the provided initial value
  const getInitialValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return initialValue;
    }
  };

  const [value, setValue] = useState<T>(getInitialValue);
  
  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }
  };
  
  return [value, setStoredValue];
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

// Enhanced constants
export const APP_CONSTANTS = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 5000,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  RATE_LIMIT_WINDOW: 60000,
  RATE_LIMIT_MAX_REQUESTS: 30,
  MAX_FILE_SIZE: 100000,
  BINARY_EXTENSIONS: /\.(jpg|jpeg|png|gif|svg|ico|pdf|zip|tar|gz|exe|dll|so|dylib|woff|woff2|ttf|eot|mp3|mp4|avi|mov)$/i,
  VALID_REPO_PATTERN: /^[a-zA-Z0-9._-]+$/,
  MAX_REPO_NAME_LENGTH: 100,
  MIN_REPO_NAME_LENGTH: 1,
  MAX_REPO_OWNER_LENGTH: 39,
  MIN_REPO_OWNER_LENGTH: 1,
  GITHUB_TOKEN_PREFIX: 'ghp_',
  GEMINI_TOKEN_PREFIX: 'AIzaSy',
  MIN_TOKEN_LENGTH: 20,
  DEFAULT_TEMPERATURE: 0.2,
  DEFAULT_MAX_TOKENS: 8192,
  MAX_CONTENT_LENGTH: 30000,
  MIN_CONTENT_LENGTH: 10,
  SPLASH_MESSAGES: [
    { status: "Initializing AI systems...", details: "Loading core modules and dependencies..." },
    { status: "Connecting to GitHub API...", details: "Establishing secure connection to GitHub..." },
    { status: "Initializing Gemini AI model...", details: "Loading gemini-1.5-flash model..." },
    { status: "Configuring enhancement engine...", details: "Setting up autonomous improvement algorithms..." },
    { status: "System ready!", details: "Darlek Khan is ready to use" }
  ]
} as const;