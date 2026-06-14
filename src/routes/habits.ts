import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";
import { validateBody } from "../middleware/validate.js";
import { habitCreateSchema, habitUpdateSchema } from "../schemas/habit.js";

export const habitsRouter = Router();

function getUserId(userId: string | undefined): string {
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  return userId;
}

function getParamId(
  param: string | string[] | undefined,
  label: string,
): string {
  if (typeof param !== "string" || !param) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return param;
}

habitsRouter.use(requireAuth);

habitsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new ApiError(500, error.message);
    }

    const habits = (data as any[]).map((habit) => ({
      id: habit.id,
      title: habit.title,
      streak: habit.streak,
      done: habit.is_completed,
      createdAt: habit.created_at,
    }));

    sendSuccess(response, { habits });
  }),
);

habitsRouter.post(
  "/",
  validateBody(habitCreateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const body = request.body as {
      title: string;
      streak?: number;
      isCompleted?: boolean;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: userId,
        title: body.title,
        streak: body.streak ?? 0,
        is_completed: body.isCompleted ?? false,
      })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, error.message);
    }

    const habit = {
      id: data.id,
      title: data.title,
      streak: data.streak,
      done: data.is_completed,
      createdAt: data.created_at,
    };

    sendSuccess(response, { habit }, 201);
  }),
);

habitsRouter.patch(
  "/:id",
  validateBody(habitUpdateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const habitId = getParamId(request.params.id, "habit id");
    const body = request.body as {
      title?: string;
      streak?: number;
      isCompleted?: boolean;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("habits")
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.streak !== undefined ? { streak: body.streak } : {}),
        ...(body.isCompleted !== undefined ? { is_completed: body.isCompleted } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", habitId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(404, "Habit not found");
    }

    const habit = {
      id: data.id,
      title: data.title,
      streak: data.streak,
      done: data.is_completed,
      createdAt: data.created_at,
    };

    sendSuccess(response, { habit });
  }),
);

habitsRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const habitId = getParamId(request.params.id, "habit id");
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId)
      .eq("user_id", userId);

    if (error) {
      throw new ApiError(404, "Habit not found");
    }

    sendSuccess(response, { deleted: true });
  }),
);
