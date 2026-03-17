// sample-components.tsx
import React, { useState, forwardRef, InputHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from './utils';

// Button Component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    disabled, 
    leftIcon, 
    rightIcon, 
    children, 
    className, 
    ...props 
  }, ref) => {
    const baseClasses = 'btn';
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
    };
    const sizeClasses = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          isLoading && 'btn-loading',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {!isLoading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
        <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
        {!isLoading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    size = 'md', 
    leftIcon, 
    rightIcon, 
    className, 
    id, 
    required, 
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const sizeClasses = {
      sm: 'input-sm',
      md: '',
      lg: 'input-lg',
    };

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className={cn('label', required && 'label-required')}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input',
              sizeClasses[size],
              error && 'input-error',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(errorId, helperId)}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <span id={errorId} className="helper-text helper-text-error" role="alert">
            {error}
          </span>
        )}
        
        {!error && helperText && (
          <span id={helperId} className="helper-text">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

const Card = ({ children, className, interactive = false, onClick }: CardProps) => {
  return (
    <div
      className={cn(
        'card',
        interactive && 'card-interactive',
        className
      )}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn('card-header', className)}>{children}</div>;
};

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <h3 className={cn('card-title', className)}>{children}</h3>;
};

const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <p className={cn('card-description', className)}>{children}</p>;
};

const CardBody = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn('card-body', className)}>{children}</div>;
};

const CardFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn('card-footer', className)}>{children}</div>;
};

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}

const Badge = ({ children, variant = 'primary', className }: BadgeProps) => {
  const variantClasses = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    outline: 'badge-outline',
  };

  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
};

// Alert Component
interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  onClose?: () => void;
  className?: string;
}

const Alert = ({ children, variant = 'info', title, onClose, className }: AlertProps) => {
  const variantClasses = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    danger: 'alert-danger',
  };

  const icons = {
    info: (
      <svg className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    danger: (
      <svg className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={cn('alert', variantClasses[variant], className)} role="alert">
      {icons[variant]}
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-description">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto text-current hover:opacity-70 transition-opacity"
          aria-label="Close alert"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Modal = ({ isOpen, onClose, children, title, className }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={cn('modal', className)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
            <button onClick={onClose} className="modal-close" aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

const ModalBody = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn('modal-body', className)}>{children}</div>;
};

const ModalFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn('modal-footer', className)}>{children}</div>;
};

// Skeleton Component
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'rect';
  width?: string;
  height?: string;
}

const Skeleton = ({ className, variant = 'text', width, height }: SkeletonProps) => {
  const variantClasses = {
    text: 'skeleton-text',
    title: 'skeleton-title',
    avatar: 'skeleton-avatar',
    card: 'skeleton-card',
    rect: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={cn('skeleton', variantClasses[variant], className)}
      style={style}
      aria-label="Loading"
    />
  );
};

// EmptyState Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <div className={cn('empty-state', className)}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

// ErrorState Component
interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

const ErrorState = ({ title, message, onRetry, onGoBack, className }: ErrorStateProps) => {
  return (
    <div className={cn('error-state', className)}>
      <svg className="error-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      <div className="error-state-actions">
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack}>
            Go Back
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

// Avatar Component
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar = ({ src, alt, fallback, size = 'md', className }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'avatar-sm',
    md: '',
    lg: 'avatar-lg',
  };

  const showFallback = !src || imageError;
  const initials = fallback
    ? fallback
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className={cn('avatar', sizeClasses[size], className)}>
      {showFallback ? (
        <span>{initials}</span>
      ) : (
        <img
          src={src}
          alt={alt || fallback || 'Avatar'}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

export { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter, Badge, Alert, Modal, ModalBody, ModalFooter, Skeleton, EmptyState, ErrorState, Avatar };