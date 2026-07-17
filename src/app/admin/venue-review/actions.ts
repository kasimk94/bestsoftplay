'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Marks a venue as manually reviewed so it drops out of the low-confidence queue
// without losing the qualityScore/qualityReason data.
export async function markReviewed(id: string) {
  if (!id) return
  await prisma.venue.update({
    where: { id },
    data: { manuallyReviewed: true },
  })
  revalidatePath('/admin/venue-review')
}

export async function deleteVenueById(id: string) {
  if (!id) return
  await prisma.venue.delete({ where: { id } })
  revalidatePath('/admin/venue-review')
}

export async function searchVenuesByName(query: string) {
  const q = query.trim()
  if (!q) return []
  return prisma.venue.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    select: { id: true, name: true, qualityScore: true, city: { select: { name: true } } },
    orderBy: { name: 'asc' },
    take: 200,
  })
}

export async function bulkDeleteByName(query: string) {
  const q = query.trim()
  if (!q) return 0
  const result = await prisma.venue.deleteMany({
    where: { name: { contains: q, mode: 'insensitive' } },
  })
  revalidatePath('/admin/venue-review')
  return result.count
}
