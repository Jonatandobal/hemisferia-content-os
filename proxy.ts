// Basic Auth proxy para Next.js 16+.
// Protege todo el dashboard con basic auth via ADMIN_PASSWORD.
// /api/cron/* y /api/public/* se autentican con sus propios secretos.

import { NextRequest, NextResponse } from "next/server"

// Comparación en tiempo constante: no corta en el primer caracter distinto,
// así el tiempo de respuesta no filtra cuántos caracteres acertaste.
function safeEqual(a: string, b: string) {
  const encoder = new TextEncoder()
  const x = encoder.encode(a)
  const y = encoder.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  }
  return diff === 0
}

// Extrae la password de un header "Basic base64(user:password)".
// La password puede contener ":", por eso cortamos solo en el primero.
function readPassword(header: string | null): string | null {
  if (!header?.startsWith("Basic ")) return null
  try {
    const decoded = atob(header.slice("Basic ".length).trim())
    const sep = decoded.indexOf(":")
    return sep === -1 ? null : decoded.slice(sep + 1)
  } catch {
    return null
  }
}

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

  const expected = process.env.ADMIN_PASSWORD

  if (!expected) {
    // Sin password solo dejamos pasar en `next dev`. En cualquier deploy
    // (production o preview) fallamos cerrado: la app usa service_role.
    if (process.env.NODE_ENV === "development") return NextResponse.next()
    return new NextResponse("ADMIN_PASSWORD no configurada", { status: 503 })
  }

  const password = readPassword(req.headers.get("authorization"))
  if (password !== null && safeEqual(password, expected)) {
    return NextResponse.next()
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Hemisferia Content OS"',
    },
  })
}
