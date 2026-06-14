import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";
import { validateBody } from "../middleware/validate.js";
import { calendarEventCreateSchema, calendarEventUpdateSchema } from "../schemas/calendarEvent.ts";

export const calendarRouter = Router();

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

calendarRouter.use(requireAuth);

calendarRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      throw new ApiError(500, error.message);
    }

    const events = (data as any[]).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.start_time,
      endTime: event.end_time,
      colorHex: event.color_hex,
      category: event.category,
    }));

    sendSuccess(response, { events });
  }),
);

calendarRouter.post(
  "/",
  validateBody(calendarEventCreateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const body = request.body as {
      title: string;
      description?: string;
      date: string;
      startTime: string;
      endTime: string;
      colorHex: string;
      category?: string;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: userId,
        title: body.title,
        description: body.description || "",
        date: body.date,
        start_time: body.startTime,
        end_time: body.endTime,
        color_hex: body.colorHex,
        category: body.category || "General",
      })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, error.message);
    }

    const event = {
      id: data.id,
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      colorHex: data.color_hex,
      category: data.category,
    };

    sendSuccess(response, { event }, 201);
  }),
);

calendarRouter.patch(
  "/:id",
  validateBody(calendarEventUpdateSchema),
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const eventId = getParamId(request.params.id, "event id");
    const body = request.body as {
      title?: string;
      description?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      colorHex?: string;
      category?: string;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("calendar_events")
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.date !== undefined ? { date: body.date } : {}),
        ...(body.startTime !== undefined ? { start_time: body.startTime } : {}),
        ...(body.endTime !== undefined ? { end_time: body.endTime } : {}),
        ...(body.colorHex !== undefined ? { color_hex: body.colorHex } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(404, "Calendar event not found");
    }

    const event = {
      id: data.id,
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      colorHex: data.color_hex,
      category: data.category,
    };

    sendSuccess(response, { event });
  }),
);

calendarRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const userId = getUserId(request.user?.id);
    const eventId = getParamId(request.params.id, "event id");
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", userId);

    if (error) {
      throw new ApiError(404, "Calendar event not found");
    }

    sendSuccess(response, { deleted: true });
  }),
);
