import { z } from "zod";

const dateString = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Use YYYY-MM-DD");

const timeString = z
  .string()
  .regex(/^[0-9]{2}:[0-9]{2}$/, "Use HH:mm");

export const calendarEventCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(2000).optional().default(""),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/, "Use #RRGGBB or #AARRGGBB"),
  category: z.string().min(1).optional().default("General"),
});

export const calendarEventUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().max(2000).optional(),
  date: dateString.optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/, "Use #RRGGBB or #AARRGGBB").optional(),
  category: z.string().min(1).optional(),
});
