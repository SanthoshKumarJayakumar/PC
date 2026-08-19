import { HttpError } from '../lib/http.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'That record already exists.' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  const message =
    process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message || 'Error';
  res.status(500).json({ error: message });
}
