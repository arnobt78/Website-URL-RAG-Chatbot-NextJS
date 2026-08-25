import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js proxy (formerly middleware): anonymous session cookie for chat history.
 * Injects x-session-id on the request so SSR can read it on the same first visit.
 */
export function proxy(req: NextRequest) {
  const cookie = req.cookies.get("sessionId");
  const sessionId = cookie?.value ?? crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-session-id", sessionId);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!cookie) {
    res.cookies.set("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|logo.svg|hero/).*)"],
};
