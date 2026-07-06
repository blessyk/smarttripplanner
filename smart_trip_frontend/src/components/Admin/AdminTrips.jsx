import React, { useState, useEffect } from "react";
import { FaSearch, FaTrash, FaSuitcase, FaWallet, FaCalendarAlt, FaSpinner } from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";
import Pagination from "./Pagination";

export default function AdminTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalTrips: 0, totalBudget: 0, avgDays: 0 });
  const limit = 10;

  const fetchAllTrips = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/admin/trips?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`
      );
      if (response.data?.success) {
        setTrips(response.data.data.trips || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load generated trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTrips();
  }, [currentPage, searchTerm]);

  const handleDeleteTrip = async (id, destination) => {
    if (!window.confirm(`Are you sure you want to delete this trip to ${destination}? This action is permanent.`)) {
      return;
    }
    try {
      const response = await api.delete(`/trips/${id}`);
      if (response.data?.success) {
        toast.success(`Successfully deleted trip to ${destination}`);
        fetchAllTrips();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete trip.");
    }
  };

  // Compute stats
  const totalTrips = stats.totalTrips;
  const totalBudget = stats.totalBudget;
  const avgDays = stats.avgDays;

  const currentRows = trips;

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-rose-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Trips Management</h1>
          <p className="text-slate-500 text-sm mt-1">Review, analyze, and manage all AI-generated travel itineraries.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-950/60 text-violet-400 border border-violet-800/60 flex items-center justify-center text-lg">
              <FaSuitcase />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Itineraries</p>
              <h3 className="text-2xl font-extrabold text-slate-100 mt-0.5">{totalTrips}</h3>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center justify-center text-lg">
              <FaWallet />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Budget</p>
              <h3 className="text-2xl font-extrabold text-slate-100 mt-0.5">₹{totalBudget.toLocaleString("en-IN")}</h3>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center justify-center text-lg">
              <FaCalendarAlt />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Average Duration</p>
              <h3 className="text-2xl font-extrabold text-slate-100 mt-0.5">{avgDays} Days</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-sm font-bold text-slate-200">Generated Trips ({currentRows.length})</h2>
            <div className="relative w-full sm:w-72">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search by destination or user..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40 bg-slate-950 text-slate-200 placeholder-slate-500"
              />
            </div>
          </div>

          {currentRows.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs italic">
              No generated itineraries found matching the search criteria.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold uppercase">
                      <th className="px-4 py-3">Destination</th>
                      <th className="px-4 py-3">Created By</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3">Trip Type</th>
                      <th className="px-4 py-3">Date Planned</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentRows.map((trip) => {
                      const createdDate = new Date(trip.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      });
                      return (
                        <tr key={trip._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-100">{trip.destination}</td>
                          <td className="px-4 py-3">
                            {trip.userId ? (
                              <div>
                                <p className="font-semibold text-slate-200">{trip.userId.name}</p>
                                <p className="text-[10px] text-slate-500">{trip.userId.email}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unknown User</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-300">{trip.numberOfDays} Days</td>
                          <td className="px-4 py-3 font-bold text-slate-200">₹{trip.budget.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3">
                            <span className="bg-violet-950/60 text-violet-300 px-2.5 py-0.5 rounded-full text-[10px] border border-violet-800/60 font-semibold">
                              {trip.tripType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{createdDate}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteTrip(trip._id, trip.destination)}
                              className="p-2 bg-red-950/60 hover:bg-red-900/60 text-red-400 rounded-xl transition-colors inline-flex border border-red-800/60"
                              title="Delete Trip"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-slate-800">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
