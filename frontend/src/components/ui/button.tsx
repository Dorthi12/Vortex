import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | 'primary'      // Royal Blue default brand action
    | 'navy'         // Deep Government Navy
    | 'persian'      // Persian Blue vibrant accent
    | 'secondary'    // Slate gray background
    | 'outline'      // Border with transparent background
    | 'ghost'        // Hover-only background
    | 'link'         // Text with underline
    | 'success'      // Success state
    | 'warning'      // Warning state
    | 'danger'       // Danger state
    | 'info';        // Info state
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
    
    const variants = {
      primary: 'bg-royal-blue text-neutral-white hover:bg-royal-blue-light shadow-sm shadow-royal-blue/10 active:scale-[0.98]',
      navy: 'bg-gov-navy text-neutral-white hover:bg-gov-navy-light shadow-sm active:scale-[0.98]',
      persian: 'bg-persian-blue text-neutral-white hover:opacity-90 active:scale-[0.98]',
      secondary: 'bg-border-subtle text-neutral-text hover:bg-slate-200 active:scale-[0.98]',
      outline: 'border border-border-subtle bg-transparent text-neutral-text hover:bg-slate-50',
      ghost: 'bg-transparent text-neutral-text hover:bg-slate-100 dark:hover:bg-slate-800',
      link: 'bg-transparent text-royal-blue underline-offset-4 hover:underline p-0',
      success: 'bg-success text-neutral-white hover:bg-success/90 active:scale-[0.98]',
      warning: 'bg-warning text-neutral-white hover:bg-warning/90 active:scale-[0.98]',
      danger: 'bg-danger text-neutral-white hover:bg-danger/90 active:scale-[0.98]',
      info: 'bg-info text-neutral-white hover:bg-info/90 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
