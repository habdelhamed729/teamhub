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
