import { Router } from "express";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (request, response) => {
    const { email, password, fullName } = request.body as {
      email: string;
      password: string;
      fullName?: string;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
      },
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    if (!data.user) {
      throw new ApiError(500, "Unable to create user");
    }

    const profileInsert = await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName || null,
    });

    if (profileInsert.error) {
      throw new ApiError(500, profileInsert.error.message);
    }

    sendSuccess(
      response,
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: fullName || null,
        },
        session: data.session,
      },
      201,
    );
  }),
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (request, response) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };
    const supabase = getAdminClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ApiError(401, error.message);
    }

    sendSuccess(response, {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    });
  }),
);
