import type { JWT } from "next-auth/jwt";
import { decode } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "next-auth";
import { GUEST_EMAIL_DOMAIN_SUFFIX, GUEST_SESSION_HOURS } from "./config";

export const GUEST_PROVIDER = "guest";
const MAX_GUEST_AGE_MS = GUEST_SESSION_HOURS * 60 * 60 * 1000;

export type GuestKind = "student" | "recruiter";

export type GuestIdentity = {
  id: string;
  collegeId: string;
  email: string;
  name: string;
  expiresAt: number;
};

export interface GuestDirectory {
  /** Creates a fresh, isolated workspace and returns the identity for `kind`. */
  provision(kind: GuestKind): Promise<GuestIdentity | null>;
  /** Returns the other identity of an existing, unexpired workspace. */
  switchTo(kind: GuestKind, current: { id: string; collegeId: string }): Promise<GuestIdentity | null>;
}

const roleOf = (kind: GuestKind) => (kind === "recruiter" ? "faculty" : "student") as "faculty" | "student";

function validIdentity(identity: GuestIdentity | null, now = Date.now()): identity is GuestIdentity {
  return !!identity?.id && !!identity.collegeId && !!identity.name &&
    identity.email.endsWith(GUEST_EMAIL_DOMAIN_SUFFIX) &&
    Number.isFinite(identity.expiresAt) && identity.expiresAt > now &&
    identity.expiresAt <= now + MAX_GUEST_AGE_MS;
}

async function readCurrentGuest(cookieHeader: string | undefined): Promise<JWT | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!cookieHeader || !secret) return null;
  const cookies = Object.fromEntries(cookieHeader.split(";").map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
  const raw = cookies["__Secure-next-auth.session-token"] ?? cookies["next-auth.session-token"];
  if (!raw) return null;
  try {
    const token = await decode({ token: raw, secret });
    return token?.isGuest && isLiveGuestToken(token) ? token : null;
  } catch {
    return null;
  }
}

export function isLiveGuestToken(token: Partial<JWT>, now = Date.now()): boolean {
  return token.isGuest === true && !!token.id && !!token.collegeId &&
    (token.role === "student" || token.role === "faculty") &&
    typeof token.guestExpiresAt === "number" && token.guestExpiresAt > now;
}

/** Anonymous guest sign-in. Each fresh sign-in provisions a new isolated workspace. */
export function guestCredentialsProvider(directory: GuestDirectory) {
  return CredentialsProvider({
    id: GUEST_PROVIDER,
    name: "Guest access",
    credentials: {
      kind: { label: "Guest type", type: "text" },
      switch: { label: "Switch role in current workspace", type: "text" },
    },
    async authorize(credentials, req) {
      const kind = credentials?.kind;
      if (kind !== "student" && kind !== "recruiter") return null;

      let identity: GuestIdentity | null;
      if (credentials?.switch === "true") {
        const headers = req?.headers as Record<string, string | undefined> | undefined;
        const current = await readCurrentGuest(headers?.cookie);
        if (!current) return null;
        identity = await directory.switchTo(kind, { id: current.id, collegeId: current.collegeId });
      } else {
        identity = await directory.provision(kind);
      }
      if (!validIdentity(identity)) return null;

      return {
        id: identity.id,
        email: identity.email,
        name: identity.name,
        role: roleOf(kind),
        collegeId: identity.collegeId,
        isGuest: true,
        guestExpiresAt: identity.expiresAt,
      } satisfies User;
    },
  });
}

/** Copies guest claims onto the JWT on sign-in; rejects the token once expired. */
export function applyGuestJwt(token: JWT, user: User | undefined): JWT | null {
  if (user?.isGuest) {
    token.id = user.id;
    token.role = user.role as "student" | "faculty";
    token.collegeId = user.collegeId!;
    token.name = user.name;
    token.email = user.email;
    token.isGuest = true;
    token.guestExpiresAt = user.guestExpiresAt;
  }
  if (!token.isGuest) return token;
  return isLiveGuestToken(token) ? token : null;
}
