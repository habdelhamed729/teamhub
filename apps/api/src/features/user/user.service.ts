import { prisma } from '../../database/prisma';

export const updateUser = async (
  userId: string,
  data: { display_name?: string; avatar_url?: string },
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
};

export const getUserProfile = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      display_name: true,
      avatar_url: true,
      created_at: true,
    },
  });
};

export const searchUsers = async (currentUserId: string, q: string, limit = 10) => {
  const ql = q.trim();
  if (!ql) return [];

  const users = await prisma.user.findMany({
    where: {
      AND: [{ id: { not: currentUserId } }],
      OR: [
        { display_name: { contains: ql, mode: 'insensitive' } },
        { email: { contains: ql, mode: 'insensitive' } },
      ],
    },
    select: { id: true, email: true, display_name: true, avatar_url: true, status: true },
    take: limit,
  });

  return users;
};
