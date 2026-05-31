import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/http.js";
import { getAdminClient } from "../lib/supabase.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
      };
    }
  }
}

export async function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const authHeader = request.header("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing bearer token");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new ApiError(401, "Invalid or expired token");
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
    };

    next();
  } catch (error) {
    next(error);
  }
}
