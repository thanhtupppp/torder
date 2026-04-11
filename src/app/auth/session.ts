import { DEFAULT_PERMISSIONS, type AppPermission } from "../permissions";

export type UserSession = {
  userId: string;
  displayName: string;
  role: "admin" | "manager" | "cashier";
  isAuthenticated: boolean;
  permissions: AppPermission[];
  _v?: number;
};

const SESSION_STORAGE_KEY = "posiorder.session";
// Bump this number whenever new permissions/modules are added
const SESSION_VERSION = 3;

const FALLBACK_SESSION: UserSession = {
  userId: "local-admin",
  displayName: "Local Admin",
  role: "admin",
  isAuthenticated: true,
  permissions: DEFAULT_PERMISSIONS,
  _v: SESSION_VERSION,
};

export function getCurrentSession(): UserSession {
  if (typeof window === "undefined") {
    return FALLBACK_SESSION;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(FALLBACK_SESSION),
    );
    return FALLBACK_SESSION;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserSession>;

    // If the stored session is from an older version, reset it so
    // newly added permissions are picked up automatically
    if (!parsed._v || parsed._v < SESSION_VERSION) {
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(FALLBACK_SESSION),
      );
      return FALLBACK_SESSION;
    }
    const role = parsed.role ?? FALLBACK_SESSION.role;
    
    return {
      userId: parsed.userId ?? FALLBACK_SESSION.userId,
      displayName: parsed.displayName ?? FALLBACK_SESSION.displayName,
      role,
      isAuthenticated: parsed.isAuthenticated ?? true,
      permissions:
        role === "admin"
          ? DEFAULT_PERMISSIONS
          : parsed.permissions && parsed.permissions.length > 0
            ? parsed.permissions
            : FALLBACK_SESSION.permissions,
    };
  } catch {
    return FALLBACK_SESSION;
  }
}

export function setCurrentSession(session: UserSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
