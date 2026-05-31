import express from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { financeRouter } from "./routes/finance.js";
import { ApiError, sendError } from "./lib/http.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_request, response) => {
    response.json({
      success: true,
      data: {
        service: "SAI Manager API",
        version: "1.0.0",
      },
    });
  });

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/finance", financeRouter);

  app.use((request, _response, next) => {
    next(
      new ApiError(404, `Route not found: ${request.method} ${request.path}`),
    );
  });

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ApiError) {
        sendError(response, error.statusCode, error.message);
        return;
      }

      if (error instanceof Error) {
        sendError(response, 500, error.message);
        return;
      }

      sendError(response, 500, "Unexpected server error");
    },
  );

  return app;
}
