/**
 * Conservative exclusion list — only venues whose entire business model is
 * definitively not soft play and cannot contain a soft play area.
 *
 * Leisure centres, trampoline parks, activity centres, bowling alleys etc.
 * are intentionally NOT excluded here because many have soft play areas inside.
 * It's better to show a borderline venue than wrongly hide a real one.
 *
 * Note: the DB has no Google Places type/category field, so name-matching is
 * the only available signal. Keep this list narrow.
 */
export const SOFT_PLAY_EXCLUDE_KEYWORDS = [
  // Escape rooms — clearly adult entertainment, no soft play possible
  'Escape Room', 'Escape Time', 'Escape Zone',
  // Laser tag — same reasoning
  'Laser Tag', 'Laser Quest', 'LaserZone',
  // VR / immersive gaming
  'Sandbox VR', 'Gamebox', 'Crystal Maze',
  // Clearly adult-only entertainment
  'Bingo', 'Cinema',
]

/** Returns a Prisma AND filter that excludes the above venue types */
export function excludeNonSoftPlay() {
  return SOFT_PLAY_EXCLUDE_KEYWORDS.map((kw) => ({
    NOT: { name: { contains: kw, mode: 'insensitive' as const } },
  }))
}
