import prisma from './prisma';

export class OwnershipError extends Error {
  statusCode = 400;
}

export const assertOwnedCategory = async (id: number | null | undefined, userId: number) => {
  if (id == null) return;
  const category = await prisma.category.findFirst({ where: { id, user_id: userId }, select: { id: true } });
  if (!category) throw new OwnershipError('Invalid category');
};

export const assertOwnedAccount = async (id: number | null | undefined, userId: number) => {
  if (id == null) return;
  const account = await prisma.account.findFirst({ where: { id, user_id: userId }, select: { id: true } });
  if (!account) throw new OwnershipError('Invalid account');
};
