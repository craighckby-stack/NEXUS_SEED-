// ============================================
// SKILL: FRONTEND DESIGN
// ============================================

import React, { forwardRef, useState, useCallback, useMemo } from 'react';
import cn from './utils';

// ============================================
// SHARED TYPES AND CONSTANTS
// ============================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'rect';
type AvatarSize = 'sm' | 'md' | 'lg';
type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const buttonVariantMap: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const buttonSizeMap: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const inputSizeMap: Record<string, string> = {
  sm: 'input-sm',
  md: '',
  lg: 'input-lg',
};

const badgeVariantMap: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  outline: 'badge-outline',
};

const alertVariantMap: Record<AlertVariant, string> = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  danger: 'alert-danger',
};

const skeletonVariantMap: Record<SkeletonVariant, string> = {
  text: 'skeleton-text',
  title: 'skeleton-title',
  avatar: 'skeleton-avatar',
  card: 'skeleton-card',
  rect: '',
};

const avatarSizeMap: Record<AvatarSize, string> = {
  sm: 'avatar-sm',
  md: '',
  lg: 'avatar-lg',
};

// ============================================
// BUTTON COMPONENT
// ============================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const disabled = isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          'btn',
          buttonVariantMap[variant],
          buttonSizeMap[size],
          isLoading && 'btn-loading',
          className
        )}
        disabled={disabled}
        type={props.type || 'button'}
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

// ============================================
// INPUT COMPONENT
// ============================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
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
    },
    ref
  ) => {
    const effectiveInputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    const errorId = error ? `${effectiveInputId}-error` : undefined;
    const helperId = helperText ? `${effectiveInputId}-helper` : undefined;

    const describedBy = cn(errorId, helperId);

    const iconPadding = cn(leftIcon && 'pl-10', rightIcon && 'pr-10');

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={effectiveInputId} className={cn('label', required && 'label-required')}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={effectiveInputId}
            className={cn(
              'input',
              inputSizeMap[size],
              error && 'input-error',
              iconPadding,
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
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

// ============================================
// CARD COMPONENT
// ============================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Card({ children, className, interactive = false, onClick }: CardProps) {
  const isClickable = interactive || !!onClick;

  const handleKeyDown = isClickable
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }
    : undefined;

  return (
    <div
      className={cn('card', interactive && 'card-interactive', className)}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('card-header', className)} {...props}>{children}</div>;
}

export function CardTitle({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('card-title', className)} {...props as React.HTMLAttributes<HTMLHeadingElement>}>{children}</h3>;
}

export function CardDescription({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('card-description', className)} {...props as React.HTMLAttributes<HTMLParagraphElement>}>{children}</p>;
}

export function CardBody({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('card-body', className)} {...props}>{children}</div>;
}

export function CardFooter({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('card-footer', className)} {...props}>{children}</div>;
}

// ============================================
// BADGE COMPONENT
// ============================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  return (
    <span className={cn('badge', badgeVariantMap[variant], className)}>
      {children}
    </span>
  );
}

// ============================================
// ALERT COMPONENT
// ============================================

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  title?: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ children, variant = 'info', title, onClose, className }: AlertProps) {
  return (
    <div className={cn('alert', alertVariantMap[variant], className)} role="alert">
      {AlertIcons[variant]}
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-description">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="alert-close-button"
          aria-label="Close alert"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================
// MODAL COMPONENT
// ============================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Modal({ isOpen, onClose, children, title, className }: ModalProps) {
  if (!isOpen) return null;

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={cn('modal', className)}
        onClick={handleContentClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
            <button onClick={onClose} className="modal-close" aria-label="Close modal" type="button">
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
}

interface ModalSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ModalBody({ children, className, ...props }: ModalSectionProps) {
  return <div className={cn('modal-body', className)} {...props}>{children}</div>;
}

export function ModalFooter({ children, className, ...props }: ModalSectionProps) {
  return <div className={cn('modal-footer', className)} {...props}>{children}</div>;
}

// ============================================
// SKELETON LOADING COMPONENT
// ============================================

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const style = useMemo(() => ({
    ...(width && { width }),
    ...(height && { height }),
  }), [width, height]);

  return (
    <div
      className={cn('skeleton', skeletonVariantMap[variant], className)}
      style={style}
      aria-busy="true"
      aria-label="Loading content placeholder"
    />
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

// ============================================
// ERROR STATE COMPONENT
// ============================================

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

const ErrorIcon = (
  <svg className="error-state-icon" viewBox="0 0 24 24">
    <path
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

export function ErrorState({ title, message, onRetry, onGoBack, className }: ErrorStateProps) {
  return (
    <div className={cn('error-state', className)} role="status">
      {ErrorIcon}
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      <div className="error-state-actions">
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack} type="button">
            Go Back
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" onClick={onRetry} type="button">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// AVATAR COMPONENT
// ============================================

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showFallback = !src || imageError;

  const initials = useMemo(() => {
    if (!fallback) return '?';

    return fallback
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [fallback]);

  return (
    <div className={cn('avatar', avatarSizeMap[size], className)} aria-label={alt || (showFallback ? 'Avatar with initials' : 'User avatar')}>
      {showFallback ? (
        <span>{initials}</span>