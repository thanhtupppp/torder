import {
  Bell,
  ChevronDown,
  Circle,
  LogOut,
  MessageSquareText,
  Moon,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { useDismissible } from "../../hooks/useDismissible"; // ✅ unified hook
import { Breadcrumbs } from "./Breadcrumbs";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserInfo = {
  name: string;
  role: string;
  avatarUrl: string;
};

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  user?: UserInfo;
};

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_USER: UserInfo = {
  name: "Thanh Nguyen",
  role: "Quản trị viên",
  avatarUrl: "https://i.pravatar.cc/80?img=12",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AppHeader({
  title,
  subtitle,
  breadcrumbs = [],
  user = DEFAULT_USER,
}: AppHeaderProps) {
  const [openProfile, setOpenProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  // ✅ useDismissible — nhất quán với CatalogToolbar
  useDismissible(openProfile, () => setOpenProfile(false), [profileRef]);

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1>{title}</h1>
        {/* ✅ && thay vì ? : null */}
        {subtitle && <p>{subtitle}</p>}
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="app-header-right">
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Thông báo"
          title="Thông báo"
        >
          <Bell size={16} />
          <span className="dot" />
        </button>
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Tin nhắn"
          title="Tin nhắn"
        >
          <MessageSquareText size={16} />
        </button>
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Trạng thái"
          title="Trạng thái"
        >
          <Circle size={14} fill="currentColor" />
        </button>
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Đổi giao diện"
          title="Đổi giao diện"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="profile-menu-wrap" ref={profileRef}>
          <button
            type="button"
            className="profile-btn"
            onClick={() => setOpenProfile((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={openProfile}
          >
            <img
              className="avatar-image"
              src={user.avatarUrl}
              alt={`Avatar của ${user.name}`}
              width={32}
              height={32}
            />
            <span className="profile-text">
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </span>
            <ChevronDown size={14} />
          </button>

          {/* ✅ && thay vì ? : null */}
          {openProfile && (
            <div className="profile-dropdown" role="menu">
              <button type="button" role="menuitem">
                <UserRound size={14} />
                <span>Thông tin tài khoản</span>
              </button>
              <button type="button" role="menuitem">
                <Settings size={14} />
                <span>Cài đặt cá nhân</span>
              </button>
              <button type="button" role="menuitem">
                <LogOut size={14} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
