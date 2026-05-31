import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";
import { validateBody } from "../middleware/validate.js";
import {
  transactionCreateSchema,
  transactionUpdateSchema,
} from "../schemas/transaction.js";

export const financeRouter = Router();

function getUserId(userId: string | undefined): string {
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  return userId;
}

function getParamId(param: string | string[] | undefined, label: string): string {
  if (typeof param !== "string" || !param) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return param;
}

financeRouter.use(requireAuth);

financeRouter.get(
  "/transactions",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    sendSuccess(response, { transactions: data });
  }),
);

financeRouter.post(
  "/transactions",
  validateBody(transactionCreateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const body = request.body as {
      title: string;
      amount: number;
      type: "income" | "expense";
      category: string;
      date: string;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...body, user_id: userId })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, error.message);
    }

    sendSuccess(response, { transaction: data }, 201);
  }),
);

financeRouter.patch(
  "/transactions/:id",
  validateBody(transactionUpdateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const transactionId = getParamId(request.params.id, "transaction id");
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("transactions")
      .update(request.body)
      .eq("id", transactionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(404, "Transaction not found");
    }

    sendSuccess(response, { transaction: data });
  }),
);

financeRouter.delete(
  "/transactions/:id",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const transactionId = getParamId(request.params.id, "transaction id");
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("user_id", userId);

    if (error) {
      throw new ApiError(404, "Transaction not found");
    }

    sendSuccess(response, { deleted: true });
  }),
);

financeRouter.get(
  "/summary",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const supabase = getAdminClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("transactions")
      .select("amount,type,date")
      .eq("user_id", userId);

    if (error) {
      throw new ApiError(500, error.message);
    }

    const weeklyData = Array.from({ length: 7 }, () => 0);
    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    for (const transaction of data ?? []) {
      const amount = Number(transaction.amount);
      const date = new Date(transaction.date);
      const signedAmount = transaction.type === "income" ? amount : -amount;
      totalBalance += signedAmount;

      if (date >= monthStart) {
        if (transaction.type === "income") {
          monthlyIncome += amount;
        } else {
          monthlyExpenses += amount;
        }
      }

      if (transaction.type === "expense" && date >= weekStart) {
        const dayIndex = (date.getDay() + 6) % 7;
        weeklyData[dayIndex] += amount;
      }
    }

    sendSuccess(response, {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      weeklyData,
    });
  }),
);
