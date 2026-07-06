import { FaTimes } from "react-icons/fa";

export default function DetailModal({ isOpen, onClose, title, data }) {
  if (!isOpen || !data) return null;

  const formatKey = (key) => {
    if (key === "aadharNumber") return "Aadhar Number";
    if (key === "createdAt") return "Created At";
    if (key === "updatedAt") return "Last Updated";
    if (key === "_id") return "Database ID";
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const renderValue = (key, value) => {
    if (value === null || value === undefined) return <span className="text-slate-600">N/A</span>;

    if (key === "images" && Array.isArray(value)) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {value.map((url, i) => (
            <div key={i} className="aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <img
                src={url}
                alt={`Preview ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={() => window.open(url, "_blank")}
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"; }}
              />
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return <span className="text-slate-300">{value.join(", ")}</span>;
    }

    if (typeof value === "object") {
      return <pre className="text-slate-300 font-mono text-xs bg-slate-950 rounded-lg p-2 overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
    }

    if (key === "price" && typeof value === "number") {
      return <span className="font-bold text-rose-400">₹{value.toLocaleString("en-IN")}</span>;
    }

    if (typeof value === "boolean") {
      return (
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${value ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60" : "bg-red-950/60 text-red-400 border border-red-800/60"}`}>
          {value ? "Yes" : "No"}
        </span>
      );
    }

    return <span className="text-slate-200 whitespace-pre-wrap">{value.toString()}</span>;
  };

  const isIgnoredKey = (key) => ["__v", "password", "passwordConfirm"].includes(key);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-100">{title || "Details"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {Object.entries(data)
            .filter(([key]) => !isIgnoredKey(key))
            .map(([key, value]) => (
              <div key={key} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{formatKey(key)}</p>
                <div className="text-xs font-medium">{renderValue(key, value)}</div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/40 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
