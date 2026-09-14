import { sql, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { documents } from '../models/documents.model';

export type Granularity = 'hour' | 'day' | 'month';

export interface AnalyticsInput {
  userId: number;
  from: Date;
  to: Date;
  tz: string;
  granularity: Granularity;
}

export async function getAnalytics(input: AnalyticsInput) {
  const from = input.from.toISOString();
  const to = input.to.toISOString();

  const [totals] = await db.execute(sql`
    SELECT count(*)::int AS uploaded,
           count(*) FILTER (WHERE status = 'draft')::int AS draft,
           count(*) FILTER (WHERE status = 'sent')::int AS sent,
           count(*) FILTER (WHERE status = 'completed')::int AS completed
    FROM documents
    WHERE creator_id = ${input.userId} AND created_at >= ${from} AND created_at < ${to}
  `);

  const series = await db.execute(sql`
    SELECT to_char(date_trunc(${input.granularity}, created_at AT TIME ZONE ${input.tz}), 'YYYY-MM-DD"T"HH24:MI:SS') AS bucket,
           count(*)::int AS count
    FROM documents
    WHERE creator_id = ${input.userId} AND created_at >= ${from} AND created_at < ${to}
    GROUP BY 1
    ORDER BY 1
  `);

  return { totals, series };
}

export async function getRecentDocuments(userId: number) {
  return db
    .select({ id: documents.id, title: documents.title, status: documents.status, createdAt: documents.createdAt })
    .from(documents)
    .where(eq(documents.creatorId, userId))
    .orderBy(desc(documents.createdAt))
    .limit(5);
}
