import { z } from "zod";

// ─── Profile ──────────────────────────────────────────────────────────────────
export const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(1, "Age must be at least 1").max(120, "Age must be at most 120"),
  gender: z.enum(["male", "female", "other"]),
  weight: z.coerce.number().positive("Weight must be positive"),
  height: z.coerce.number().positive("Height must be positive"),
  activity_level: z.enum(["sedentary", "light", "moderate", "active"]),
  goal: z.enum(["weight_loss", "weight_gain", "maintain"]),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
