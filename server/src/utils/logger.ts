import { env } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minWeight = LEVEL_WEIGHT[env.LOG_LEVEL];

/**
 * Lightweight structured logger: JSON lines on stdout/stderr, gated by
 * LOG_LEVEL. No framework. Callers pass only whitelisted scalar meta fields —
 * request headers and bodies must never reach this module (security rule H).
 */
function write(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  if (LEVEL_WEIGHT[level] < minWeight) {
    return;
  }
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta });
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>): void => write('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>): void => write('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>): void => write('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>): void => write('error', msg, meta),
};
