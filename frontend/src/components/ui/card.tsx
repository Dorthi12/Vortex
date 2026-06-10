import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
  accentBorder?: 'none' | 'left' | 'top';
  accentColor?: 'navy' | 'royal' | 'persian' | 'success' | 'warning' | 'danger' | 'info';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, hoverable = false, accentBorder = 'none', accentColor = 'royal', children, ...props }, ref) => {
    const borderAccentClasses = {
      none: '',
      left: {
        navy: 'border-l-4 border-l-gov-navy',
        royal: 'border-l-4 border-l-royal-blue',
        persian: 'border-l-4 border-l-persian-blue',
        success: 'border-l-4 border-l-success',
        warning: 'border-l-4 border-l-warning',
        danger: 'border-l-4 border-l-danger',
        info: 'border-l-4 border-l-info',
      },
      top: {
        navy: 'border-t-4 border-t-gov-navy',
        royal: 'border-t-4 border-t-royal-blue',
        persian: 'border-t-4 border-t-persian-blue',
        success: 'border-t-4 border-t-success',
        warning: 'border-t-4 border-t-warning',
        danger: 'border-t-4 border-t-danger',
        info: 'border-t-4 border-t-info',
      },
    };

    const accentClass = accentBorder === 'none' 
      ? '' 
      : typeof borderAccentClasses[accentBorder] === 'string'
        ? borderAccentClasses[accentBorder]
        : (borderAccentClasses[accentBorder] as Record<string, string>)[accentColor];

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden',
          glass && 'glass-panel',
          hoverable && 'smooth-hover cursor-pointer',
          accentClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight font-sans', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-neutral-text-muted', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0 border-t border-t-border-subtle mt-4', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
