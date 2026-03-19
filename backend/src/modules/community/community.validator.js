import { z } from "zod";

export const postSchema = z.object({
  caption: z
    .string()
    .min(1, "Caption must contain at least 1 character")
    .max(10, "Caption cannot exceed 10 characters"),

  locationName: z.string().min(1, "Location name is required"),

  latitude: z.coerce
    .number()
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),

  longitude: z.coerce
    .number()
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
  mediaKeys: z.array(z.string()).optional(),
});
