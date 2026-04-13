import { DEFAULT_PERMISSIONS, type AppPermission } from "../permissions";

export type UserSession = {
  userId: string;
  displayName: string;
  role: "admin" | "manager" | "cashier";
  isAuthenticated: boolean;
  permissions: AppPermission[];
};

type StoredSession = UserSession & { _v: number };

const SESSION_STORAGE_KEY = "posiorder.session";
const SESSION_VERSION = 4;

const FALLBACK_SESSION: UserSession = {
  userId: "",
  displayName: "",
  role: "cashier",
  isAuthenticated: false,
  permissions: [],
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function writeSession(session: UserSession): void {
  const stored: StoredSession = { ...session, _v: SESSION_VERSION };
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
}

function resolvePermissions(
  role: UserSession["role"],
  parsed: Partial<StoredSession>,
): AppPermission[] {
  if (role === "admin") return DEFAULT_PERMISSIONS;
  if (parsed.permissions && parsed.permissions.length > 0)
    return parsed.permissions;
  return [];
}

export function getCurrentSession(): UserSession {
  if (!isBrowser()) return FALLBACK_SESSION;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    writeSession(FALLBACK_SESSION);
    return FALLBACK_SESSION;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;

    if (!parsed._v || parsed._v < SESSION_VERSION) {
      writeSession(FALLBACK_SESSION);
      return FALLBACK_SESSION;
    }

    const role = parsed.role ?? FALLBACK_SESSION.role;

    return {
      userId: parsed.userId ?? FALLBACK_SESSION.userId,
      displayName: parsed.displayName ?? FALLBACK_SESSION.displayName,
      role,
      isAuthenticated: parsed.isAuthenticated ?? false,
      permissions: resolvePermissions(role, parsed),
    };
  } catch {
    return FALLBACK_SESSION;
  }
}

export function setCurrentSession(session: UserSession): void {
  if (!isBrowser()) return;
  writeSession(session);
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
