import { validationResult } from "express-validator";
import { fail } from "../lib/http.js";

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, "VALIDATION", "Invalid input.", 422, errors.array());
  }
  next();
}
