// ============================================
// Theme Context
// ============================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// ============================================
// Constants
// ============================================

const STORAGE_KEY_DEFAULT = 'ui-theme';
const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
const isSSR = typeof window === 'undefined';

// ============================================
// Theme Types
// ============================================

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// ============================================
// Utilities
// ============================================

const getSystemTheme = (): 'light' | 'dark' => {
  if (isSSR) return 'light';
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light';
};

const applyThemeToDOM = (resolvedTheme: 'light' | 'dark') => {
  if (isSSR) return;
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
  root.setAttribute('data-theme', resolvedTheme);
};

const initialResolvedTheme = (userTheme: Theme): 'light' | 'dark' => {
  return userTheme === 'system' ? getSystemTheme() : userTheme;
};

// ============================================
// Theme Provider
// ============================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY_DEFAULT,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (!isSSR) {
      const stored = localStorage.getItem(storageKey);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as Theme;
      }
    }
    return defaultTheme;
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() =>
    initialResolvedTheme(theme)
  );

  const setThemeHandler = useCallback(
    (newTheme: Theme) => {
      if (!isSSR) {
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    },
    [storageKey]
  );

  const toggleTheme = useCallback(() => {
    setTheme(effectiveTheme === 'light' ? 'dark' : 'light');
  }, [effectiveTheme, setTheme]);

  useEffect(() => {
    const newEffectiveTheme = initialResolvedTheme(theme);
    setEffectiveTheme(newEffectiveTheme);
    applyThemeToDOM(newEffectiveTheme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system' || isSSR) return;
    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      setEffectiveTheme(systemTheme);
      applyThemeToDOM(systemTheme);
    };
    mediaQuery.addEventListener('change', handler);
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeHandler,
      toggleTheme,
    }),
    [theme, setThemeHandler, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ============================================
// Theme Hook
// ============================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ============================================
// Theme Toggle
// ============================================

interface ThemeToggleProps {
  className?: string;
  iconSize?: number;
}

export function ThemeToggle({ className = '', iconSize = 20 }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const Icon = theme === 'light' ? Icons.Moon : Icons.Sun;
  const handleToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  return (
    <button
      onClick={handleToggle}
      className={`btn btn-ghost btn-icon ${className}`}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Icon width={iconSize} height={iconSize} />
    </button>
  );
}

// ============================================
// Theme Selector
// ============================================

interface ThemeSelectorProps {
  className?: string;
}

const THEME_OPTIONS: {
  value: Theme;
  label: string;
  Icon: ComponentType<IconProps & { width?: string | number; height?: string | number }>;
}[] = [
  { value: 'light', label: 'Light', Icon: Icons.Sun },
  { value: 'dark', label: 'Dark', Icon: Icons.Moon },
  { value: 'system', label: 'System', Icon: Icons.Monitor },
];

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = useMemo(
    () => THEME_OPTIONS.find((t) => t.value === theme) || THEME_OPTIONS[0],
    [theme]
  );
  const handleSelectTheme = (t: Theme) => {
    setTheme(t);
    setIsOpen(false);
  };
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center gap-2"
        aria-label="Select theme"
        type="button"
      >
        <selectedOption.Icon width={16} height={16} />
        <span>{selectedOption.label}</span>
        <Icons.ChevronDown
          width={16}
          height={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-surface border border-border z-50">
            <div className="py-1" role="menu">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleSelectTheme(t.value)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 text-sm
                    hover:bg-surface-hover transition-colors text-left
                    ${theme === t.value ? 'bg-surface-subtle font-medium' : ''}
                  `}
                  role="menuitem"
                  type="button"
                >
                  <t.Icon width={16} height={16} />
                  <span>{t.label}</span>
                  {theme === t.value && (
                    <Icons.Check width={16} height={16} className="ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Higher-Order Component for Theme
// ============================================

export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: ThemeContextType }>
) {
  const wrappedComponentName = Component.displayName || Component.name || 'Component';
  const ThemedComponent = (props: P) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
  ThemedComponent.displayName = `withTheme(${wrappedComponentName})`;
  return ThemedComponent;
}