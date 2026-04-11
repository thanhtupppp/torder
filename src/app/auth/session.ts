import { DEFAULT_PERMISSIONS, type AppPermission } from "../permissions";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserSession = {
  userId: string;
  displayName: string;
  role: "admin" | "manager" | "cashier";
  isAuthenticated: boolean;
  permissions: AppPermission[];
};

// Internal — chỉ dùng trong session storage, không expose ra ngoài
type StoredSession = UserSession & { _v: number };

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_STORAGE_KEY = "posiorder.session";
// Bump this number whenever new permissions/modules are added
const SESSION_VERSION = 3;

const FALLBACK_SESSION: UserSession = {
  userId: "local-admin",
  displayName: "Local Admin",
  role: "admin",
  isAuthenticated: true,
  permissions: DEFAULT_PERMISSIONS,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ✅ Luôn inject _v khi write — không để caller quản lý
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
  return FALLBACK_SESSION.permissions;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getCurrentSession(): UserSession {
  if (!isBrowser()) return FALLBACK_SESSION;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    writeSession(FALLBACK_SESSION);
    return FALLBACK_SESSION;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;

    // Outdated version → reset để pick up newly added permissions
    if (!parsed._v || parsed._v < SESSION_VERSION) {
      writeSession(FALLBACK_SESSION);
      return FALLBACK_SESSION;
    }

    const role = parsed.role ?? FALLBACK_SESSION.role;

    // ✅ _v không cần thiết trong return type — caller không cần biết
    return {
      userId: parsed.userId ?? FALLBACK_SESSION.userId,
      displayName: parsed.displayName ?? FALLBACK_SESSION.displayName,
      role,
      isAuthenticated: parsed.isAuthenticated ?? true,
      permissions: resolvePermissions(role, parsed),
    };
  } catch {
    return FALLBACK_SESSION;
  }
}

export function setCurrentSession(session: UserSession): void {
  if (!isBrowser()) return;
  writeSession(session); // ✅ _v luôn được inject đúng version
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
