'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function flagVenue(formData: FormData) {
  const id = formData.get('id')
  const note = formData.get('note')

  if (typeof id !== 'string' || !id) return

  await prisma.venue.update({
    where: { id },
    data: {
      flagged: true,
      flagNote: typeof note === 'string' && note.trim() ? note.trim() : null,
    },
  })

  revalidatePath('/admin/venue-review')
}

export async function unflagVenue(formData: FormData) {
  const id = formData.get('id')

  if (typeof id !== 'string' || !id) return

  await prisma.venue.update({
    where: { id },
    data: { flagged: false, flagNote: null },
  })

  revalidatePath('/admin/venue-review')
}
