import { Prisma } from '@prisma/client';
import prisma from './prisma';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export interface StoredResponse<T> {
  statusCode: number;
  body: T;
  replayed: boolean;
}

export const runIdempotent = async <T>(
  userId: number,
  operation: string,
  rawKey: string | undefined,
  action: (database: Prisma.TransactionClient) => Promise<{ statusCode: number; body: T }>
): Promise<StoredResponse<T>> => {
  const key = rawKey?.trim();
  if (key && key.length > 128) throw Object.assign(new Error('Idempotency-Key is too long'), { statusCode: 400 });

  try {
    const result = await prisma.$transaction(async database => {
      if (key) {
        await database.idempotencyKey.create({
          data: {
            user_id: userId,
            operation,
            key,
            expires_at: new Date(Date.now() + IDEMPOTENCY_TTL_MS)
          }
        });
      }

      const response = await action(database);
      if (key) {
        await database.idempotencyKey.update({
          where: { user_id_operation_key: { user_id: userId, operation, key } },
          data: { status_code: response.statusCode, response_body: JSON.stringify(response.body) }
        });
      }
      return response;
    });
    return { ...result, replayed: false };
  } catch (error) {
    if (!key || !(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;

    const stored = await prisma.idempotencyKey.findUnique({
      where: { user_id_operation_key: { user_id: userId, operation, key } }
    });
    if (!stored?.response_body || !stored.status_code) {
      throw Object.assign(new Error('An identical request is already being processed'), { statusCode: 409 });
    }
    return { statusCode: stored.status_code, body: JSON.parse(stored.response_body) as T, replayed: true };
  }
};
