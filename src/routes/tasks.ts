import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";
import { validateBody } from "../middleware/validate.js";
import { taskUpdateSchema } from "../schemas/task.js";

export const tasksRouter = Router();

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

tasksRouter.use(requireAuth);

tasksRouter.patch(
  "/:id",
  validateBody(taskUpdateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const taskId = getParamId(request.params.id, "task id");
    const body = request.body as {
      title?: string;
      description?: string | null;
      status?: "todo" | "in_progress" | "done";
      priority?: "low" | "medium" | "high";
      dueDate?: string | null;
      orderIndex?: number;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("tasks")
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.dueDate !== undefined ? { due_date: body.dueDate } : {}),
        ...(body.orderIndex !== undefined
          ? { order_index: body.orderIndex }
          : {}),
      })
      .eq("id", taskId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(404, "Task not found");
    }

    sendSuccess(response, { task: data });
  }),
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const taskId = getParamId(request.params.id, "task id");
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", userId);

    if (error) {
      throw new ApiError(404, "Task not found");
    }

    sendSuccess(response, { deleted: true });
  }),
);
