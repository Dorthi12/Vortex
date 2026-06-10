'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validation/authSchemas';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FormGroup, Input } from '@/components/ui/form';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate secure API credentials validation
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to OTP verification page to simulate two-factor security
      router.push(`/verify-otp?target=${encodeURIComponent(data.emailOrPhone)}&flow=login`);
    }, 1200);
  };

  return (
    <Card className="border-border-subtle bg-white shadow-lg">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-gov-navy text-center">Portal Sign In</CardTitle>
        <CardDescription className="text-center text-xs text-neutral-text-muted">
          Access the secure NETRAVAAH governance administration console
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="danger" title="Access Denied">{error}</Alert>}

          {/* Email or Phone field */}
          <FormGroup 
            label="Email Address or Phone Number" 
            required 
            errorText={errors.emailOrPhone?.message}
          >
            <Input
              type="text"
              placeholder="e.g., admin@gov.in or 9876543210"
              error={!!errors.emailOrPhone}
              {...register('emailOrPhone')}
            />
          </FormGroup>

          {/* Password field */}
          <FormGroup 
            label="Security Password" 
            required 
            errorText={errors.password?.message}
          >
            <Input
              type="password"
              placeholder="••••••••"
              error={!!errors.password}
              {...register('password')}
            />
          </FormGroup>

          {/* Checkbox and links */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-neutral-text cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-royal-blue focus:ring-royal-blue h-4 w-4"
                {...register('rememberMe')}
              />
              <span className="text-neutral-text-muted">Remember this terminal</span>
            </label>
            
            <Link 
              href="/forgot-password" 
              className="text-royal-blue hover:text-persian-blue font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit action */}
          <Button 
            type="submit" 
            variant="navy" 
            className="w-full mt-2 py-2.5 font-semibold text-xs uppercase tracking-wider" 
            isLoading={isLoading}
          >
            Authorize Access
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 justify-center text-center pb-6 bg-slate-50/50 rounded-b-lg border-t border-border-subtle">
        <p className="text-xs text-neutral-text-muted">
          New personnel?{' '}
          <Link 
            href="/register" 
            className="text-royal-blue hover:text-persian-blue font-bold hover:underline"
          >
            Request Access Credentials
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
