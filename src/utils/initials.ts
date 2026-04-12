export function userInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const p = name.split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ''}${p[p.length - 1][0] ?? ''}`.toUpperCase() || '?';
}
