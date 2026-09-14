/**
 * Read a query parameter out of the hash.
 * Usage: hashParam('email') from `#/verify?email=a@b.c` returns 'a@b.c'
 */
export function hashParam(name: string): string {
  const query = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query).get(name) ?? '';
}
