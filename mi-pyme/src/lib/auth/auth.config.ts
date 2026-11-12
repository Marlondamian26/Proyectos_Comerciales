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
import {
  REMEMBERED_SESSION_TTL_SECONDS,
  decodeSessionToken,
  encodeSessionToken,
  getSessionExpiresAt,
} from "@/lib/auth/session-token";

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
      fotoPerfilUrl?: string | null;
    };
  }

  interface JWT {
    id: string;
    rol?: Rol;
    mustChangePassword?: boolean;
    sessionVersion?: number;
    rememberMe?: boolean;
    sessionExpiresAt?: number;
    fotoPerfilUrl?: string | null;
  }
}

export { credentialsAuthorize } from "@/lib/auth/credentials-authorize";

export const authOptions: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
    newUser: "/auth/registro",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email o Usuario", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Recordarme", type: "checkbox" },
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
    maxAge: REMEMBERED_SESSION_TTL_SECONDS,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: REMEMBERED_SESSION_TTL_SECONDS,
    encode: encodeSessionToken,
    decode: decodeSessionToken,
  },
  events: {
    async signOut(message) {
      const userId = "token" in message
        ? message.token?.id
        : message.session?.userId;
      if (typeof userId === "string" && userId.length > 0) {
        await logAudit("LOGOUT", userId, userId, {});
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
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
      if (user) {
        token.sessionExpiresAt = getSessionExpiresAt(
          Boolean((user as { rememberMe?: boolean }).rememberMe)
        );
      } else if (typeof token.sessionExpiresAt !== "number") {
        const issuedAt = typeof token.iat === "number"
          ? token.iat
          : Math.floor(Date.now() / 1000);
        token.sessionExpiresAt = getSessionExpiresAt(
          Boolean(token.rememberMe),
          issuedAt
        );
      }
      if (user && "fotoPerfilUrl" in user) {
        token.fotoPerfilUrl = (user as { fotoPerfilUrl?: string | null }).fotoPerfilUrl ?? null;
      }

      if (
        typeof token.sessionExpiresAt !== "number" ||
        token.sessionExpiresAt <= Math.floor(Date.now() / 1000)
      ) {
        return null;
      }

      // En cada refresh del token (trigger === "update"), validar sessionVersion e isActive
      // contra la base de datos para invalidar sesiones en eventos críticos
      if (token.id && trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            sessionVersion: true,
            isActive: true,
            deletedAt: true,
            rol: true,
            fotoPerfilUrl: true,
            mustChangePassword: true,
          },
        });

        if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
          return null; // Invalidar sesión: usuario inactivo o eliminado
        }

        if (dbUser.sessionVersion !== token.sessionVersion) {
          return null; // Invalidar sesión: sessionVersion cambió (password, rol, suspensión)
        }

        // Sincronizar datos que pueden haber cambiado
        token.rol = dbUser.rol;
        token.mustChangePassword = dbUser.mustChangePassword;
        token.fotoPerfilUrl = dbUser.fotoPerfilUrl ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as Rol;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.rememberMe = Boolean(token.rememberMe);
        session.user.fotoPerfilUrl = token.fotoPerfilUrl as string | null | undefined;
      }

      const tokenSessionVersion = token.sessionVersion as number | undefined;
      if (tokenSessionVersion !== undefined) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              sessionVersion: true,
              isActive: true,
              deletedAt: true,
              fotoPerfilUrl: true,
            },
          });

          if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
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
          session.user.fotoPerfilUrl = dbUser.fotoPerfilUrl;
          session.user.image = dbUser.fotoPerfilUrl;
        } catch (error) {
          console.error("Error in session callback:", error);
          return null as unknown as Session;
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) return url;
      } catch {}
      return `${baseUrl}/auth/login`;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
