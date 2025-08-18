/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/mongoose";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

/**
 * Local custom types for this file
 */
interface CustomUser {
  id: string;
  email: string;
  role: "admin" | "coordinator" | "faculty" | "student";
  batch?: string; // optional for students
}

interface CustomSession extends Session {
  user: {
    id: string;
    email: string;
    role: "admin" | "coordinator" | "faculty" | "student";
    name?: string | null;
    image?: string | null;
    batch?: string; // optional
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectDB();

          const userDoc: any = await User.findOne({
            email: credentials.email,
          });

          if (!userDoc) return null;

          const isMatch = await bcrypt.compare(credentials.password, userDoc.password);
          if (!isMatch) return null;

          const id = userDoc._id?.toString?.() ?? "";

          const returnedUser: CustomUser = {
            id,
            email: userDoc.email,
            role: userDoc.role,
            batch: userDoc.batch, // include batch if available
          };

          return returnedUser;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // JWT callback: store id, role, email, batch
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const u = user as CustomUser;
        (token as any).id = u.id;
        (token as any).role = u.role;
        (token as any).email = u.email;
        (token as any).batch = u.batch; // optional batch
      }
      return token;
    },

    // Session callback: build session.user
    async session({ session, token }): Promise<CustomSession> {
      const s = session as CustomSession;
      s.user = {
        id: (token as any).id ?? "",
        email: (token as any).email ?? "",
        role: (token as any).role ?? "student",
        name: session.user?.name ?? null,
        image: session.user?.image ?? null,
        batch: (token as any).batch ?? undefined,
      };
      return s;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
