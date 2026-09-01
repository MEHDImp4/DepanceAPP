import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

export const TOKEN_ISSUER = 'depance-api';
export const TOKEN_AUDIENCE = 'depance-app';
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '30d';

const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET!;
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;

export const signAccessToken = (user: { id: number; email: string }): string => jwt.sign(
  { userId: user.id, email: user.email, typ: 'access' },
  accessSecret(),
  { expiresIn: ACCESS_TOKEN_EXPIRY, issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, algorithm: 'HS256' }
);

export const signRefreshToken = (userId: number): string => jwt.sign(
  { userId, jti: randomUUID(), typ: 'refresh' },
  refreshSecret(),
  { expiresIn: REFRESH_TOKEN_EXPIRY, issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, algorithm: 'HS256' }
);

export const verifyAccessToken = (token: string) => {
  const payload = jwt.verify(token, accessSecret(), {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    algorithms: ['HS256']
  });
  if (typeof payload === 'string' || payload.typ !== 'access' || typeof payload.userId !== 'number') {
    throw new jwt.JsonWebTokenError('Invalid access token type');
  }
  return payload;
};

export const verifyRefreshToken = (token: string) => {
  const payload = jwt.verify(token, refreshSecret(), {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    algorithms: ['HS256']
  });
  if (typeof payload === 'string' || payload.typ !== 'refresh' || typeof payload.userId !== 'number') {
    throw new jwt.JsonWebTokenError('Invalid refresh token type');
  }
  return payload;
};

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');
