/** Keywords that identify non-soft-play venues that sneak in via broad Google Places searches */
export const SOFT_PLAY_EXCLUDE_KEYWORDS = [
  'Activate', 'Escape Room', 'Escape Time', 'Escape Zone',
  'Laser Tag', 'Laser Quest', 'LaserZone',
  'Bowling', 'Trampoline Park', 'Gamebox', 'Sandbox VR',
  'Crystal Maze', 'King Pins', 'Treetop Golf', 'Treetop Adventure',
  'Rock Over Climbing', 'Cinema', 'Bingo',
]

/** Returns a Prisma AND filter that excludes all non-soft-play venues */
export function excludeNonSoftPlay() {
  return SOFT_PLAY_EXCLUDE_KEYWORDS.map((kw) => ({
    NOT: { name: { contains: kw, mode: 'insensitive' as const } },
  }))
}
