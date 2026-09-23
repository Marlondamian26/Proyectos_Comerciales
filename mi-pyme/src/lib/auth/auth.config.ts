import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  credentialsAuthorize,
  type AuthorizeCredentials,
} from "@/lib/auth/credentials-authorize";
import { Rol } from "@/lib/auth/roles";
import { logAudit } from "@/services/utils/audit";
import prisma from "@/lib/db/prisma";
import type { NextAuthConfig, Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      rol?: Rol;
      mustChangePassword?: boolean;
      rememberMe?: boolean;
    };
  }

  interface JWT {
    id: string;
    rol?: Rol;
    mustChangePassword?: boolean;
    sessionVersion?: number;
    rememberMe?: boolean;
  }
}

export { credentialsAuthorize } from "@/lib/auth/credentials-authorize";

const THIRTY_DAYS = 30 * 24 * 60 * 60;
const TWENTY_FOUR_HOURS = 24 * 60 * 60;

export const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email o Usuario", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return credentialsAuthorize(
          credentials as AuthorizeCredentials | undefined
        );
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: THIRTY_DAYS,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: THIRTY_DAYS,
  },
  events: {
    async signOut(message) {
      const s = message as { session?: { user?: { id?: string } } };
      const userId = s?.session?.user?.id;
      if (userId) {
        await logAudit("LOGOUT", userId, userId, {});
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id as string;
      }
      if (user && (user as { rol?: Rol }).rol) {
        token.rol = (user as { rol?: Rol }).rol;
      }
      if (user && "mustChangePassword" in user) {
        token.mustChangePassword = Boolean(
          (user as { mustChangePassword?: boolean }).mustChangePassword
        );
      }
      if (user && "sessionVersion" in user) {
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion;
      }
      if (user && "rememberMe" in user) {
        token.rememberMe = Boolean(
          (user as { rememberMe?: boolean }).rememberMe
        );
      }

      if (user && !token.rememberMe) {
        token.exp = Math.floor(Date.now() / 1000) + TWENTY_FOUR_HOURS;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as Rol;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.rememberMe = Boolean(token.rememberMe);
      }

      const tokenSessionVersion = token.sessionVersion as number | undefined;
      if (tokenSessionVersion !== undefined) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true, isActive: true },
        });

        if (!dbUser || !dbUser.isActive) {
          return null as unknown as Session;
        }

        if (dbUser.sessionVersion !== tokenSessionVersion) {
          await logAudit("SESSION_INVALIDATED", token.id as string, token.id as string, {
            reason: "sessionVersion_mismatch",
            tokenVersion: tokenSessionVersion,
            dbVersion: dbUser.sessionVersion,
          });
          return null as unknown as Session;
        }
      }

      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
