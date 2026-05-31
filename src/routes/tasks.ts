import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";
import { validateBody } from "../middleware/validate.js";
import { taskCreateSchema, taskUpdateSchema } from "../schemas/task.js";

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

tasksRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("order_index", { ascending: true });

    if (error) {
      throw new ApiError(500, error.message);
    }

    sendSuccess(response, { tasks: data });
  }),
);

tasksRouter.post(
  "/",
  validateBody(taskCreateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const body = request.body as {
      projectId?: string | null;
      title: string;
      description?: string;
      status?: "todo" | "in_progress" | "done";
      priority?: "low" | "medium" | "high";
      category?: string;
      dueDate?: string | null;
      orderIndex?: number;
    };
    const supabase = getAdminClient();

    if (body.projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", body.projectId)
        .eq("user_id", userId)
        .single();

      if (!project) {
        throw new ApiError(404, "Project not found");
      }
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        project_id: body.projectId ?? null,
        user_id: userId,
        title: body.title,
        description: body.description || null,
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        category: body.category || "General",
        due_date: body.dueDate ?? null,
        order_index: body.orderIndex ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, error.message);
    }

    sendSuccess(response, { task: data }, 201);
  }),
);

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
      category?: string | null;
      dueDate?: string | null;
      orderIndex?: number;
      projectId?: string | null;
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
        ...(body.category !== undefined
          ? { category: body.category ?? "General" }
          : {}),
        ...(body.dueDate !== undefined ? { due_date: body.dueDate } : {}),
        ...(body.orderIndex !== undefined
          ? { order_index: body.orderIndex }
          : {}),
        ...(body.projectId !== undefined ? { project_id: body.projectId } : {}),
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
