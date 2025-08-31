import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { userPrisma } from "@/lib/db"
import { compare } from "bcryptjs"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

// Define a custom user type interface
interface CustomUser {
  name: string | null;
  phone: string;
  email: string;
  id: string;
  loginToken?: string;
  loginRecordId?: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const identifier = credentials?.identifier;
        const password = credentials?.password as string;

        if (!identifier || !password) {
          throw new Error("Please provide both email & password");
        }

        // Use Prisma to find the user
        const user = await userPrisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { phone: identifier }
            ]
          }
        }) as { id: string; name: string | null; email: string; phone: string; password: string | null } | null;

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.password) {
          throw new Error("Password not set for this account");
        }

        const isMatched = await compare(password, String(user.password));
        if (!isMatched) {
          throw new Error("Password did not match");
        }

        console.log("loginToken", (credentials as Record<string, unknown>)?.loginToken);
        console.log("loginRecordId", (credentials as Record<string, unknown>)?.loginRecordId);

        // Return user data for session
        const userResponse: CustomUser = {
          name: user.name ?? null,
          phone: user.phone,
          email: user.email,
          id: user.id,
          loginToken: (credentials as Record<string, unknown>)?.loginToken as string | undefined,
          loginRecordId: (credentials as Record<string, unknown>)?.loginRecordId as string | undefined,
        };

        return userResponse;
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, token }: { session: Session, token: JWT }) {
      if (token?.sub) {
        session.user = session.user || {};
        // assign id and phone on the session user
        (session.user as Record<string, unknown>).id = token.sub;
        if ((token as Record<string, unknown>).phone) {
          (session.user as Record<string, unknown>).phone = (token as Record<string, unknown>).phone as string;
        }
        if ((token as Record<string, unknown>).loginToken) {
          (session.user as Record<string, unknown>).loginToken = (token as Record<string, unknown>).loginToken as string;
        }
        if ((token as Record<string, unknown>).loginRecordId) {
          (session.user as Record<string, unknown>).loginRecordId = (token as Record<string, unknown>).loginRecordId as string;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        (token as Record<string, unknown>).phone = customUser.phone;
        if (customUser.loginToken) {
          (token as Record<string, unknown>).loginToken = customUser.loginToken;
        }
        if (customUser.loginRecordId) {
          (token as Record<string, unknown>).loginRecordId = customUser.loginRecordId;
        }
      }
      return token;
    },
  },
  events: {
    // NextAuth triggers signOut events where we can update the login record's loggedOutAt.
    async signOut(message: { token?: JWT | null; session?: unknown }) {
      try {
        const loginRecordId = (message?.token as Record<string, unknown>)?.loginRecordId ?? 
                             ((message?.session as Record<string, unknown>)?.user as Record<string, unknown>)?.loginRecordId;
        if (loginRecordId) {
          await userPrisma.loginRecord.update({
            where: { id: loginRecordId as string },
            data: { loggedOutAt: new Date() },
          });
        }
      } catch (e) {
        // swallow errors; don't block signout flow
        console.error("Failed to update login record on signOut:", e);
      }
    },
  },
})