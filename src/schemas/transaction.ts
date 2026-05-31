import { z } from "zod";

const dateTimeString = z.string().datetime();

export const transactionCreateSchema = z.object({
  title: z.string().min(1),
  amount: z.number().nonnegative(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1).default("General"),
  date: dateTimeString,
});

export const transactionUpdateSchema = transactionCreateSchema.partial();
