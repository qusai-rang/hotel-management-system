import type { SafeUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      /**
       * Correlation id resolved from the incoming X-Request-Id header or
       * generated per request; echoed back on every response and attached
       * to all log lines for the request lifetime.
       */
      requestId: string;

      /**
       * Authenticated user attached by the authenticate middleware.
       * Undefined until authenticate runs successfully.
       */
      user?: SafeUser;
    }
  }
}

export {};
