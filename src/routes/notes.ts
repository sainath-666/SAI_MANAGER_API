import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";
import { validateBody } from "../middleware/validate.js";
import { noteCreateSchema, noteUpdateSchema } from "../schemas/note.ts";

export const notesRouter = Router();

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

notesRouter.use(requireAuth);

notesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }

    const notes = (data as any[]).map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.category,
      isPinned: note.is_pinned,
      updatedAt: note.updated_at,
    }));

    sendSuccess(response, { notes });
  }),
);

notesRouter.post(
  "/",
  validateBody(noteCreateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const body = request.body as {
      title: string;
      content: string;
      category?: string;
      isPinned?: boolean;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        title: body.title,
        content: body.content,
        category: body.category || "General",
        is_pinned: body.isPinned ?? false,
      })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, error.message);
    }

    const note = {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      isPinned: data.is_pinned,
      updatedAt: data.updated_at,
    };

    sendSuccess(response, { note }, 201);
  }),
);

notesRouter.patch(
  "/:id",
  validateBody(noteUpdateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const noteId = getParamId(request.params.id, "note id");
    const body = request.body as {
      title?: string;
      content?: string;
      category?: string;
      isPinned?: boolean;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("notes")
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.isPinned !== undefined ? { is_pinned: body.isPinned } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(404, "Note not found");
    }

    const note = {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      isPinned: data.is_pinned,
      updatedAt: data.updated_at,
    };

    sendSuccess(response, { note });
  }),
);

notesRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const noteId = getParamId(request.params.id, "note id");
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId);

    if (error) {
      throw new ApiError(404, "Note not found");
    }

    sendSuccess(response, { deleted: true });
  }),
);
