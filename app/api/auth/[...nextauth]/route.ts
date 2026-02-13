import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
  // 1. Pastikan credentials ada dan tipenya string
  const username = credentials?.username as string;
  const password = credentials?.password as string;

  if (!username || !password) {
    return null;
  }

  // 2. Query ke Prisma menggunakan variabel yang sudah dipastikan string
  const user = await prisma.user.findUnique({
    where: { 
      username: username 
    },
  });

  if (!user) return null;

  // 3. Bandingkan password (sekarang variabel password sudah pasti string)
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) return null;

  return {
    id: user.id.toString(),
    name: user.username,
    role: user.role,
  };
},
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // Tambahkan role ke token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role; // Tambahkan role ke session
      }
      return session;
    },
  },

  pages: {
    signIn: "/app/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };