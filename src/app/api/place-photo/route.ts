import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  const width = request.nextUrl.searchParams.get('w') ?? '800'

  if (!ref) {
    return new NextResponse('Missing ref', { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return new NextResponse('API key not configured', { status: 500 })
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=${width}&photo_reference=${encodeURIComponent(ref)}&key=${apiKey}`

  const res = await fetch(url, { redirect: 'follow' })

  if (!res.ok) {
    return new NextResponse('Photo not found', { status: 404 })
  }

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
