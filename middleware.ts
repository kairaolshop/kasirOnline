// middleware.ts (root project)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Menggunakan type casting 'any' secara eksplisit pada req untuk menghindari error tipe
    const token = (req as any).nextauth?.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return null;
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Memberikan tipe data 'any' pada token agar tidak error 'implicitly has any type'
      authorized: ({ token }: { token: any }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Lindungi semua halaman kecuali:
     * - API route auth (/api/auth)
     * - file static (_next/static, _next/image, favicon.ico)
     * - halaman login
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};