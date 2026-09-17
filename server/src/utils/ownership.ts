import prisma from './prisma';

export class OwnershipError extends Error {
  statusCode = 403;
  code = 'RESOURCE_ACCESS_DENIED';
}

export const assertOwnedCategory = async (id: number | null | undefined, userId: number) => {
  if (id == null) return;
  const category = await prisma.category.findFirst({ where: { id, user_id: userId }, select: { id: true } });
  if (!category) throw new OwnershipError('Invalid category or access denied');
};

export const assertOwnedAccount = async (id: number | null | undefined, userId: number) => {
  if (id == null) return;
  const account = await prisma.account.findFirst({ where: { id, user_id: userId }, select: { id: true } });
  if (!account) throw new OwnershipError('Invalid account or access denied');
};
