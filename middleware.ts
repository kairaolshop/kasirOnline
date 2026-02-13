// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // JIKA sudah login dan mencoba ke /login, lempar ke dashboard (/)
    if (pathname === "/login" && token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Izinkan akses jika ada token, ATAU jika halaman yang diakses adalah /login
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname === "/login") return true; 
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Pastikan /login masuk ke dalam matcher agar middleware bisa memprosesnya
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};