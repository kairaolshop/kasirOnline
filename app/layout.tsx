import type { Metadata } from "next";
import { Cal_Sans, Inter } from "next/font/google";
import { Providers } from "./component/provider";
import "./globals.css";
import { Toaster } from "sonner";

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
      <body className={`${inter.className} bg-[#c9d7ff] min-h-screen text-gray-900`}>
        <Providers>          
          <Toaster 
            position="top-center" 
            richColors 
            duration={3000} 
            closeButton 
          />
          
          <header className="bg-white shadow p-4 sticky top-0 z-40">
            <h1 className="text-2xl font-bold text-center text-blue-700">KasirOnline</h1>
          </header>

          <main className="container mx-auto p-4">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}