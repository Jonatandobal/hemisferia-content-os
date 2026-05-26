// Basic Auth proxy para Next.js 16+.
// Protege todo el dashboard con basic auth via ADMIN_PASSWORD.
// /api/cron/* y /api/public/* se autentican con sus propios secretos.

import { NextRequest, NextResponse } from "next/server"

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rutas que se autentican con sus propios secretos: dejan pasar.
  if (
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const basicAuth = req.headers.get("authorization")
  const expected = process.env.ADMIN_PASSWORD

  // Si no hay password configurada, dejamos pasar (modo dev sin auth).
  if (!expected) return NextResponse.next()

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1]
    if (authValue) {
      const [, password] = atob(authValue).split(":")
      if (password === expected) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Hemisferia Content OS"',
    },
  })
}
