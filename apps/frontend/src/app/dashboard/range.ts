export type Granularity = 'hour' | 'day' | 'month';
export type Range = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface TimeRange {
  from: Date;
  to: Date;
  granularity: Granularity;
  tz: string;
}

export interface Summary {
  label: string;
  value: number;
  peak: number;
  average: number;
}

const ranges: Record<Range, { label: string; granularity: Granularity; daysBack: number }> = {
  today: { label: 'Today', granularity: 'hour', daysBack: 0 },
  week: { label: 'This Week', granularity: 'day', daysBack: 6 },
  month: { label: 'This Month', granularity: 'day', daysBack: 29 },
  quarter: { label: 'This Quarter', granularity: 'day', daysBack: 89 },
  year: { label: 'This Year', granularity: 'month', daysBack: 364 },
  all: { label: 'All Time', granularity: 'month', daysBack: 3650 },
};

export function getTimeRange(range: Range, tz: string): TimeRange {
  const config = ranges[range];
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - config.daysBack);

  return { from, to, granularity: config.granularity, tz };
}

export function rangeLabel(range: Range): string {
  return ranges[range].label;
}

export function summarize(series: Array<{ bucket: string; count: number }>): Summary {
  if (!series.length) {
    return { label: 'No data', value: 0, peak: 0, average: 0 };
  }

  const total = series.reduce((sum, item) => sum + item.count, 0);
  const peak = Math.max(...series.map((item) => item.count));
  const average = Math.round(total / series.length);

  return {
    label: `${total} documents`,
    value: total,
    peak,
    average,
  };
}

export function bucketsFor(granularity: Granularity, from: Date, to: Date, tz: string): string[] {
  const buckets: string[] = [];
  const current = new Date(from);

  while (current < to) {
    const iso = current.toISOString();
    if (granularity === 'hour') {
      buckets.push(iso.slice(0, 13) + ':00:00');
      current.setHours(current.getHours() + 1);
    } else if (granularity === 'day') {
      buckets.push(iso.slice(0, 10) + 'T00:00:00');
      current.setDate(current.getDate() + 1);
    } else if (granularity === 'month') {
      buckets.push(iso.slice(0, 7) + '-01T00:00:00');
      current.setMonth(current.getMonth() + 1);
    }
  }

  return buckets;
}
