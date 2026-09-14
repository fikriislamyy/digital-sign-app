import { pgTable, serial, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.model';

export const otpCodes = pgTable(
  'otp_codes',
  {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 6 }).notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiredAt: timestamp('expired_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('otp_codes_user_id_idx').on(table.userId),
    userIdCreatedAtIdx: index('otp_codes_user_id_created_at_idx').on(table.userId, table.createdAt),
  })
);

export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;
