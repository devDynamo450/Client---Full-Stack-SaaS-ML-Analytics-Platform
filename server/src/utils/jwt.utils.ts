import jwt from 'jsonwebtoken';

export const generateToken = (payload: {
  userId: string;
  email: string;
  role: string;
}): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as jwt.SignOptions);
};

export const generateTransactionId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};
