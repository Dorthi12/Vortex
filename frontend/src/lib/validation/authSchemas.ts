import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;

// Reusable email or phone validator
export const emailOrPhoneField = z.string().refine(
  (value) => emailRegex.test(value) || phoneRegex.test(value),
  {
    message: 'Please enter a valid email address or a 10-digit phone number.',
  }
);

// 1. Login Schema
export const loginSchema = z.object({
  emailOrPhone: emailOrPhoneField,
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 2. Register Schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().regex(phoneRegex, 'Phone number must be exactly 10 digits.'),
  role: z.enum(['citizen', 'official', 'emergency', 'admin'], {
    message: 'Please select a valid user role.',
  }),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  confirmPassword: z.string().min(6, 'Please confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

// 3. OTP Schema
export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits.').regex(/^[0-9]+$/, 'OTP must contain only numbers.'),
});

export type OtpInput = z.infer<typeof otpSchema>;

// 4. Forgot Password Schema
export const forgotPasswordSchema = z.object({
  emailOrPhone: emailOrPhoneField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// 5. Reset Password Schema
export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  confirmPassword: z.string().min(6, 'Please confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
