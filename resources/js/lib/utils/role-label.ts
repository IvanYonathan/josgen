export function formatRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return 'Unknown';
  }

  return role
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
