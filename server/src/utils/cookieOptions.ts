import type { Request } from 'express';

export interface CookieSecurityOptions {
  secure: boolean;
  sameSite: 'none' | 'lax';
}

export function getCookieSecurityOptions(req: Request): CookieSecurityOptions {
  const forwardedProto = req.header('x-forwarded-proto')?.split(',')[0]?.trim();
  const isHttps = req.secure || forwardedProto === 'https';

  return {
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
  };
}
