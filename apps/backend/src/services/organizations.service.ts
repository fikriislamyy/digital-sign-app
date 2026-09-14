import { eq } from 'drizzle-orm';
import type { db } from '../db';
import { organizations } from '../models/organizations.model';

// The transaction handle the caller is already inside. Passing it in is what
// lets this insert roll back together with the user insert around it.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
  return slug || 'org';
}

async function uniqueSlug(tx: Tx, base: string): Promise<string> {
  let candidate = base;
  for (let n = 2; ; n++) {
    const [taken] = await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (!taken) return candidate;
    candidate = `${base}-${n}`;
  }
}

export async function createOrganization(tx: Tx, name: string, ownerId: number) {
  const slug = await uniqueSlug(tx, slugify(name));
  const [organization] = await tx
    .insert(organizations)
    .values({ name: name.trim(), slug, ownerId })
    .returning();
  return organization;
}
