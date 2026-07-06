import React from "react";

const accentMap = {
  indigo: {
    border: "border-indigo-950/60",
    orb1: "bg-indigo-500/5",
    orb2: "bg-indigo-600/10",
    iconBg: "bg-indigo-950/60 text-indigo-400 border border-indigo-900/40",
    label: "text-indigo-400",
    value: "text-white",
    trend: "text-indigo-350",
  },
  teal: {
    border: "border-teal-950/60",
    orb1: "bg-teal-500/5",
    orb2: "bg-teal-600/10",
    iconBg: "bg-teal-950/60 text-teal-400 border border-teal-900/40",
    label: "text-teal-400",
    value: "text-white",
    trend: "text-teal-350",
  },
  amber: {
    border: "border-amber-950/60",
    orb1: "bg-amber-500/5",
    orb2: "bg-amber-600/10",
    iconBg: "bg-amber-950/60 text-amber-400 border border-amber-900/40",
    label: "text-amber-400",
    value: "text-white",
    trend: "text-amber-350",
  },
  pink: {
    border: "border-pink-950/60",
    orb1: "bg-pink-500/5",
    orb2: "bg-pink-600/10",
    iconBg: "bg-pink-950/60 text-pink-400 border border-pink-900/40",
    label: "text-pink-400",
    value: "text-white",
    trend: "text-pink-350",
  },
};

export default function Card({ title, value, icon, accent = "indigo", trend, onClick }) {
  const c = accentMap[accent] || accentMap.indigo;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border ${c.border} bg-slate-900/50 p-5 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-700/80 ${onClick ? "cursor-pointer" : ""}`}
    >
      <span className={`absolute -top-5 -right-5 w-20 h-20 rounded-full ${c.orb1} animate-pulse`} aria-hidden="true" />
      <span className={`absolute -bottom-4 -left-4 w-14 h-14 rounded-full ${c.orb2} animate-pulse`} style={{ animationDelay: "0.5s" }} aria-hidden="true" />

      <div className="relative flex justify-between items-start">
        <div>
          <p className={`text-[10.5px] font-bold uppercase tracking-widest mb-2 ${c.label}`}>{title}</p>
          <p className={`text-3xl font-extrabold ${c.value}`}>{value}</p>
          {trend && <p className={`text-xs mt-1 ${c.trend}`}>{trend}</p>}
        </div>
        <div
          className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center text-base flex-shrink-0`}
          style={{ animation: "float 3s ease-in-out infinite" }}
        >
          {icon}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
