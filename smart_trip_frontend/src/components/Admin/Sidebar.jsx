import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import api from "../Utils/api";
import { 
  FaHome, FaUsers, FaStar, FaEnvelope, FaKey, 
  FaSuitcase, FaTerminal, FaSignOutAlt, FaCommentDots, FaCog
} from "react-icons/fa";

const menuItems = [
  { name: "Admin Home",            path: "/Admin/adminhome",       icon: <FaHome />, color: "bg-orange-950/40 text-orange-400 border border-orange-900/40" },
  { name: "View Users",            path: "/Admin/users",           icon: <FaUsers />, color: "bg-teal-950/40 text-teal-400 border border-teal-900/40" },
  { name: "View Trips",            path: "/Admin/trips",           icon: <FaSuitcase />, color: "bg-violet-950/40 text-violet-400 border border-violet-900/40" },
  { name: "View Reviews",          path: "/Admin/reviews",         icon: <FaCommentDots />, color: "bg-purple-950/40 text-purple-400 border border-purple-900/40" },
  { name: "AI Call Logs",          path: "/Admin/ai-logs",         icon: <FaTerminal />, color: "bg-slate-955/40 text-slate-400 border border-slate-800" },
  { name: "View Testimonials",     path: "/Admin/testimonials",    icon: <FaStar />, color: "bg-amber-950/40 text-amber-400 border border-amber-900/40" },
  { name: "View Contact Messages", path: "/Admin/contact",         icon: <FaEnvelope />, color: "bg-blue-950/40 text-blue-400 border border-blue-900/40" },
  { name: "Change Password",       path: "/Admin/change-password", icon: <FaKey />, color: "bg-pink-950/40 text-pink-400 border border-pink-900/40" },
  { name: "Settings",              path: "/Admin/settings",        icon: <FaCog />, color: "bg-slate-955/40 text-slate-400 border border-slate-800" },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const dispatch = useDispatch();
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [showAiLogs, setShowAiLogs] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [logoRes, showLogsRes] = await Promise.all([
          api.get("/auth/portal-logo").catch(() => null),
          api.get("/admin/settings/show-ai-logs").catch(() => null)
        ]);

        if (logoRes?.data?.success) {
          setLogoUrl(logoRes.data.data);
        }
        if (showLogsRes?.data?.success && showLogsRes.data.data) {
          setShowAiLogs(showLogsRes.data.data.value === "true");
        }
      } catch (err) {
        console.error("Failed to load sidebar settings:", err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-56 bg-slate-900 border-r border-slate-800
          flex flex-col transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo & Admin Status */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          {logoUrl && logoUrl !== "/logo.png" ? (
            <img src={logoUrl} alt="Portal Logo" className="w-9 h-9 object-contain rounded-xl flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 shadow-md shadow-rose-950/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-slate-100 font-extrabold text-sm leading-tight">TripPlanner</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-slate-400 text-xs font-semibold">Admin Panel</p>
              <span className="px-1.5 py-0.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/60 text-[8px] font-extrabold uppercase tracking-wide">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold px-3 pb-2.5">
            Administration
          </p>
          {menuItems.filter((item) => item.name !== "AI Call Logs" || showAiLogs).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-rose-950/40 to-orange-950/20 text-rose-450 border border-rose-800/60 font-bold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent"
                }`
              }
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${item.color} shadow-xs`}>
                {item.icon}
              </div>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-3">
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm hover:bg-rose-900/60 hover:text-rose-200 transition-colors"
          >
            <FaSignOutAlt className="text-sm" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
