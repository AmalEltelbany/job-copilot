import { NextResponse, type NextRequest } from "next/server";

/** Cheap gate: no session cookie means no point rendering the app. The API still verifies the token on every call. */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("copilot_session")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
