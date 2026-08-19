import { validationResult } from 'express-validator';
import { HttpError } from '../lib/http.js';

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw new HttpError(422, 'Validation failed', result.array());
  }
  next();
}
