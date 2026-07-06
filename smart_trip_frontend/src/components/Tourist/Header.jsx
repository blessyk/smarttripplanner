import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaBell, FaBars, FaSearch, FaCheck, FaCheckDouble } from "react-icons/fa";
import api from "../Utils/api";

const Header = ({ setIsOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      if (response.data?.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const response = await api.put(`/notifications/${id}/read`);
      if (response.data?.success) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      const response = await api.put(`/notifications/read-all`);
      if (response.data?.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <FaBars className="text-sm" />
        </button>
        <div>
          <p className="text-slate-800 font-bold text-sm">Welcome back, {user?.name}</p>
          <p className="text-slate-400 text-xs hidden sm:block">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <FaSearch className="text-slate-400 text-xs" />
          <input
            type="text"
            placeholder="Search destinations..."
            className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-40"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <FaBell className="text-sm" />
          </button>
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 border border-white rounded-full text-[9px] text-white flex items-center justify-center font-bold px-1 animate-bounce">
              {unreadCount}
            </span>
          )}

          {showDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Dropdown Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  🔔 Notifications
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-650 hover:text-blue-755 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FaCheckDouble className="text-[9px]" /> Mark all read
                  </button>
                )}
              </div>

              {/* Dropdown Body */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No weather notifications yet.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id}
                      className={`p-3 flex gap-2.5 transition-colors hover:bg-slate-50 relative ${
                        !n.isRead ? "bg-blue-50/20" : ""
                      }`}
                    >
                      <div className="text-base flex-shrink-0 mt-0.5">
                        {n.type === 'weather' ? "⛅" : "ℹ️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-[11px] leading-tight">{n.title}</p>
                        <p className="text-slate-500 text-[10px] mt-1 leading-normal break-words">{n.message}</p>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          {new Date(n.createdAt).toLocaleDateString("en-IN")} · {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {!n.isRead && (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                          <button
                            onClick={(e) => handleMarkAsRead(n._id, e)}
                            className="p-1 hover:bg-blue-50 text-blue-500 rounded-md transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <FaCheck className="text-[8px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold animate-pulse"
          title={user?.name}
        >
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Header;
