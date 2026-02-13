// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = (req as any).nextauth?.token;
    const isAuth = !!token;
    
    // PERBAIKAN: Hapus "/app" dari path
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
      authorized: ({ token }: { token: any }) => !!token,
    },
    pages: {
      // PERBAIKAN: Gunakan path URL asli
      signIn: "/login", 
    },
  }
);

export const config = {
  matcher: [
    // Melindungi semua kecuali login dan file statis
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};