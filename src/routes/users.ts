import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";

export const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error) {
      throw new ApiError(404, "Profile not found");
    }

    sendSuccess(response, { profile: data });
  }),
);
