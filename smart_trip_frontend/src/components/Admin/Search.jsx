import { FaSearch } from "react-icons/fa";

export default function Search({ searchTerm, setSearchTerm, placeholder = "Search..." }) {
  return (
    <div className="relative mb-4 w-full">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
        <FaSearch />
      </span>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition"
      />
    </div>
  );
}
