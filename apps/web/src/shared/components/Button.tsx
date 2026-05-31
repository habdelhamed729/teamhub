import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      icon,
      iconOnly = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center cursor-pointer rounded-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none gap-2';

    const variants = {
      primary: 'bg-primary-accent text-main-bg hover:opacity-90 shadow-[0_0_15px_rgba(94,234,212,0.3)]',
      secondary: 'bg-surface-elevated text-text-primary hover:bg-surface-secondary border border-white/5',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
      danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20',
      'danger-solid': 'bg-danger hover:bg-danger/80 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-transparent',
      accent: 'bg-primary-accent/10 text-primary-accent border border-primary-accent/20 hover:bg-primary-accent/20 hover:shadow-[0_0_15px_rgba(94,234,212,0.15)]',
    };

    const sizes = iconOnly
      ? {
          sm: 'p-1.5 text-sm',
          md: 'p-2.5 text-base',
          lg: 'p-3.5 text-lg',
        }
      : {
          sm: 'px-3 py-1.5 text-sm',
          md: 'px-4 py-2 text-base',
          lg: 'px-6 py-3 text-lg',
        };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon && <span className="inline-flex items-center justify-center">{icon}</span>
        )}
        {!iconOnly && children}
      </button>
    );
  }
);

Button.displayName = 'Button';