import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";
import { validateBody } from "../middleware/validate.js";
import {
  projectCreateSchema,
  projectUpdateSchema,
} from "../schemas/project.js";
import { taskCreateSchema } from "../schemas/task.js";

export const projectsRouter = Router();

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

projectsRouter.use(requireAuth);

projectsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, tasks(id, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    const projects = (data as any[]).map((project) => {
      const tasks = Array.isArray(project.tasks)
        ? (project.tasks as Array<{ status?: string }>)
        : [];
      const tasksCount = tasks.length;
      const completedTasksCount = tasks.filter(
        (task) => task.status === "done",
      ).length;
      const targetTasksCount = Number(project.target_tasks_count ?? 0);
      const storedCompletedTasksCount = Number(
        project.completed_tasks_count ?? 0,
      );
      const visibleTasksCount = Math.max(tasksCount, targetTasksCount);
      const visibleCompletedTasksCount = Math.max(
        completedTasksCount,
        storedCompletedTasksCount,
      );
      const progress =
        visibleTasksCount > 0
          ? Math.min(visibleCompletedTasksCount / visibleTasksCount, 1)
          : 0;

      const formatted = {
        ...project,
        tasksCount: visibleTasksCount,
        completedTasksCount: visibleCompletedTasksCount,
        progress,
      };
      delete formatted.tasks;
      return formatted;
    });

    sendSuccess(response, { projects });
  }),
);

projectsRouter.post(
  "/",
  validateBody(projectCreateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);

    const supabase = getAdminClient();
    const body = request.body as {
      name: string;
      description?: string;
      category?: string;
      status?: "Planning" | "In Progress" | "Review" | "Completed";
      dueDate?: string | null;
      tasksCount?: number;
      completedTasksCount?: number;
    };

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: body.name,
        description: body.description || null,
        category: body.category || "General",
        status: body.status || "Planning",
        due_date: body.dueDate || null,
        target_tasks_count: body.tasksCount ?? 0,
        completed_tasks_count: body.completedTasksCount ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, error.message);
    }

    sendSuccess(
      response,
      {
        project: {
          ...data,
          tasksCount: data.target_tasks_count ?? 0,
          completedTasksCount: data.completed_tasks_count ?? 0,
          progress:
            data.target_tasks_count && data.target_tasks_count > 0
              ? Math.min(
                  (data.completed_tasks_count ?? 0) / data.target_tasks_count,
                  1,
                )
              : 0,
        },
      },
      201,
    );
  }),
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const projectId = getParamId(request.params.id, "project id");
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (error) {
      throw new ApiError(404, "Project not found");
    }

    sendSuccess(response, {
      project: {
        ...data,
        tasksCount: data.target_tasks_count ?? 0,
        completedTasksCount: data.completed_tasks_count ?? 0,
        progress:
          data.target_tasks_count && data.target_tasks_count > 0
            ? Math.min(
                (data.completed_tasks_count ?? 0) / data.target_tasks_count,
                1,
              )
            : 0,
      },
    });
  }),
);

projectsRouter.patch(
  "/:id",
  validateBody(projectUpdateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const projectId = getParamId(request.params.id, "project id");
    const body = request.body as {
      name?: string;
      description?: string | null;
      category?: string | null;
      status?: "Planning" | "In Progress" | "Review" | "Completed";
      dueDate?: string | null;
      tasksCount?: number;
      completedTasksCount?: number;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("projects")
      .update({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.category !== undefined
          ? { category: body.category ?? "General" }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.dueDate !== undefined ? { due_date: body.dueDate } : {}),
        ...(body.tasksCount !== undefined
          ? { target_tasks_count: body.tasksCount }
          : {}),
        ...(body.completedTasksCount !== undefined
          ? { completed_tasks_count: body.completedTasksCount }
          : {}),
      })
      .eq("id", projectId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(404, "Project not found");
    }

    sendSuccess(response, { project: data });
  }),
);

projectsRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const projectId = getParamId(request.params.id, "project id");
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId);

    if (error) {
      throw new ApiError(404, "Project not found");
    }

    sendSuccess(response, { deleted: true });
  }),
);

projectsRouter.get(
  "/:id/tasks",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const projectId = getParamId(request.params.id, "project id");
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("order_index", { ascending: true });

    if (error) {
      throw new ApiError(500, error.message);
    }

    sendSuccess(response, { tasks: data });
  }),
);

projectsRouter.post(
  "/:id/tasks",
  validateBody(taskCreateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const projectId = getParamId(request.params.id, "project id");
    const body = request.body as {
      title: string;
      description?: string;
      status?: "todo" | "in_progress" | "done";
      priority?: "low" | "medium" | "high";
      category?: string;
      dueDate?: string | null;
      orderIndex?: number;
    };
    const supabase = getAdminClient();

    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
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
