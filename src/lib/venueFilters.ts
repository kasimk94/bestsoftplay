/** Keywords that identify non-soft-play venues that sneak in via broad Google Places searches */
export const SOFT_PLAY_EXCLUDE_KEYWORDS = [
  // Escape/VR
  'Activate', 'Escape Room', 'Escape Time', 'Escape Zone', 'Sandbox VR', 'Gamebox',
  // Laser
  'Laser Tag', 'Laser Quest', 'LaserZone',
  // Trampoline / jump parks
  'Trampoline Park', 'Flip Out', 'Jump Park', 'Jump Arena', 'Urban Jump',
  // Leisure / sports / fitness
  'Leisure Centre', 'Leisure Center', 'Sports Centre', 'Sports Center',
  'Health Club', 'Fitness Centre', 'Fitness Center',
  // Climbing / adventure
  'Rock Over Climbing', 'Clip n Climb', 'Clip\'n Climb', 'Ninja Warrior',
  'Treetop Golf', 'Treetop Adventure',
  // Entertainment / misc
  'Bowling', 'Crystal Maze', 'King Pins', 'Cinema', 'Bingo',
]

/** Returns a Prisma AND filter that excludes all non-soft-play venues */
export function excludeNonSoftPlay() {
  return SOFT_PLAY_EXCLUDE_KEYWORDS.map((kw) => ({
    NOT: { name: { contains: kw, mode: 'insensitive' as const } },
  }))
}

/**
 * Client-side filter for venue arrays already fetched from the DB.
 * Use this when you can't apply excludeNonSoftPlay() at the query level.
 */
export function filterSoftPlayVenues<T extends { name: string }>(venues: T[]): T[] {
  const lower = SOFT_PLAY_EXCLUDE_KEYWORDS.map((k) => k.toLowerCase())
  return venues.filter(
    (v) => !lower.some((kw) => v.name.toLowerCase().includes(kw))
  )
}
