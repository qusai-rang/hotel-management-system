import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/** Health probes poll frequently — keep them at debug to reduce noise. */
const DEBUG_ONLY_PATHS = new Set(['/api/v1/health']);

/**
 * Emits one structured log line per completed request:
 * { requestId, method, path, status, durationMs }.
 * Uses originalUrl because req.path/req.url may already be stripped by the
 * time the 'finish' event fires (mount-prefix rewriting). Only whitelisted
 * scalar fields are logged; headers and bodies never are.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const pathOnly = req.originalUrl.split('?')[0] ?? req.originalUrl;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const meta = {
      requestId: req.requestId,
      method: req.method,
      path: pathOnly,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    };
    if (DEBUG_ONLY_PATHS.has(pathOnly)) {
      logger.debug('request completed', meta);
    } else {
      logger.info('request completed', meta);
    }
  });

  next();
}
