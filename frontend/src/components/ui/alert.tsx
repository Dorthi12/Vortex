import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, onClose, ...props }, ref) => {
    const icons = {
      success: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
      warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
      danger: <AlertCircle className="w-5 h-5 text-danger shrink-0" />,
      info: <Info className="w-5 h-5 text-info shrink-0" />,
    };

    const variantStyles = {
      success: 'bg-success-light border-success/30 text-success-foreground dark:bg-success/10 dark:text-success',
      warning: 'bg-warning-light border-warning/30 text-warning-foreground dark:bg-warning/10 dark:text-warning',
      danger: 'bg-danger-light border-danger/30 text-danger-foreground dark:bg-danger/10 dark:text-danger',
      info: 'bg-info-light border-info/30 text-info-foreground dark:bg-info/10 dark:text-info',
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex gap-3 p-4 rounded-md border text-sm',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {icons[variant]}
        <div className="flex-1 space-y-1">
          {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
          <div className="text-neutral-text opacity-90 dark:text-neutral-white">{children}</div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-5 w-5 hover:bg-black/5 dark:hover:bg-white/5 -mt-1 -mr-1"
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
