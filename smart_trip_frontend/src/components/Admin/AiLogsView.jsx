import React, { useState, useEffect } from "react";
import { FaSearch, FaEye, FaSpinner, FaExchangeAlt, FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

export default function AiLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [endpointFilter, setEndpointFilter] = useState("All");
  
  // Modal details state
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalTab, setModalTab] = useState("request"); // 'request' | 'response' | 'error'

  const fetchLogs = async () => {
    try {
      const response = await api.get("/admin/ai-logs");
      if (response.data?.success) {
        setLogs(response.data.data.logs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load AI logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const userName = log.userId?.name || "";
    const userEmail = log.userId?.email || "";
    const destination = log.requestPayload?.destination || "";
    const endpoint = log.endpoint || "";

    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || log.status === statusFilter;
    const matchesEndpoint = endpointFilter === "All" || log.endpoint === endpointFilter;

    return matchesSearch && matchesStatus && matchesEndpoint;
  });

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-indigo-650" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">AI Call Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor call statuses, verify JSON payloads, and audit user requests.</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-slate-300 font-semibold"
            >
              <option value="All">All Endpoints</option>
              <option value="generate-trip">generate-trip</option>
              <option value="chat">chat</option>
              <option value="explore-destination">explore-destination</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-slate-300 font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failure">Failure</option>
            </select>
          </div>
          <div className="relative w-full md:w-72">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none"><FaSearch /></span>
            <input
              type="text"
              placeholder="Search user, destination, endpoint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40 bg-slate-950 text-slate-200 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold uppercase">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">No logs found matching the filters.</td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const logTime = new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    });
                    return (
                      <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-500">{logTime}</td>
                        <td className="px-4 py-3">
                          {log.userId ? (
                            <div>
                              <p className="font-bold text-slate-200">{log.userId.name}</p>
                              <p className="text-[10px] text-slate-500">{log.userId.email}</p>
                            </div>
                          ) : <span className="text-slate-600 italic">Unknown</span>}
                        </td>
                        <td className="px-4 py-3">
                          <code className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold border border-slate-700">
                            {log.endpoint}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-semibold">{log.requestPayload?.destination || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            log.status === "Success"
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                              : "bg-red-950/60 text-red-400 border-red-800/60"
                          }`}>
                            {log.status === "Success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => { setSelectedLog(log); setModalTab(log.status === "Failure" && log.error ? "error" : "request"); }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold inline-flex items-center gap-1 border border-slate-700 transition-colors text-[11px]"
                          >
                            <FaEye /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full h-[80vh] mx-4 flex flex-col overflow-hidden">
            <header className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <FaExchangeAlt className="text-rose-400" /> JSON Diagnostics
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">ID: {selectedLog._id} | Endpoint: {selectedLog.endpoint}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <FaTimes />
              </button>
            </header>

            <div className="flex bg-slate-950/40 border-b border-slate-800 p-1 flex-shrink-0 gap-1">
              {["request", "response", ...(selectedLog.error ? ["error"] : [])].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors capitalize ${
                    modalTab === tab
                      ? tab === "error" ? "bg-red-950/60 text-red-400" : "bg-slate-800 text-rose-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab === "request" ? "Request Payload" : tab === "response" ? "Response Output" : "Error Stack"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-[11px] leading-relaxed">
              {modalTab === "request" && <pre className="whitespace-pre-wrap text-slate-200">{JSON.stringify(selectedLog.requestPayload, null, 2)}</pre>}
              {modalTab === "response" && (
                <pre className="whitespace-pre-wrap text-slate-200">
                  {selectedLog.responsePayload ? JSON.stringify(selectedLog.responsePayload, null, 2) : "// No response payload recorded."}
                </pre>
              )}
              {modalTab === "error" && <pre className="text-red-400 whitespace-pre-wrap">{selectedLog.error || "// No error stack trace recorded."}</pre>}
            </div>

            <footer className="p-3 bg-slate-950/40 border-t border-slate-800 flex justify-end flex-shrink-0">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors">
                Close Logs
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
