import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import api from "../Utils/api";
import {
  FaThLarge, FaSearch, FaCalendarAlt,
  FaStar, FaUser, FaSignOutAlt, FaSuitcase, FaCamera
} from "react-icons/fa";

const menuItems = [
  { name: "Dashboard",          path: "/Tourist/touristhome",      icon: <FaThLarge />, color: "bg-indigo-50 text-indigo-500 border border-indigo-100/50" },
  { name: "Destination Search", path: "/Tourist/DestinationSearch", icon: <FaSearch />, color: "bg-cyan-50 text-cyan-500 border border-cyan-100/50" },
  { name: "Trip Planner",       path: "/Tourist/TripPlanner",       icon: <FaCalendarAlt />, color: "bg-emerald-50 text-emerald-500 border border-emerald-100/50" },
  { name: "Image Prediction",   path: "/Tourist/image-prediction",   icon: <FaCamera />, color: "bg-pink-50 text-pink-500 border border-pink-100/50" },
  { name: "My Trips",           path: "/Tourist/my-trips",          icon: <FaSuitcase />, color: "bg-amber-50 text-amber-500 border border-amber-100/50" },
  { name: "Reviews",            path: "/Tourist/reviews",           icon: <FaStar />, color: "bg-purple-50 text-purple-500 border border-purple-100/50" },
  { name: "Profile",            path: "/Tourist/profile",           icon: <FaUser />, color: "bg-rose-50 text-rose-500 border border-rose-100/50" },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const [logoUrl, setLogoUrl] = useState("/logo.png");

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await api.get("/auth/portal-logo");
        if (response.data?.success) {
          setLogoUrl(response.data.data);
        }
      } catch (err) {
        console.error("Failed to load portal logo:", err);
      }
    };
    fetchLogo();
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-56 bg-white border-r border-slate-200
          flex flex-col transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-150/60 flex items-center gap-3">
          {logoUrl && logoUrl !== "/logo.png" ? (
            <img src={logoUrl} alt="Portal Logo" className="w-9 h-9 object-contain rounded-xl flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-slate-800 font-extrabold text-sm leading-tight">TripPlanner</p>
            <p className="text-slate-400 text-xs font-semibold">Tourist Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold px-3 pb-2.5">
            Menu
          </p>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-600 border border-blue-200/60 font-bold"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent"
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
        <div className="px-3 pb-4 border-t border-slate-200 pt-3">
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm hover:bg-red-100 transition-colors"
          >
            <FaSignOutAlt className="text-sm" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
