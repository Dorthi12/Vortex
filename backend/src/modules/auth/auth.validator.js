import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export const registerSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  email: z.email(),
  password: z
    .string()
    .regex(
      passwordRegex,
      "Password must be at least 8 characters and include one uppercase, one lowercase, and one special character",
    ),
  role: z.enum(["USER", "LEADER", "ADMINISTRATOR", "REPRESENTATIVE"]),
  dob: z.coerce.date(),
  gender: z.enum(["Male", "Female", "Others", "Prefer not to say"]),
  loggedIn: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password cannot be empty"),
  loggedIn: z.boolean().optional(),
});
