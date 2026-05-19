import bcrypt from 'bcrypt';
import { prisma } from '../../database/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';

const SALT_ROUNDS = 12;
const REFRESH_COOKIE = 'refresh_token';

// ─── helpers ────────────────────────────────────────────────────────────────

const sanitizeUser = (user: {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}) => ({
  id:           user.id,
  email:        user.email,
  display_name: user.display_name,
  avatar_url:   user.avatar_url,
  status:       user.status,
  created_at:   user.created_at,
  updated_at:   user.updated_at,
});

// ─── register ───────────────────────────────────────────────────────────────

export const register = async (dto: {
  email: string;
  password: string;
  display_name: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email: dto.email, password_hash, display_name: dto.display_name },
  });

  const payload = { sub: user.id, email: user.email };
  const access_token   = signAccessToken(payload);
  const refresh_token  = signRefreshToken(payload);
  const refresh_token_hash = await bcrypt.hash(refresh_token, SALT_ROUNDS);

  await prisma.user.update({ where: { id: user.id }, data: { refresh_token_hash } });

  return { user: sanitizeUser(user), access_token, refresh_token };
};

// ─── login ──────────────────────────────────────────────────────────────────

export const login = async (dto: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(dto.password, user.password_hash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const payload = { sub: user.id, email: user.email };
  const access_token   = signAccessToken(payload);
  const refresh_token  = signRefreshToken(payload);
  const refresh_token_hash = await bcrypt.hash(refresh_token, SALT_ROUNDS);

  await prisma.user.update({ where: { id: user.id }, data: { refresh_token_hash } });

  return { user: sanitizeUser(user), access_token, refresh_token };
};

// ─── logout ─────────────────────────────────────────────────────────────────

export const logout = async (userId: string) => {
  await prisma.user.update({
    where:  { id: userId },
    data:   { refresh_token_hash: null },
  });
};

// ─── refresh ────────────────────────────────────────────────────────────────

export const refresh = async (rawToken: string) => {
  // Verify signature first (throws if expired / tampered)
  const payload = verifyRefreshToken(rawToken);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.refresh_token_hash) {
    throw Object.assign(new Error('Session expired — please log in again'), { status: 401 });
  }

  const tokenMatches = await bcrypt.compare(rawToken, user.refresh_token_hash);
  if (!tokenMatches) {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  // Issue a fresh pair (rotation)
  const newPayload = { sub: user.id, email: user.email };
  const access_token   = signAccessToken(newPayload);
  const refresh_token  = signRefreshToken(newPayload);
  const refresh_token_hash = await bcrypt.hash(refresh_token, SALT_ROUNDS);

  await prisma.user.update({ where: { id: user.id }, data: { refresh_token_hash } });

  return { user: sanitizeUser(user), access_token, refresh_token };
};

// ─── getMe ──────────────────────────────────────────────────────────────────

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return sanitizeUser(user);
};
