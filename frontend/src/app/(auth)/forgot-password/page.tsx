'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validation/authSchemas';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FormGroup, Input } from '@/components/ui/form';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { emailOrPhone: '' }
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    
    // Simulate code dispatch
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to OTP verification with flow = forgot so it knows where to route next
      router.push(`/verify-otp?target=${encodeURIComponent(data.emailOrPhone)}&flow=forgot`);
    }, 1200);
  };

  return (
    <Card className="border-border-subtle bg-white shadow-lg">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-gov-navy text-center">Recover Password</CardTitle>
        <CardDescription className="text-center text-xs text-neutral-text-muted">
          Identify your registered account parameters to trigger verification
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Account Email or Phone */}
          <FormGroup 
            label="Administrative Email Address or Phone" 
            required 
            errorText={errors.emailOrPhone?.message}
            helperText="A security passcode will be sent to verify your access."
          >
            <Input
              type="text"
              placeholder="e.g., administrator@gov.in or 9876543210"
              error={!!errors.emailOrPhone}
              {...register('emailOrPhone')}
            />
          </FormGroup>

          {/* Submit */}
          <Button 
            type="submit" 
            variant="navy" 
            className="w-full mt-2 py-2.5 font-semibold text-xs uppercase tracking-wider" 
            isLoading={isLoading}
          >
            Generate Verification Code
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center text-center pb-6 bg-slate-50/50 rounded-b-lg border-t border-border-subtle">
        <Link 
          href="/login" 
          className="text-xs text-royal-blue hover:text-persian-blue font-bold hover:underline"
        >
          Return to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
