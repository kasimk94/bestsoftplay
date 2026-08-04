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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #7F77DD 0%, #9B8FE8 45%, #D85A30 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 22px 16px 0;
  }
  header .logo-emoji { font-size: 26px; }
  header .brand {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #fff;
  }
  header .brand .soft { opacity: 0.78; font-weight: 700; }
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 28px 20px 64px;
  }
  .bounce-row { display: flex; gap: 16px; margin-bottom: 4px; }
  .bounce {
    font-size: clamp(34px, 8vw, 54px);
    display: inline-block;
    animation: bounce 1.6s ease-in-out infinite;
  }
  .bounce:nth-child(2) { animation-delay: 0.15s; }
  .bounce:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-18px); }
  }
  h1 {
    color: #fff;
    font-size: clamp(24px, 5vw, 38px);
    font-weight: 900;
    max-width: 640px;
    margin: 10px 0 16px;
    line-height: 1.25;
  }
  p {
    color: rgba(255,255,255,0.92);
    font-size: clamp(15px, 2.4vw, 18px);
    max-width: 460px;
    line-height: 1.6;
    margin: 0 0 28px;
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.16);
    border: 1px solid rgba(255,255,255,0.35);
    color: #fff;
    font-weight: 600;
    font-size: 14px;
    padding: 10px 20px;
    border-radius: 999px;
  }
  .dots { display: inline-flex; gap: 4px; }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    animation: pulse 1.2s ease-in-out infinite;
  }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes pulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
    40% { opacity: 1; transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .bounce, .dot { animation: none; }
  }
</style>
</head>
<body>
  <header>
    <span class="logo-emoji">🎊</span>
    <span class="brand">Best<span class="soft">SoftPlay</span></span>
  </header>
  <main>
    <div class="bounce-row">
      <span class="bounce">🧸</span>
      <span class="bounce">🎪</span>
      <span class="bounce">✨</span>
    </div>
    <h1>We&rsquo;re making your soft play search even better! 🎪✨</h1>
    <p>We&rsquo;re giving every venue photo a glow-up so you always see the good stuff. Back very soon with an even better directory!</p>
    <div class="status-pill">
      <span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>
      Working on it
    </div>
  </main>
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
