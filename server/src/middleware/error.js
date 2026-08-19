import { fail } from "../lib/http.js";

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || "INTERNAL";
  const message =
    status >= 500 && process.env.NODE_ENV === "production" ? "Unexpected server error." : err.message || "Error";
  if (status >= 500) console.error(err);
  return fail(res, code, message, status, err.details);
}

export function notFound(_req, res) {
  return fail(res, "NOT_FOUND", "Route not found.", 404);
}
