import React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-semibold leading-none text-form-label peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error = false, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-danger focus-visible:ring-danger',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text ring-offset-background placeholder:text-neutral-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-danger focus-visible:ring-danger',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error = false, ...props }, ref) => (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        error && 'border-danger focus-visible:ring-danger',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  errorText?: string;
  helperText?: string;
  required?: boolean;
}

export function FormGroup({
  label,
  errorText,
  helperText,
  required,
  children,
  className,
  ...props
}: FormGroupProps) {
  return (
    <div className={cn('flex flex-col space-y-2', className)} {...props}>
      {label && (
        <Label>
          {label} {required && <span className="text-danger">*</span>}
        </Label>
      )}
      {children}
      {errorText && <p className="text-xs font-medium text-danger">{errorText}</p>}
      {!errorText && helperText && <p className="text-xs text-neutral-text-muted">{helperText}</p>}
    </div>
  );
}
FormGroup.displayName = 'FormGroup';
