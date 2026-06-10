'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/lib/validation/authSchemas';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FormGroup, Input, Select } from '@/components/ui/form';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'citizen',
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate secure registration request
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to OTP verification for new users
      router.push(`/verify-otp?target=${encodeURIComponent(data.phone)}&flow=register`);
    }, 1500);
  };

  return (
    <Card className="border-border-subtle bg-white shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-gov-navy text-center">Request Access Credentials</CardTitle>
        <CardDescription className="text-center text-xs text-neutral-text-muted">
          Register new personnel account on the NETRAVAAH platform
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="danger" title="Registration Failed">{error}</Alert>}

          {/* Full Name */}
          <FormGroup 
            label="Full Administrative Name" 
            required 
            errorText={errors.name?.message}
          >
            <Input
              type="text"
              placeholder="e.g. Inspector Jane Doe"
              error={!!errors.name}
              {...register('name')}
            />
          </FormGroup>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Address */}
            <FormGroup 
              label="Official Email Address" 
              required 
              errorText={errors.email?.message}
            >
              <Input
                type="email"
                placeholder="e.g. jane.doe@gov.in"
                error={!!errors.email}
                {...register('email')}
              />
            </FormGroup>

            {/* Phone Number */}
            <FormGroup 
              label="Contact Mobile Number" 
              required 
              errorText={errors.phone?.message}
            >
              <Input
                type="tel"
                placeholder="10-digit number"
                error={!!errors.phone}
                {...register('phone')}
              />
            </FormGroup>
          </div>

          {/* User Role Selection */}
          <FormGroup 
            label="Administrative User Role Tier" 
            required 
            errorText={errors.role?.message}
          >
            <Select
              error={!!errors.role}
              {...register('role')}
            >
              <option value="citizen">Citizen / General Public</option>
              <option value="official">Government Official / Administrator</option>
              <option value="emergency">Emergency Operations Staff</option>
              <option value="admin">System Architect Admin</option>
            </Select>
          </FormGroup>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <FormGroup 
              label="Password" 
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
              label="Confirm Password" 
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
          </div>

          {/* Submit registration request */}
          <Button 
            type="submit" 
            variant="navy" 
            className="w-full mt-2 py-2.5 font-semibold text-xs uppercase tracking-wider" 
            isLoading={isLoading}
          >
            Submit Credentials Request
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 justify-center text-center pb-6 bg-slate-50/50 rounded-b-lg border-t border-border-subtle">
        <p className="text-xs text-neutral-text-muted">
          Already have credentials?{' '}
          <Link 
            href="/login" 
            className="text-royal-blue hover:text-persian-blue font-bold hover:underline"
          >
            Sign In Here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
