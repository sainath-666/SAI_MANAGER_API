import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../lib/http.js";

export function validateBody(schema: ZodSchema) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return next(new ApiError(400, "Validation failed"));
    }

    request.body = result.data;
    return next();
  };
}
