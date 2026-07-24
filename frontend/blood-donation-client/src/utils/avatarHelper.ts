/**
 * Returns the avatar initial character for a user.
 * Priority: fullName (from Donors table) → username → fallback '?'
 * Safely handles null/undefined/empty string.
 */
export function getAvatarChar(fullName?: string | null, username?: string | null): string {
  const name = (fullName && fullName.trim()) || (username && username.trim()) || '';
  if (!name) return '?';
  return name[0].toUpperCase();
}

/**
 * Returns the display name for a user.
 * Priority: fullName (from Donors table) → username → ''
 */
export function getDisplayName(fullName?: string | null, username?: string | null): string {
  return (fullName && fullName.trim()) || (username && username.trim()) || '';
}
