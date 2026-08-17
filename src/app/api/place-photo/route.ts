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

  let photoUrl: string

  if (ref.startsWith('places/')) {
    // New Places API v2 photo resource name (places/{placeId}/photos/{photoId}).
    // Must NOT encodeURIComponent the whole ref — its "/" separators are real
    // path segments for Google's API, not literal characters; encoding them
    // to %2F made every request 404.
    photoUrl =
      `https://places.googleapis.com/v1/${ref}/media` +
      `?maxHeightPx=${width}&key=${apiKey}&skipHttpRedirect=true`
  } else {
    // Old Places API photo reference — kept for any remaining legacy refs
    photoUrl =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=${width}&photo_reference=${encodeURIComponent(ref)}&key=${apiKey}`
  }

  const res = await fetch(photoUrl, { redirect: 'follow' })

  if (!res.ok) {
    return new NextResponse('Photo not found', { status: 404 })
  }

  // New API returns JSON with photoUri; follow it to get the actual image
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const json = await res.json()
    const uri = json?.photoUri
    if (!uri) return new NextResponse('Photo URI missing', { status: 404 })
    const imgRes = await fetch(uri, { redirect: 'follow' })
    if (!imgRes.ok) return new NextResponse('Photo fetch failed', { status: 404 })
    const buffer = await imgRes.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': imgRes.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  }

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
