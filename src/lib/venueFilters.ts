/**
 * Conservative name-based exclusion list — only venues whose entire business
 * model is definitively not soft play and cannot contain a soft play area.
 *
 * Leisure centres, trampoline parks, activity centres, bowling alleys etc.
 * are intentionally NOT excluded here because many have soft play areas inside.
 * It's better to show a borderline venue than wrongly hide a real one.
 *
 * Individual venues that are clearly wrong (outdoor parks, gyms) are marked
 * isExcluded=true in the database via scripts/mark-excluded-venues.js.
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

/** Returns a Prisma AND-clause array that excludes name-matched types and DB-flagged venues */
export function excludeNonSoftPlay() {
  return [
    // Exclude venues explicitly flagged by the admin/scripts
    { isExcluded: false } as const,
    // Exclude by known-bad name keywords
    ...SOFT_PLAY_EXCLUDE_KEYWORDS.map((kw) => ({
      NOT: { name: { contains: kw, mode: 'insensitive' as const } },
    })),
  ]
}
