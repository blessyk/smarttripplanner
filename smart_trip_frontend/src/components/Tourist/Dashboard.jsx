import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, Link, useNavigate } from "react-router-dom";
import api from "../Utils/api";
import {
  FaCalendarAlt, FaMapMarkerAlt, FaStar,
  FaHotel, FaBus, FaUmbrellaBeach, FaCompass
} from "react-icons/fa";

const StatCard = ({ title, value, sub, icon, gradient, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white border border-slate-150/60 rounded-2xl p-6 relative overflow-hidden hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 cursor-pointer shadow-xs"
  >
    <span className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] animate-pulse`} />
    <div className="relative flex justify-between items-start">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
        <p className="text-3xl font-extrabold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs mt-1.5 font-medium text-slate-400">{sub}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg text-white shadow-sm flex-shrink-0`}
        style={{ animation: "float 3s ease-in-out infinite" }}>
        {icon}
      </div>
    </div>
    <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const [allDestinations, setAllDestinations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [tripsRes, destRes] = await Promise.all([
          api.get("/trips").catch((err) => {
            console.error("Failed to load user trips:", err);
            return null;
          }),
          api.get("/destinations").catch((err) => {
            console.error("Failed to load destinations:", err);
            return null;
          })
        ]);

        if (tripsRes?.data?.success && Array.isArray(tripsRes.data.data?.trips)) {
          setTrips(tripsRes.data.data.trips);
        }
        if (destRes?.data?.success && Array.isArray(destRes.data.data?.destinations)) {
          setAllDestinations(destRes.data.data.destinations);
        }
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Compute recommendations dynamically based on user's past trip interests
  const destinations = React.useMemo(() => {
    if (!allDestinations || allDestinations.length === 0) return [];

    const userInterests = trips.flatMap(trip => trip.interests || []);
    const interestCounts = {};
    userInterests.forEach(interest => {
      const norm = interest.trim();
      interestCounts[norm] = (interestCounts[norm] || 0) + 1;
    });

    const scored = allDestinations.map(dest => {
      let score = 0;
      
      // Direct category match weighting (e.g. matching 'Beach' to Beach category)
      if (interestCounts[dest.category]) {
        score += interestCounts[dest.category] * 5;
      }
      
      // Text description keyword matching
      Object.keys(interestCounts).forEach(interest => {
        if (dest.description && dest.description.toLowerCase().includes(interest.toLowerCase())) {
          score += interestCounts[interest] * 1;
        }
      });
      
      return { ...dest, score };
    });

    // Sort by recommendation score, falling back to database order
    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [allDestinations, trips]);

  const getTagStyle = (category) => {
    switch (category) {
      case "Beach": return "text-teal-700 bg-teal-50 border-teal-200";
      case "Adventure": return "text-red-700 bg-red-50 border-red-200";
      case "Cultural": return "text-amber-700 bg-amber-50 border-amber-200";
      case "Wildlife": return "text-green-700 bg-green-50 border-green-200";
      default: return "text-indigo-700 bg-indigo-50 border-indigo-200";
    }
  };

  if (!isLoggedIn) return <Navigate to="/" />;

  const now = new Date();

  // 1. Calculations for stat cards
  const totalPlanned = trips.length;
  
  const upcomingTrips = trips.filter(trip => new Date(trip.startDate) > now)
                             .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const upcomingCount = upcomingTrips.length;

  const completedTrips = trips.filter(trip => new Date(trip.endDate) < now);
  const uniqueVisited = [...new Set(completedTrips.map(trip => trip.destination))];
  const placesVisitedCount = uniqueVisited.length;

  // 2. Active Trip Banner Selection
  const ongoingTrips = trips.filter(trip => new Date(trip.startDate) <= now && new Date(trip.endDate) >= now);
  const activeTrip = ongoingTrips[0] || null;
  const nextTrip = upcomingTrips[0] || null;
  const displayTrip = activeTrip || nextTrip;

  // 3. Dynamic Budget Card Setup
  const budgetTrip = nextTrip || activeTrip || trips[0] || null;
  let dynamicBudgetItems = [];
  let totalTripBudget = 0;
  
  if (budgetTrip && budgetTrip.budgetBreakdown) {
    const bd = budgetTrip.budgetBreakdown;
    totalTripBudget = budgetTrip.budget;
    
    const breakdownKeys = [
      { label: "Lodging Hotels", value: bd.accommodationBudget || 0, color: "bg-blue-500" },
      { label: "Food & Dining", value: bd.foodBudget || 0, color: "bg-teal-500" },
      { label: "Transportation", value: bd.transportationBudget || 0, color: "bg-amber-400" },
      { label: "Local Sights", value: bd.activityBudget || 0, color: "bg-red-400" },
      { label: "Emergency Reserve", value: bd.emergencyBudget || 0, color: "bg-purple-400" }
    ];
    
    const activeItems = breakdownKeys.filter(item => item.value > 0);
    dynamicBudgetItems = activeItems.map(item => {
      const pctValue = totalTripBudget > 0 ? Math.round((item.value / totalTripBudget) * 100) : 0;
      return {
        label: item.label,
        amount: `₹${item.value.toLocaleString("en-IN")}`,
        pct: `${pctValue}%`,
        color: item.color
      };
    });
  }

  // Fallback for budget if no trips
  if (dynamicBudgetItems.length === 0) {
    totalTripBudget = 45000;
    dynamicBudgetItems = [
      { label: "Lodging Hotels", amount: "₹18,000", pct: "40%", color: "bg-blue-500" },
      { label: "Transportation", amount: "₹9,000",  pct: "20%", color: "bg-teal-500" },
      { label: "Local Sights",  amount: "₹12,000", pct: "27%", color: "bg-amber-400" },
    ];
  }

  // 4. Dynamic Recent Activity Lists
  const dynamicActivities = [];
  const sortedTripsForActivity = [...trips].sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
  
  sortedTripsForActivity.forEach((trip) => {
    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);
    
    if (tripEnd < now) {
      dynamicActivities.push({
        label: `Completed trip to ${trip.destination}`,
        time: `${tripEnd.toLocaleDateString("en-IN")}`,
        dotBg: "bg-emerald-500",
        iconBg: "bg-emerald-100",
        icon: <FaMapMarkerAlt className="text-emerald-600 text-xs" />
      });
    } else if (tripStart <= now && tripEnd >= now) {
      dynamicActivities.push({
        label: `Currently in ${trip.destination}!`,
        time: "Ongoing",
        dotBg: "bg-indigo-500",
        iconBg: "bg-indigo-100",
        icon: <FaMapMarkerAlt className="text-indigo-600 text-xs" />
      });
    } else {
      dynamicActivities.push({
        label: `Planned trip to ${trip.destination}`,
        time: `Starts ${tripStart.toLocaleDateString("en-IN")}`,
        dotBg: "bg-blue-500",
        iconBg: "bg-blue-100",
        icon: <FaCalendarAlt className="text-blue-600 text-xs" />
      });
    }
  });

  if (dynamicActivities.length === 0) {
    dynamicActivities.push({
      label: "Welcome to TripPlanner!",
      time: "Just now",
      dotBg: "bg-blue-500",
      iconBg: "bg-blue-100",
      icon: <FaMapMarkerAlt className="text-blue-600 text-xs" />
    });
    dynamicActivities.push({
      label: "Identify spots using Image Prediction",
      time: "Try now",
      dotBg: "bg-indigo-500",
      iconBg: "bg-indigo-100",
      icon: <FaCompass className="text-indigo-600 text-xs" />
    });
  }
  const displayActivities = dynamicActivities.slice(0, 3);

  // Helper to compute countdown
  const getCountdownDays = (dateStr) => {
    const diffTime = new Date(dateStr) - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days left` : "Starts today!";
  };

  // Helper to compute nights
  const getNights = (startStr, endStr) => {
    const diffTime = new Date(endStr) - new Date(startStr);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} nights` : "1 day";
  };

  return (
    <main className="p-6 bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/20 min-h-screen overflow-y-auto">
      {loading ? (
        <div className="flex h-60 w-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <StatCard 
              title="Trips Planned"   
              value={totalPlanned} 
              sub={`${totalPlanned} total itineraries`}       
              icon={<FaCalendarAlt />}  
              gradient="from-blue-500 to-indigo-600"
              onClick={() => navigate("/Tourist/my-trips")}
            />
            <StatCard 
              title="Upcoming Trips"  
              value={upcomingCount}  
              sub={nextTrip ? `Next: ${nextTrip.destination}` : "No upcoming trips"} 
              icon={<FaMapMarkerAlt />} 
              gradient="from-teal-400 to-emerald-600"
              onClick={() => navigate("/Tourist/my-trips")}
            />
            <StatCard 
              title="Places Visited"  
              value={placesVisitedCount} 
              sub={`${placesVisitedCount} unique destinations`}     
              icon={<FaStar />}         
              gradient="from-amber-400 to-orange-500"
              onClick={() => navigate("/Tourist/my-trips")}
            />
          </div>

          {/* Upcoming Trip Banner */}
          {displayTrip ? (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md text-white relative overflow-hidden">
              <span className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/5" />
              <span className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
              <div className="flex items-center gap-4 relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-md">
                  <FaMapMarkerAlt className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1.5">
                    {activeTrip ? "📍 Active & Ongoing" : "✈️ Up Next on Your Horizon"}
                  </p>
                  <h3 className="text-white font-extrabold text-xl leading-tight">{displayTrip.destination}</h3>
                  <p className="text-blue-100 text-xs mt-1">
                    {new Date(displayTrip.startDate).toLocaleDateString("en-IN")} — {new Date(displayTrip.endDate).toLocaleDateString("en-IN")} &nbsp;·&nbsp; {getNights(displayTrip.startDate, displayTrip.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto justify-between md:justify-end relative">
                {!activeTrip && (
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Days to Departure</p>
                    <p className="text-base font-extrabold text-white">
                      {getCountdownDays(displayTrip.startDate)}
                    </p>
                  </div>
                )}
                {activeTrip && (
                  <div className="text-left md:text-right">
                    <span className="px-2.5 py-1 bg-emerald-500/25 text-emerald-100 border border-emerald-500/30 font-bold rounded-lg text-[10px] backdrop-blur-xs uppercase tracking-wider">
                      Live Trip
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => navigate(`/Tourist/generated-trip/${displayTrip._id}`)}
                  className="bg-white hover:bg-blue-50 text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  View Itinerary →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-blue-150/60 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <FaCompass className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Explore</p>
                  <h3 className="text-slate-800 font-extrabold text-lg">Ready to explore the world?</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Create your next customized, AI-powered travel itinerary in seconds.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/Tourist/TripPlanner")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-750 hover:to-indigo-750 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex-shrink-0 cursor-pointer"
              >
                Plan a New Trip
              </button>
            </div>
          )}

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Destinations — spans 2 cols */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-slate-800 font-bold text-sm">Recommended Destinations</p>
                  <p className="text-slate-400 text-xs">Picked for you</p>
                </div>
                <Link to="/Tourist/DestinationSearch" className="bg-blue-50 border border-blue-200 text-blue-600 text-xs rounded-lg px-3 py-1 hover:bg-blue-100 transition-colors">
                  View all
                </Link>
              </div>
              
              {destinations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {destinations.map((d) => (
                    <div key={d._id} className="border border-slate-200 rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-200 flex flex-col bg-white">
                      <div className="w-full h-28 bg-slate-200 overflow-hidden relative flex-shrink-0">
                        <img
                          src={d.images && d.images[0] ? d.images[0] : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"}
                          alt={d.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-65 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {d.duration || "5 Days"}
                        </div>
                      </div>
                      <div className="p-3 flex flex-col flex-grow">
                        <p className="font-bold text-slate-800 text-sm truncate">{d.name}</p>
                        <p className="text-slate-500 text-xs mb-2 truncate">{d.country}</p>
                        <p className="text-[#0A3D62] font-bold text-xs mb-3">₹{(d.price || 15000).toLocaleString("en-IN")}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className={`text-[10px] border rounded-md px-2 py-0.5 font-medium ${getTagStyle(d.category)}`}>
                            {d.category || "Sightseeing"}
                          </span>
                          <button 
                            onClick={() => navigate("/Tourist/TripPlanner", { state: { destination: d.name } })}
                            className="bg-blue-50 border border-blue-200 text-blue-600 text-[11px] rounded-lg px-2.5 py-1 hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            Explore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No destinations resolved. Explore destinations using search!
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">

              {/* Activity */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-slate-800 font-bold text-sm mb-1">Recent Activity</p>
                <p className="text-slate-400 text-xs mb-3">Latest actions</p>
                <div className="space-y-3">
                  {displayActivities.map((a, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-850 text-xs truncate font-medium">{a.label}</p>
                        <p className="text-slate-400 text-[10px]">{a.time}</p>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${a.dotBg} flex-shrink-0`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-slate-800 font-bold text-sm mb-1">
                  {budgetTrip ? `${budgetTrip.destination} Budget` : "Sample Trip Budget"}
                </p>
                <p className="text-slate-400 text-xs mb-3">₹{totalTripBudget.toLocaleString("en-IN")} total</p>
                <div className="space-y-2.5">
                  {dynamicBudgetItems.map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{b.label}</span>
                        <span className="text-slate-800 font-medium">{b.amount}</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5">
                        <div className={`${b.color} h-1.5 rounded-full`} style={{ width: b.pct }} />
                      </div>
                    </div>
                  ))}
                  
                  {budgetTrip && (
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">Itinerary Cost Summary</span>
                      <span className="text-blue-600 font-semibold">₹{totalTripBudget.toLocaleString("en-IN")} / ₹{totalTripBudget.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default Dashboard;
