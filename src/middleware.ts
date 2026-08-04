import { NextRequest, NextResponse } from 'next/server'

const BYPASS_COOKIE = 'bsp_preview'

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BestSoftPlay – Back Soon</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>🧸</text></svg>" />
<style>
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #7F77DD 0%, #9B8FE8 45%, #D85A30 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    background: #ffffff;
    border-radius: 24px;
    max-width: 480px;
    width: 100%;
    padding: 40px 32px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  }
  .emoji { font-size: 48px; line-height: 1; margin-bottom: 12px; }
  h1 {
    font-size: 22px;
    font-weight: 800;
    color: #1f2937;
    margin: 0 0 12px;
  }
  h1 span.purple { color: #7F77DD; }
  p {
    font-size: 15px;
    line-height: 1.6;
    color: #4b5563;
    margin: 0;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 20px;
    background: #F3F1FF;
    color: #7F77DD;
    font-weight: 600;
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 999px;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="emoji">🧸✨</div>
    <h1>Best<span class="purple">SoftPlay</span> is getting a glow-up</h1>
    <p>We're busy tidying up venue photos and listings behind the scenes. We'll be back very soon — thanks for your patience!</p>
    <div class="pill">🎊 Back shortly</div>
  </div>
</body>
</html>`

export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return NextResponse.next()
  }

  const secret = process.env.MAINTENANCE_BYPASS_SECRET
  const { searchParams } = request.nextUrl

  const previewParam = searchParams.get('preview')
  if (secret && previewParam === secret) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('preview')
    const response = NextResponse.redirect(cleanUrl)
    response.cookies.set(BYPASS_COOKIE, secret, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return response
  }

  const cookieVal = request.cookies.get(BYPASS_COOKIE)?.value
  if (secret && cookieVal === secret) {
    return NextResponse.next()
  }

  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '86400',
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
