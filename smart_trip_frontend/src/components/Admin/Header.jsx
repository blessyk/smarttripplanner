import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBars, FaSearch } from "react-icons/fa";

const panels = [
  { name: "Admin Home",            path: "/Admin/adminhome" },
  { name: "View Users",            path: "/Admin/users" },
  { name: "View Trips",            path: "/Admin/trips" },
  { name: "View Reviews",          path: "/Admin/reviews" },
  { name: "AI Call Logs",          path: "/Admin/ai-logs" },
  { name: "View Testimonials",     path: "/Admin/testimonials" },
  { name: "View Contact Messages", path: "/Admin/contact" },
  { name: "Change Password",       path: "/Admin/change-password" },
  { name: "Settings",              path: "/Admin/settings" }
];

export default function Header({ setIsOpen }) {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredPanels = searchQuery.trim() === ""
    ? []
    : panels.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredPanels.length > 0) {
      navigate(filteredPanels[0].path);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const handleSelect = (path) => {
    navigate(path);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-350 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <FaBars className="text-sm" />
        </button>
        <div>
          <p className="text-slate-100 font-bold text-sm">Welcome back, {user?.name || "Administrator"}</p>
          <p className="text-slate-450 text-xs hidden sm:block">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        <div className="relative hidden sm:flex items-center gap-2 bg-slate-955 border border-slate-800 rounded-xl px-3 py-1.5">
          <FaSearch className="text-slate-500 text-xs" />
          <input
            type="text"
            placeholder="Search panels..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none w-40"
          />
          {showSuggestions && filteredPanels.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
              {filteredPanels.map((p, i) => (
                <button
                  key={i}
                  onMouseDown={() => handleSelect(p.path)}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors block border-b border-slate-800/40 last:border-0"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm animate-pulse"
          title="Administrator Account"
        >
          AD
        </div>
      </div>
    </header>
  );
}