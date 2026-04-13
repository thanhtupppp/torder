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
import type { LicenseStatus } from "../../shared/types";
import { useDismissible } from "../../hooks/useDismissible";
import { Breadcrumbs } from "./Breadcrumbs";

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
  licenseStatus?: LicenseStatus | null;
};

const DEFAULT_USER: UserInfo = {
  name: "Thanh Nguyen",
  role: "Quản trị viên",
  avatarUrl: "https://i.pravatar.cc/80?img=12",
};

function getBadgeMeta(licenseStatus?: LicenseStatus | null) {
  if (!licenseStatus) {
    return { label: "Giấy phép: Đang kiểm tra", bg: "#64748b" };
  }

  if (licenseStatus.active && licenseStatus.reason === "OFFLINE_GRACE") {
    const remaining = licenseStatus.graceRemainingDays ?? 0;
    return {
      label: `Gia hạn offline: còn ${remaining} ngày`,
      bg: "#b45309",
    };
  }

  if (licenseStatus.active) {
    return { label: "Giấy phép: Đã kích hoạt", bg: "#166534" };
  }

  return { label: "Giấy phép: Chưa kích hoạt", bg: "#b91c1c" };
}

export function AppHeader({
  title,
  subtitle,
  breadcrumbs = [],
  user = DEFAULT_USER,
  licenseStatus,
}: AppHeaderProps) {
  const [openProfile, setOpenProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useDismissible(openProfile, () => setOpenProfile(false), [profileRef]);

  const badge = getBadgeMeta(licenseStatus);

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="app-header-right">
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "white",
            background: badge.bg,
            borderRadius: 999,
            padding: "6px 10px",
            marginRight: 8,
          }}
          title={licenseStatus?.reason ?? "checking"}
        >
          {badge.label}
        </span>

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
