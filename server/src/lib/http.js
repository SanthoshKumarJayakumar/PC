export function ok(res, data = {}, status = 200, message = null) {
  return res.status(status).json({ success: true, data, message });
}

export function fail(res, code, message, status = 400, details) {
  return res.status(status).json({
    success: false,
    error: { code, message, details: details || undefined },
  });
}

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
