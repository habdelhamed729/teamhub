import { type InputHTMLAttributes } from 'react';

interface InputProps {
  variant?: 'default' | 'error';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  type?: string;
  className?: string;
  onChange?: InputHTMLAttributes<HTMLInputElement>['onChange'];
  value?: InputHTMLAttributes<HTMLInputElement>['value'];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

export function Input({
  className = '',
  variant = 'default',
  size = 'md',
  label,
  error,
  type = 'text',
  onChange,
  value,
  placeholder,
  disabled,
  name,
}: InputProps) {
  const baseStyles =
    'w-full rounded-lg border bg-surface-secondary text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    default:
      'border-white/5 focus:border-primary-accent/50 focus:ring-primary-accent/50',
    error:
      'border-danger/50 focus:border-danger focus:ring-danger',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  return (
    <div className="w-full space-y-2 text-left">
      {label && (
        <label className="text-sm font-medium text-text-secondary ml-1">
          {label}
        </label>
      )}

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      />

      {error && (
        <p className="text-xs text-danger ml-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}