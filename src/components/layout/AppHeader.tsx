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
import { useEffect, useRef, useState } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    to?: string;
  }>;
};

export function AppHeader({
  title,
  subtitle,
  breadcrumbs = [],
}: AppHeaderProps) {
  const [openProfile, setOpenProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!profileRef.current) return;
      if (profileRef.current.contains(event.target as Node)) return;
      setOpenProfile(false);
    }

    if (openProfile) {
      window.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openProfile]);

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="app-header-right">
        <button type="button" className="header-icon-btn" title="Thông báo">
          <Bell size={16} />
          <span className="dot" />
        </button>
        <button type="button" className="header-icon-btn" title="Tin nhắn">
          <MessageSquareText size={16} />
        </button>
        <button type="button" className="header-icon-btn" title="Trạng thái">
          <Circle size={14} fill="currentColor" />
        </button>
        <button
          type="button"
          className="header-icon-btn"
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
          >
            <img
              className="avatar-image"
              src="https://i.pravatar.cc/80?img=12"
              alt="User avatar"
            />
            <span className="profile-text">
              <strong>Thanh Nguyen</strong>
              <small>Quản trị viên</small>
            </span>
            <ChevronDown size={14} />
          </button>

          {openProfile ? (
            <div className="profile-dropdown">
              <button type="button">
                <UserRound size={14} />
                <span>Thông tin tài khoản</span>
              </button>
              <button type="button">
                <Settings size={14} />
                <span>Cài đặt cá nhân</span>
              </button>
              <button type="button">
                <LogOut size={14} />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
