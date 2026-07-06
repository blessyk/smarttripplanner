import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FaCalendarAlt, FaWallet, FaUsers, FaSuitcase, FaHotel, FaUtensils, 
  FaCloudSun, FaExclamationTriangle, FaMapMarkedAlt, FaCommentDots, 
  FaCheckCircle, FaChevronDown, FaChevronUp, FaSpinner, FaStar
} from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "../Utils/api";
import { toast } from "react-toastify";
import SubmitReviewModal from "./SubmitReviewModal";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const cleanQueryName = (name) => {
  return name
    .replace(/^(near|around|nearby|close to|visit|explore|lunch at|dinner at|breakfast at|stay at|shopping at|tea at|coffee at)\s+/i, "")
    .trim();
};

const getCoordsForName = (name, baseLat, baseLng) => {
  if (!name) return [baseLat, baseLng];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((Math.abs(hash) % 100) / 100) * 0.008 - 0.004;
  const lngOffset = (((Math.abs(hash) >> 8) % 100) / 100) * 0.008 - 0.004;
  return [baseLat + latOffset, baseLng + lngOffset];
};

const getHaversineDistance = (coords1, coords2) => {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const GeneratedTrip = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(1);
  const [review, setReview] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [isMapMaximized, setIsMapMaximized] = useState(false);
  const [geocodedPoints, setGeocodedPoints] = useState([]);
  const [resolvingCoords, setResolvingCoords] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const response = await api.get(`/trips/${id}`);
        if (response.data?.success) {
          setTrip(response.data.data.trip);
        }
      } catch (err) {
        console.error("Failed to fetch trip details:", err);
        toast.error("Failed to load your trip plan.");
      } finally {
        setLoading(false);
      }
    };

    const fetchReview = async () => {
      try {
        const response = await api.get(`/reviews/trip/${id}`);
        if (response.data?.success && response.data.data) {
          setReview(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch review status:", err);
      }
    };

    fetchTripDetails();
    fetchReview();
  }, [id]);

  // Geocode all places concurrently using database fields or falling back to OSM Nominatim
  useEffect(() => {
    if (!trip || !trip.latitude || !trip.longitude) return;

    const resolveAllCoordinates = async () => {
      setResolvingCoords(true);
      
      const resolvePoint = async (placeName, type, icon, desc, dbLat, dbLng, dayNum = 0, timeVal = "") => {
        // If exact coordinates were already fetched and saved in database, use them immediately
        if (typeof dbLat === "number" && typeof dbLng === "number" && dbLat !== 0 && dbLng !== 0) {
          return { coords: [dbLat, dbLng], name: placeName, type, icon, desc, dayNum, timeVal };
        }

        let coords = null;
        try {
          const cleaned = cleanQueryName(placeName);
          const query = encodeURIComponent(`${cleaned}, ${trip.destination}`);
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
            headers: {
              "User-Agent": "SmartTripPlanner/1.0"
            }
          });
          const data = await response.json();
          if (data && data.length > 0) {
            coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          }
        } catch (e) {
          console.warn(`OSM Nominatim failed to geocode: ${placeName}. Using offset fallback.`);
        }

        if (!coords) {
          coords = getCoordsForName(placeName, trip.latitude, trip.longitude);
        }

        return { coords, name: placeName, type, icon, desc, dayNum, timeVal };
      };

      const tasks = [];

      // 1. Hotel task (Base Station)
      if (trip.recommendedHotels && trip.recommendedHotels[0]) {
        const hotel = trip.recommendedHotels[0];
        tasks.push(resolvePoint(
          hotel.hotelName, 
          "Hotel", 
          "🏨", 
          hotel.location, 
          undefined, 
          undefined, 
          0, 
          "Base"
        ));
      }

      // 2. Loop through all days and schedule items
      if (trip.itinerary && trip.itinerary.length > 0) {
        trip.itinerary.forEach((dayPlan) => {
          if (dayPlan.schedule && dayPlan.schedule.length > 0) {
            dayPlan.schedule.forEach((item) => {
              const searchName = item.location || item.activity;
              if (searchName) {
                tasks.push(resolvePoint(
                  searchName, 
                  `Day ${dayPlan.day}`, 
                  "📍", 
                  item.activity,
                  item.latitude,
                  item.longitude,
                  dayPlan.day,
                  item.time
                ));
              }
            });
          }
        });
      }

      try {
        const pointsList = await Promise.all(tasks);
        setGeocodedPoints(pointsList);
      } catch (err) {
        console.error("Geocoding task execution error:", err);
      } finally {
        setResolvingCoords(false);
      }
    };

    resolveAllCoordinates();
  }, [trip]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!trip || geocodedPoints.length === 0) return;

    // Add Leaflet CSS
    if (!document.getElementById("leaflet-css-cdn")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-cdn";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-js-script";
    let script = document.getElementById(scriptId);

    const initMap = () => {
      const L = window.L;
      if (!L) return;

      const containerId = isMapMaximized ? "leaflet-map-fullscreen" : "leaflet-map-div";
      const mapContainer = document.getElementById(containerId);
      if (!mapContainer) return;

      // Clean up previous map instances from ALL containers
      ["leaflet-map-div", "leaflet-map-fullscreen"].forEach(id => {
        const el = document.getElementById(id);
        if (el && el._leaflet_id) {
          el.innerHTML = "";
          delete el._leaflet_id;
        }
      });

      const map = L.map(containerId).setView([trip.latitude, trip.longitude], 13);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(map);

      // Filter points to show only the Hotel and the selected day's activities
      const dayPoints = geocodedPoints.filter(pt => {
        if (pt.dayNum === 0) return true; // Always include hotel
        return pt.dayNum === expandedDay; // Include only current selected day
      });

      // Plot day-specific geocoded points
      dayPoints.forEach(pt => {
        const customIcon = L.divIcon({
          html: `<div style="font-size:24px; filter:drop-shadow(0px 2px 4px rgba(0,0,0,0.3))">${pt.icon}</div>`,
          className: "custom-leaflet-emoji-icon",
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker(pt.coords, { icon: customIcon })
          .addTo(map)
          .bindPopup(`<b>${pt.type} ${pt.timeVal && pt.timeVal !== "Base" ? `(${pt.timeVal})` : ""}</b><br/><b>${pt.name}</b><br/>${pt.desc || ''}`);
      });

      // Draw polyline route connecting day sequence in order
      if (dayPoints.length > 1) {
        const latlngs = dayPoints.map(pt => pt.coords);
        
        // Loop back to hotel for full daily circuit
        latlngs.push(dayPoints[0].coords);

        const coordString = dayPoints.map(pt => `${pt.coords[1]},${pt.coords[0]}`).join(";");
        const fullCoordString = `${coordString};${dayPoints[0].coords[1]},${dayPoints[0].coords[0]}`;

        fetch(`https://router.project-osrm.org/route/v1/driving/${fullCoordString}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.code === "Ok" && data.routes && data.routes[0]) {
              const route = data.routes[0];
              const roadLatLngs = route.geometry.coordinates.map(c => [c[1], c[0]]);

              const polyline = L.polyline(roadLatLngs, {
                color: '#2563eb',
                weight: 5,
                opacity: 0.85
              }).addTo(map);

              map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

              for (let i = 0; i < dayPoints.length; i++) {
                const p1 = dayPoints[i];
                const p2 = dayPoints[(i + 1) % dayPoints.length];
                const legDistance = route.legs && route.legs[i] ? route.legs[i].distance / 1000 : getHaversineDistance(p1.coords, p2.coords);

                const midLat = (p1.coords[0] + p2.coords[0]) / 2;
                const midLng = (p1.coords[1] + p2.coords[1]) / 2;

                L.popup({ closeButton: false, autoClose: false, closeOnClick: false })
                  .setLatLng([midLat, midLng])
                  .setContent(`<span style="font-size:10px; font-weight:bold; color:#1d4ed8; background:white; padding:3px 6px; border-radius:6px; border:1px solid #bfdbfe; box-shadow: 0 1px 3px rgba(0,0,0,0.1)">To ${p2.name}: ${legDistance.toFixed(1)} km</span>`)
                  .addTo(map);
              }
            } else {
              drawFallbackStraightLines();
            }
          })
          .catch(err => {
            console.error("OSRM road routing failed, drawing straight line fallbacks:", err);
            drawFallbackStraightLines();
          });

        const drawFallbackStraightLines = () => {
          const polyline = L.polyline(latlngs, {
            color: '#2563eb',
            weight: 4,
            opacity: 0.85,
            dashArray: '6, 12'
          }).addTo(map);

          map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

          for (let i = 0; i < dayPoints.length; i++) {
            const p1 = dayPoints[i];
            const p2 = dayPoints[(i + 1) % dayPoints.length];
            const dist = getHaversineDistance(p1.coords, p2.coords);
            
            const midLat = (p1.coords[0] + p2.coords[0]) / 2;
            const midLng = (p1.coords[1] + p2.coords[1]) / 2;

            L.popup({ closeButton: false, autoClose: false, closeOnClick: false })
              .setLatLng([midLat, midLng])
              .setContent(`<span style="font-size:10px; font-weight:bold; color:#1d4ed8; background:white; padding:3px 6px; border-radius:6px; border:1px solid #bfdbfe; box-shadow: 0 1px 3px rgba(0,0,0,0.1)">To ${p2.name}: ${dist.toFixed(1)} km (straight)</span>`)
              .addTo(map);
          }
        };
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      if (window.L) {
        initMap();
      } else {
        script.addEventListener("load", initMap);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener("load", initMap);
      }
    };
  }, [trip, geocodedPoints, isMapMaximized, expandedDay]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-semibold">Loading your custom AI itinerary...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Itinerary could not be loaded. Please return to the Planner.</p>
        <Link to="/Tourist/TripPlanner" className="text-blue-600 underline text-sm">Return to Planner</Link>
      </div>
    );
  }

  // Formatting chart data
  const budgetChartData = [
    { name: "Accommodation", value: trip.budgetBreakdown.accommodationBudget },
    { name: "Food", value: trip.budgetBreakdown.foodBudget },
    { name: "Transportation", value: trip.budgetBreakdown.transportationBudget },
    { name: "Activities", value: trip.budgetBreakdown.activityBudget },
    { name: "Emergency", value: trip.budgetBreakdown.emergencyBudget }
  ].filter(item => item.value > 0);

  const startStr = new Date(trip.startDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const endStr = new Date(trip.endDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const isTripCompleted = new Date() > new Date(trip.endDate);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <span className="bg-white/25 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border border-white/10">
                {trip.tripType} Choice
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mt-2">{trip.destination} Itinerary</h1>
              <p className="text-blue-100 text-sm mt-1.5 flex items-center gap-2">
                <FaCalendarAlt /> {startStr} — {endStr} ({trip.numberOfDays} Days)
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link
                to={`/Tourist/chat/${trip._id}`}
                className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                <FaCommentDots /> AI Travel Assistant Chat
              </Link>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 text-white/5 text-[180px] font-bold select-none pointer-events-none">
            ✈
          </div>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Budget</span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">₹{trip.budget.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Travelers</span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{trip.travelers} {trip.travelers === 1 ? "Person" : "People"}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Hotel Tier</span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{trip.accommodationPreference}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Food Preference</span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{trip.foodPreference}</p>
          </div>
        </div>

        {/* Review Section */}
        {isTripCompleted && (
          review ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    ✍️ Your Trip Feedback
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Submitted on {new Date(review.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 text-[10px] font-bold rounded-lg transition-colors"
                >
                  Edit Review
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Destination feedback */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-700 text-xs">📍 Destination: {review.destination.name}</span>
                      <div className="flex gap-0.5">
                        {[...Array(review.destination.rating)].map((_, i) => (
                          <FaStar key={i} className="text-amber-400 fill-amber-400 text-[10px]" />
                        ))}
                      </div>
                    </div>
                    {review.destination.comment ? (
                      <p className="text-xs text-slate-500 italic">"{review.destination.comment}"</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No destination comments provided.</p>
                    )}
                  </div>
                </div>

                {/* Hotel feedback */}
                {review.hotel && review.hotel.name && (
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="font-semibold text-slate-700 text-xs">🏨 Lodging: {review.hotel.name}</span>
                          <p className="text-[9px] text-slate-400">{review.hotel.roomType}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(review.hotel.rating)].map((_, i) => (
                            <FaStar key={i} className="text-amber-400 fill-amber-400 text-[10px]" />
                          ))}
                        </div>
                      </div>
                      {review.hotel.comment ? (
                        <p className="text-xs text-slate-500 italic">"{review.hotel.comment}"</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No hotel comments provided.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Room feedback */}
                {review.room && review.room.name && (
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-700 text-xs">🛏️ Room Stay: {review.room.name}</span>
                        <div className="flex gap-0.5">
                          {[...Array(review.room.rating)].map((_, i) => (
                            <FaStar key={i} className="text-amber-400 fill-amber-400 text-[10px]" />
                          ))}
                        </div>
                      </div>
                      {review.room.comment ? (
                        <p className="text-xs text-slate-500 italic">"{review.room.comment}"</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No room comments provided.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Restaurant feedback */}
                {review.restaurant && review.restaurant.name && (
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-700 text-xs">🍽️ Dining: {review.restaurant.name}</span>
                        <div className="flex gap-0.5">
                          {[...Array(review.restaurant.rating)].map((_, i) => (
                            <FaStar key={i} className="text-amber-400 fill-amber-400 text-[10px]" />
                          ))}
                        </div>
                      </div>
                      {review.restaurant.comment ? (
                        <p className="text-xs text-slate-500 italic">"{review.restaurant.comment}"</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No restaurant comments provided.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Attraction feedback */}
                {review.attraction && review.attraction.name && (
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-700 text-xs">🎡 Sights: {review.attraction.name}</span>
                        <div className="flex gap-0.5">
                          {[...Array(review.attraction.rating)].map((_, i) => (
                            <FaStar key={i} className="text-amber-400 fill-amber-400 text-[10px]" />
                          ))}
                        </div>
                      </div>
                      {review.attraction.comment ? (
                        <p className="text-xs text-slate-500 italic">"{review.attraction.comment}"</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No attraction comments provided.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-150 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Finished your trip to {trip.destination}?</h3>
                <p className="text-slate-500 text-xs mt-1">Rate hotels, dining, attractions, and get instant AI-powered sentiment analysis on your feedback.</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex-shrink-0 animate-pulse hover:animate-none"
              >
                Write a Review
              </button>
            </div>
          )
        )}

        <SubmitReviewModal
          trip={trip}
          existingReview={review}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onReviewSubmitted={(newReview) => setReview(newReview)}
        />

        {/* Main Layout Sections */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Day-Wise Schedule Timeline (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🗓️ Day-wise Itinerary
            </h2>

            <div className="space-y-3">
              {trip.itinerary.map((dayPlan) => {
                const isExpanded = expandedDay === dayPlan.day;
                return (
                  <div 
                    key={dayPlan.day} 
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : dayPlan.day)}
                      className="w-full px-5 py-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Day {dayPlan.day}</h3>
                        {dayPlan.date && <p className="text-slate-400 text-xs mt-0.5">{dayPlan.date}</p>}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-xs font-semibold">{dayPlan.schedule?.length || 0} activities</span>
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 py-4 border-t border-slate-150 space-y-6 relative">
                        {/* Timeline vertical bar */}
                        <div className="absolute left-[33px] top-6 bottom-6 w-0.5 bg-slate-200" />

                        {dayPlan.schedule.map((item, idx) => (
                          <div key={idx} className="flex gap-4 relative">
                            {/* Circle Node */}
                            <div className="w-[18px] h-[18px] rounded-full bg-blue-600 border-4 border-white shadow-sm flex-shrink-0 z-10 self-start mt-0.5" />
                            
                            {/* Event details */}
                            <div className="flex-1">
                              <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1">
                                {item.time}
                              </span>
                              <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.activity}</h4>
                              {item.description && (
                                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.description}</p>
                              )}
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-[11px] text-slate-400">
                                {item.location && <span>📍 {item.location}</span>}
                                {item.cost > 0 && <span className="text-slate-600 font-medium">Estimated cost: ₹{item.cost}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tourist Attractions Recommendations */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                🏛️ Recommended Tourist Attractions
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {trip.attractions.map((attract, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{attract.placeName}</h4>
                      <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                        {attract.category || "Sight"}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Best Time</span>
                        <span className="font-semibold text-slate-700">{attract.bestTimeToVisit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration</span>
                        <span className="font-semibold text-slate-700">{attract.estimatedDuration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entry Fee</span>
                        <span className="font-semibold text-slate-700">{attract.entryFee === 0 ? "Free" : `₹${attract.entryFee}`}</span>
                      </div>
                      {attract.distanceFromDestination && (
                        <div className="flex justify-between pt-1 border-t border-slate-200">
                          <span>Distance</span>
                          <span className="text-blue-600 font-semibold">{attract.distanceFromDestination}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map, Budget Optimization & Risks (Right 1 Column) */}
          <div className="space-y-6">
            
            {/* Interactive Map */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaMapMarkedAlt className="text-blue-500" /> Route & Location Mapping
                </h3>
                <button
                  onClick={() => setIsMapMaximized(true)}
                  className="px-2.5 py-1 hover:bg-slate-100 rounded-lg text-slate-650 hover:text-slate-900 text-xs font-bold transition-all border border-slate-200 cursor-pointer flex items-center gap-1"
                  title="Maximize Map"
                >
                  🔍 Maximize
                </button>
              </div>
              <div className="relative w-full h-60 rounded-xl overflow-hidden border border-slate-150">
                {resolvingCoords && (
                  <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center gap-2">
                    <FaSpinner className="animate-spin text-xl text-blue-600" />
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Geolocating route points...</p>
                  </div>
                )}
                <div 
                  id="leaflet-map-div" 
                  className="w-full h-full bg-slate-100 z-0" 
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                📍 Displays destination center along with nearby emergency services, transport hubs (hospitals 🏥, trains 🚉, buses 🚌), and local sights.
              </p>
            </div>

            {/* Budget Optimization */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FaWallet className="text-blue-500" /> AI Budget Allocation
              </h3>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {budgetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends with values */}
              <div className="space-y-1.5 text-xs">
                {budgetChartData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-500">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-700">₹{item.value.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather & Safety Risks */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FaCloudSun className="text-blue-500" /> Weather Forecast
              </h3>
              <div className="bg-blue-50 border border-blue-150 rounded-xl p-3.5 space-y-2 text-xs">
                <p className="font-semibold text-blue-900 leading-snug">{trip.weatherInfo.forecast}</p>
                {trip.weatherInfo.warnings && trip.weatherInfo.warnings !== "None" && (
                  <div className="flex gap-1.5 text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2 font-medium">
                    <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
                    <span>Warning: {trip.weatherInfo.warnings}</span>
                  </div>
                )}
                {trip.weatherInfo.recommendations && (
                  <p className="text-slate-600 text-[11px] leading-relaxed pt-1.5 border-t border-blue-100">
                    💡 {trip.weatherInfo.recommendations}
                  </p>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pt-2 border-t border-slate-100">
                <FaExclamationTriangle className="text-blue-500" /> Travel Risk Analysis
              </h3>
              <div className={`border rounded-xl p-3.5 space-y-1 text-xs ${
                trip.riskAnalysis.riskLevel === "High" 
                  ? "bg-red-50 border-red-200 text-red-900" 
                  : trip.riskAnalysis.riskLevel === "Moderate"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-250 text-emerald-900"
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold">Risk Level</span>
                  <span className="uppercase font-extrabold text-[10px] bg-white px-2 py-0.5 rounded-full border">
                    {trip.riskAnalysis.riskLevel}
                  </span>
                </div>
                <p className="text-[11px] leading-snug pt-1 font-medium">{trip.riskAnalysis.reason}</p>
                {trip.riskAnalysis.recommendation && (
                  <p className="text-[10px] text-slate-650 leading-relaxed pt-1 border-t border-black/5 mt-1.5">
                    🛡️ Suggestion: {trip.riskAnalysis.recommendation}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Hotels & Restaurant recommendations section */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Hotels recommendations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              🏨 Recommended Accommodations
            </h3>

            <div className="space-y-4">
              {trip.recommendedHotels.map((hotel, idx) => (
                <div key={idx} className="border border-slate-150 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="font-bold text-slate-850 text-sm leading-tight">{hotel.hotelName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">📍 {hotel.location}</p>
                    </div>
                    <span className="text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                      ★ {hotel.rating || 4.5}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed italic">"{hotel.reasonForRecommendation}"</p>
                  
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-700">₹{hotel.estimatedCost?.toLocaleString("en-IN")} / night</span>
                    
                    {hotel.sentiment && (
                      <div className="flex items-center gap-1.5" title="Review Sentiment Score">
                        <span className="text-[10px] font-bold text-emerald-600">👍 {hotel.sentiment.positivePercentage}%</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] font-bold text-slate-400">😐 {hotel.sentiment.neutralPercentage}%</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] font-bold text-red-500">👎 {hotel.sentiment.negativePercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Restaurant recommendations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              🍽️ Recommended Dining & Local Eats
            </h3>

            <div className="space-y-4">
              {trip.recommendedRestaurants.map((rest, idx) => (
                <div key={idx} className="border border-slate-150 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="font-bold text-slate-850 text-sm leading-tight">{rest.restaurantName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">🍳 Cuisine: {rest.cuisine}</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      ₹{rest.estimatedCost || 500} avg
                    </span>
                  </div>
                  
                  {rest.specialty && (
                    <p className="text-xs text-slate-650 leading-relaxed">
                      🌟 Specialty: <span className="font-semibold text-slate-800">{rest.specialty}</span>
                    </p>
                  )}
                  
                  {rest.sentiment && (
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>Recommendation Score: <span className="font-bold text-slate-600">{rest.sentiment.recommendationScore || 9}</span></span>
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-600 font-bold">👍 {rest.sentiment.positivePercentage}%</span>
                        <span className="text-red-400 font-bold">👎 {rest.sentiment.negativePercentage}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Fullscreen Map Modal */}
      {isMapMaximized && (
        <div className="fixed inset-0 z-50 bg-black animate-in fade-in duration-150">
          {/* Floating Close/Minimize Button */}
          <button
            onClick={() => setIsMapMaximized(false)}
            className="absolute top-5 right-5 z-[1000] px-4 py-2.5 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full text-xs font-bold transition-all shadow-lg flex items-center gap-2 border border-slate-800 cursor-pointer backdrop-blur-md"
          >
            🗜️ Minimize Map
          </button>

          {/* Floating Route Title Info Panel */}
          <div className="absolute top-5 left-5 z-[1000] bg-slate-900/80 text-white p-4 rounded-2xl max-w-sm border border-slate-800 shadow-xl backdrop-blur-md">
            <h3 className="font-bold text-xs flex items-center gap-2">
              🗺️ Itinerary Route Mapper
            </h3>
            <p className="text-[10px] text-slate-350 mt-1 leading-relaxed">
              Street-level route & driving distances resolved for {trip.destination}.
            </p>
          </div>

          {/* Full-Screen Map Container */}
          <div className="w-full h-full relative">
            {resolvingCoords && (
              <div className="absolute inset-0 bg-white/90 z-[1001] flex flex-col items-center justify-center gap-2">
                <FaSpinner className="animate-spin text-2xl text-blue-600" />
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Geolocating route points...</p>
              </div>
            )}
            <div id="leaflet-map-fullscreen" className="w-full h-full z-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedTrip;
