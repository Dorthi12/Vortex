'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { otpSchema, OtpInput } from '@/lib/validation/authSchemas';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FormGroup, Input } from '@/components/ui/form';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = searchParams.get('target') || 'your registered contact';
  const flow = searchParams.get('flow') || 'login';

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(59);

  const { register, handleSubmit, formState: { errors } } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' }
  });

  // Resend countdown logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const onSubmit = async (data: OtpInput) => {
    setIsLoading(true);
    setError(null);

    // Simulate verification delay
    setTimeout(() => {
      setIsLoading(false);
      // Mock validation credentials: bypass with '123456'
      if (data.otp === '123456') {
        if (flow === 'forgot') {
          router.push('/reset-password');
        } else {
          localStorage.setItem('citizen_authenticated', 'true');
          router.push('/');
        }
      } else {
        setError('Verification code is incorrect. (Try using "123456" for validation testing)');
      }
    }, 1200);
  };

  const handleResend = () => {
    setTimer(59);
    setError(null);
  };

  return (
    <Card className="border-border-subtle bg-white shadow-lg">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-gov-navy text-center">Security Verification</CardTitle>
        <CardDescription className="text-center text-xs text-neutral-text-muted">
          A security passcode has been dispatched to <strong className="text-neutral-text">{target}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="danger" title="Verification Failed">{error}</Alert>}

          {/* OTP Code Input */}
          <FormGroup 
            label="Enter 6-Digit One-Time Passcode" 
            required 
            errorText={errors.otp?.message}
            helperText="Enter '123456' to pass the verification screen."
          >
            <Input
              type="text"
              maxLength={6}
              placeholder="0 0 0 0 0 0"
              className="text-center text-xl font-mono tracking-widest font-bold"
              error={!!errors.otp}
              {...register('otp')}
            />
          </FormGroup>

          {/* Submit */}
          <Button 
            type="submit" 
            variant="navy" 
            className="w-full mt-2 py-2.5 font-semibold text-xs uppercase tracking-wider" 
            isLoading={isLoading}
          >
            Authenticate Code
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 justify-center text-center pb-6 bg-slate-50/50 rounded-b-lg border-t border-border-subtle">
        <div className="text-xs text-neutral-text-muted">
          {timer > 0 ? (
            <span>Resend available in <strong className="text-royal-blue font-mono">{timer}s</strong></span>
          ) : (
            <button 
              type="button" 
              onClick={handleResend}
              className="text-royal-blue hover:text-persian-blue font-bold hover:underline cursor-pointer"
            >
              Resend One-Time Passcode
            </button>
          )}
        </div>
        <Link 
          href="/login" 
          className="text-xs text-neutral-text-muted hover:text-neutral-text hover:underline"
        >
          Cancel and return to login
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <Card className="border-border-subtle bg-white shadow-lg p-8 text-center text-sm text-neutral-text-muted">
        Loading verification panel...
      </Card>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
