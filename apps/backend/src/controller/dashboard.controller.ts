import type { HttpSet } from '../interface/http.interface';
import type { User } from '../models/users.model';
import { getAnalytics, getRecentDocuments } from '../services/dashboard.service';

export async function analyticsController({
  user,
  query,
  set,
}: {
  user: User;
  query: any;
  set: HttpSet;
}) {
  try {
    // Validate timezone
    try {
      new Intl.DateTimeFormat('en', { timeZone: query.tz });
    } catch {
      set.status = 400;
      return { error: 'Invalid timezone' };
    }

    const from = new Date(query.from);
    const to = new Date(query.to);

    if (to <= from) {
      set.status = 400;
      return { error: 'Invalid range' };
    }

    const data = await getAnalytics({
      userId: user.id,
      from,
      to,
      tz: query.tz,
      granularity: query.granularity,
    });

    return { success: true, data };
  } catch (error: any) {
    set.status = 500;
    return { error: 'Internal server error' };
  }
}

export async function recentController({ user }: { user: User }) {
  const data = await getRecentDocuments(user.id);
  return { success: true, data };
}
