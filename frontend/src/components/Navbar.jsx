import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const desktopLinkClass = ({ isActive }) =>
  `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
    isActive ? "bg-brand-yellow text-brand-ink" : "text-brand-ink/60 hover:bg-brand-cream"
  }`;

const tabItems = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/transactions/new", icon: "➕", label: "เพิ่มรายการ" },
  { to: "/history", icon: "📜", label: "ประวัติ" },
  { to: "/family", icon: "👪", label: "ครอบครัว" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {/* Top bar: full nav on desktop, compact header on mobile */}
      <nav className="bg-white border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-semibold text-brand-ink mr-4 truncate">🏠 Family WP</span>
            <div className="hidden sm:flex items-center gap-1">
              {tabItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-brand-ink/50 hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-brand-orange hover:text-brand-yellow-dark whitespace-nowrap"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom tab bar: mobile only, floating rounded pill */}
      <nav className="sm:hidden fixed bottom-4 inset-x-4 z-10">
        <div className="bg-white rounded-full shadow-lg border border-black/5 flex items-center justify-around px-2 py-2">
          {tabItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive ? "bg-brand-yellow text-brand-ink" : "text-brand-ink/50"
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
