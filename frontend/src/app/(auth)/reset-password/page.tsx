'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '@/lib/validation/authSchemas';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FormGroup, Input } from '@/components/ui/form';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setError(null);

    // Simulate password reset API request
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }, 1200);
  };

  return (
    <Card className="border-border-subtle bg-white shadow-lg">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-gov-navy text-center">Reset Credentials</CardTitle>
        <CardDescription className="text-center text-xs text-neutral-text-muted">
          Define a new security passcode for your administrative account
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="py-6 space-y-3 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
            <div className="h-12 w-12 rounded-full bg-success-light border border-success/30 flex items-center justify-center">
              <span className="text-success text-lg font-bold">✓</span>
            </div>
            <h4 className="text-sm font-bold text-neutral-text">Password Reset Completed</h4>
            <p className="text-xs text-neutral-text-muted">
              Syncing terminal... Redirecting to login console
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <Alert variant="danger" title="Save Failed">{error}</Alert>}

            {/* New Password */}
            <FormGroup 
              label="New Security Password" 
              required 
              errorText={errors.password?.message}
            >
              <Input
                type="password"
                placeholder="Min 6 characters"
                error={!!errors.password}
                {...register('password')}
              />
            </FormGroup>

            {/* Confirm Password */}
            <FormGroup 
              label="Confirm New Password" 
              required 
              errorText={errors.confirmPassword?.message}
            >
              <Input
                type="password"
                placeholder="Re-enter password"
                error={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
            </FormGroup>

            {/* Submit */}
            <Button 
              type="submit" 
              variant="navy" 
              className="w-full mt-2 py-2.5 font-semibold text-xs uppercase tracking-wider" 
              isLoading={isLoading}
            >
              Save Credentials
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center text-center pb-6 bg-slate-50/50 rounded-b-lg border-t border-border-subtle">
        <Link 
          href="/login" 
          className="text-xs text-royal-blue hover:text-persian-blue font-bold hover:underline"
        >
          Cancel and return
        </Link>
      </CardFooter>
    </Card>
  );
}
