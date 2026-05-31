import type { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler(
  handler: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

export function sendSuccess(
  response: Response,
  data: unknown,
  statusCode = 200,
) {
  response.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(
  response: Response,
  statusCode: number,
  message: string,
  details?: unknown,
) {
  response.status(statusCode).json({
    success: false,
    error: {
      message,
      details,
    },
  });
}
