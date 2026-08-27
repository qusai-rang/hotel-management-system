import type { NextFunction, Request, Response } from 'express';
import { resolveRequestId } from '../utils/requestId';

/**
 * Resolves the correlation id (incoming X-Request-Id or generated UUID),
 * attaches it to the request for downstream handlers/logs and echoes it on
 * the response. Must be mounted before everything else.
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  req.requestId = resolveRequestId(req.headers['x-request-id']);
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
