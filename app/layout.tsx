import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./component/provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KasirOnline",
  description: "Aplikasi kasir sederhana",
viewport: {
    width: "1024",    
    initialScale: 1.0,
    maximumScale: 1.0,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-[#c9d7ff] min-h-screen`}>
        <Providers>
        <header className="bg-white shadow p-4">
          <h1 className="text-2xl font-bold text-center">KasirOnline</h1>
        </header>
        <main className="container mx-auto p-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}