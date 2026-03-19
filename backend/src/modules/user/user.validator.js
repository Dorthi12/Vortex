import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    gender: z
      .enum(["Male", "Female", "Others", "Prefer not to say"])
      .optional(),

    phoneNumber: z
      .string()
      .regex(
        /^[6-9]\d{9}$/,
        "Phone number must be a valid 10 digit Indian mobile number",
      )
      .optional(),

    dateOfBirth: z.coerce
      .date()
      .max(new Date(), "Date of birth cannot be in the future")
      .optional(),

    key: z.string().optional(),

    themePreference: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),

    city: z.string().min(1, "City cannot be empty").max(100).optional(),

    state: z.string().min(1, "State cannot be empty").max(100).optional(),
  })
  .strict();
