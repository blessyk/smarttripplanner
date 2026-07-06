import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaCalendarAlt, FaWallet, FaUsers, FaSuitcase, 
  FaEye, FaTrash, FaCommentDots, FaSpinner 
} from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

const MyTrips = () => {
  const [filter, setFilter] = useState("all");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    try {
      const response = await api.get("/trips");
      if (response.data?.success) {
        setTrips(response.data.data.trips || []);
      }
    } catch (err) {
      console.error("Failed to fetch user trips:", err);
      toast.error("Failed to retrieve your saved trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDeleteTrip = async (id, destination) => {
    if (!window.confirm(`Are you sure you want to delete your trip to ${destination}?`)) {
      return;
    }
    try {
      const response = await api.delete(`/trips/${id}`);
      if (response.data?.success) {
        toast.success(`Successfully deleted trip to ${destination}`);
        setTrips((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete the trip.");
    }
  };

  const filteredTrips = React.useMemo(() => {
    const now = new Date();
    switch (filter) {
      case "upcoming":
        return trips.filter((trip) => new Date(trip.startDate) > now);
      case "ongoing":
        return trips.filter((trip) => {
          const start = new Date(trip.startDate);
          const end = new Date(trip.endDate);
          return start <= now && end >= now;
        });
      case "past":
        return trips.filter((trip) => new Date(trip.endDate) < now);
      default:
        return trips;
    }
  }, [trips, filter]);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/20 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              🧳 My Saved Trips
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Review your custom-made AI travel itineraries, chat logs, and budgets.</p>
          </div>
          <Link
            to="/Tourist/TripPlanner"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-750 hover:to-indigo-750 text-white rounded-xl text-xs font-bold shadow-md transition-all duration-200"
          >
            + Plan New Trip
          </Link>
        </header>

        {/* Filters */}
        <div className="mb-6 flex gap-2 border-b border-slate-200/80 pb-3.5 flex-wrap">
          {[
            { id: "all", label: "All Trips" },
            { id: "upcoming", label: "Upcoming" },
            { id: "ongoing", label: "Ongoing" },
            { id: "past", label: "Past / Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                filter === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-100"
                  : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.label} ({
                tab.id === "all" ? trips.length :
                tab.id === "upcoming" ? trips.filter(t => new Date(t.startDate) > new Date()).length :
                tab.id === "ongoing" ? trips.filter(t => {
                  const start = new Date(t.startDate);
                  const end = new Date(t.endDate);
                  return start <= new Date() && end >= new Date();
                }).length :
                trips.filter(t => new Date(t.endDate) < new Date()).length
              })
            </button>
          ))}
        </div>

        {filteredTrips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              🗺️
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No trips found</h3>
            <p className="text-slate-500 text-sm mb-6">
              {filter === "all" 
                ? "Create your first AI-powered travel plan and watch your custom itinerary load in real time!" 
                : `No saved itineraries match the "${filter}" filter currently.`}
            </p>
            {filter === "all" && (
              <Link
                to="/Tourist/TripPlanner"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm"
              >
                Plan a Trip
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const startStr = new Date(trip.startDate).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
              });
              const endStr = new Date(trip.endDate).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
              });
              
              const isPast = new Date(trip.endDate) < new Date();
              const isOngoing = new Date(trip.startDate) <= new Date() && new Date(trip.endDate) >= new Date();

              return (
                <div 
                  key={trip._id} 
                  className="bg-white rounded-2xl border border-slate-150/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Card Header (Gradient block) */}
                  <div className={`p-5 text-white ${
                    isPast ? "bg-gradient-to-r from-slate-500 to-slate-600" :
                    isOngoing ? "bg-gradient-to-r from-emerald-500 to-teal-600" :
                    "bg-gradient-to-r from-blue-600 to-indigo-600"
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full">
                        {trip.tripType} Trip
                      </span>
                      <span className="text-[10px] uppercase font-bold bg-white/15 px-2 py-0.5 rounded-full border border-white/20">
                        {isPast ? "Past" : isOngoing ? "Ongoing" : "Upcoming"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold mt-1.5 truncate">{trip.destination}</h2>
                    <p className="text-xs text-blue-100 mt-1 flex items-center gap-1.5 font-medium">
                      <FaCalendarAlt className="text-[10px]" /> {startStr} - {endStr}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 space-y-3 text-slate-650 text-xs">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500">Duration</span>
                      <span className="font-bold text-slate-800">{trip.numberOfDays} Days</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500">Budget</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <FaWallet className="text-[10px] text-emerald-500" /> ₹{trip.budget.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500">Travelers</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <FaUsers className="text-[10px] text-blue-500" /> {trip.travelers} {trip.travelers === 1 ? "Traveler" : "Travelers"}
                      </span>
                    </div>

                    {trip.interests && trip.interests.length > 0 && (
                      <div className="pt-1">
                        <span className="font-semibold text-slate-500 block mb-1">Interests</span>
                        <div className="flex flex-wrap gap-1">
                          {trip.interests.slice(0, 3).map((interest) => (
                            <span 
                              key={interest} 
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold"
                            >
                              {interest}
                            </span>
                          ))}
                          {trip.interests.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{trip.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-150 grid grid-cols-3 gap-2">
                    <Link
                      to={`/Tourist/generated-trip/${trip._id}`}
                      className="py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-1 text-[11px] transition-colors"
                      title="View Details"
                    >
                      <FaEye /> View
                    </Link>

                    <Link
                      to={`/Tourist/chat/${trip._id}`}
                      className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-250 rounded-xl font-bold flex items-center justify-center gap-1 text-[11px] transition-colors"
                      title="AI Travel Assistant Chat"
                    >
                      <FaCommentDots /> Assistant
                    </Link>

                    <button
                      onClick={() => handleDeleteTrip(trip._id, trip.destination)}
                      className="py-2 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-xl font-bold flex items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer"
                      title="Delete Saved Trip"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTrips;
