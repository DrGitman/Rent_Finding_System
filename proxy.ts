import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/auth", "/auth/signup", "/auth/reset-password", "/terms", "/onboarding"]

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let static assets and public pages through
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get("rs_token")

  if (!token) {
    const loginUrl = new URL("/auth", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
