import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  HelpCircle,
  Settings,
  Menu,
  X,
  User,
  Flame,
} from "lucide-react";
import { api } from "../api";
import "./Header.css";

const navItems = [
  { id: "dashboard", label: "Dashboard", path: "/", icon: LayoutDashboard },
  { id: "path", label: "Path", path: "/path", icon: Clock },
  { id: "analytics", label: "Analytics", path: "/analytics", icon: BarChart3 },
  { id: "help", label: "Help", path: "/help", icon: HelpCircle },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
];

function ChartIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="8" width="4" height="32" rx="2" fill="#34d399" />
      <rect x="12" y="14" width="4" height="26" rx="2" fill="#34d399" />
      <rect x="20" y="6" width="4" height="34" rx="2" fill="#34d399" />
      <rect x="28" y="18" width="4" height="22" rx="2" fill="#34d399" />
      <rect x="36" y="10" width="4" height="30" rx="2" fill="#34d399" />
      <rect x="44" y="4" width="4" height="36" rx="2" fill="#34d399" />
      <rect x="52" y="12" width="4" height="28" rx="2" fill="#34d399" />
      <circle cx="6" cy="36" r="4" fill="#3b82f6" />
      <circle cx="14" cy="30" r="4" fill="#3b82f6" />
      <circle cx="22" cy="38" r="4" fill="#3b82f6" />
      <circle cx="30" cy="26" r="4" fill="#3b82f6" />
      <circle cx="38" cy="20" r="4" fill="#3b82f6" />
      <circle cx="46" cy="14" r="4" fill="#3b82f6" />
      <circle cx="54" cy="8" r="4" fill="#3b82f6" />
      <path
        d="M6 36L14 30L22 38L30 26L38 20L46 14L54 8"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    api
      .getLearnerState("learner_001")
      .then((s) => setStreak(s?.current_streak || 0))
      .catch(() => {});
  }, []);

  return (
    <header className="header">
      <div className="header-top">
        <NavLink to="/" className="logo">
          <div className="logo-icon">
            <ChartIcon size={22} />
          </div>
          <span className="logo-text">AdaptiveFlow</span>
        </NavLink>

        <div className="header-right">
          {streak > 0 && (
            <div className="streak-badge">
              <Flame size={13} />
              <span>{streak}</span>
            </div>
          )}

          <div className="user-info">
            <div className="avatar">
              <User size={14} />
            </div>
            <span className="user-name">Student</span>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <nav className={`nav ${mobileOpen ? "open" : ""}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `nav-btn ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}
