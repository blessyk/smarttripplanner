import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaMapMarkerAlt, FaStar, FaRegClock, FaLandmark, FaHotel, 
  FaUtensils, FaCalendarAlt, FaSearch, FaSpinner, FaSuitcase, 
  FaPlus, FaDollarSign, FaTicketAlt, FaInfoCircle, FaCalendarCheck 
} from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

const DestinationSearch = () => {
  const navigate = useNavigate();
  const [destinationInput, setDestinationInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState("attractions");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [lastSearch, setLastSearch] = useState("");

  // Saved trip dates modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStartDate, setSaveStartDate] = useState("");
  const [saveEndDate, setSaveEndDate] = useState("");
  const [savingTrip, setSavingTrip] = useState(false);

  const autocompleteRef = useRef(null);
  const debounceRef = useRef(null);
  const [aiProvider, setAiProvider] = useState("gemini");

  // Fetch active AI provider on load
  useEffect(() => {
    const fetchAiProvider = async () => {
      try {
        const response = await api.get("/auth/ai-provider");
        if (response.data?.success && response.data.data) {
          setAiProvider(response.data.data);
        }
      } catch (err) {
        console.error("Failed to load active AI provider settings:", err);
      }
    };
    fetchAiProvider();
  }, []);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Teleport API Autocomplete Suggestion Logic
  const handleInputChange = (e) => {
    const value = e.target.value;
    setDestinationInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.teleport.org/api/cities/?search=${encodeURIComponent(value)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data._embedded && data._embedded["city:search-results"]) {
            const list = data._embedded["city:search-results"]
              .map((item) => item.matching_full_name)
              .slice(0, 5);
            setSuggestions(list);
            setShowSuggestions(list.length > 0);
          }
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    }, 300);
  };

  const handleSuggestionClick = (val) => {
    setDestinationInput(val);
    setSuggestions([]);
    setShowSuggestions(false);
    performSearch(val, activeTab);
  };

  const performSearch = async (destination, tab) => {
    if (!destination.trim()) {
      toast.error("Please enter a destination to explore.");
      return;
    }

    setLoading(true);
    setLastSearch(destination);

    try {
      const response = await api.post("/ai/explore-destination", {
        destination,
        category: tab
      });

      if (response.data?.success) {
        setResults(response.data.data);
      } else {
        toast.error("Could not load AI recommendations. Try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to query the AI Explorer API.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (destinationInput.trim()) {
      performSearch(destinationInput, tabName);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(destinationInput, activeTab);
  };

  // Preset location cards
  const presets = [
    { name: "Tokyo, Japan", emoji: "🗼" },
    { name: "Rome, Italy", emoji: "🏛️" },
    { name: "Paris, France", emoji: "🗼" },
    { name: "Reykjavik, Iceland", emoji: "🌋" }
  ];

  // Save itinerary to MongoDB database logic
  const handleOpenSaveModal = () => {
    if (activeTab !== "itinerary" || !results) return;
    setShowSaveModal(true);
  };

  const handleSaveConfirmedTrip = async () => {
    if (!saveStartDate || !saveEndDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (new Date(saveStartDate) > new Date(saveEndDate)) {
      toast.error("Start date must be before end date.");
      return;
    }

    setSavingTrip(true);
    try {
      const start = new Date(saveStartDate);
      const end = new Date(saveEndDate);
      const numberOfDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

      // Pre-map itinerary activities from explore response to save schema format
      const mockSchedule = results.days.map((dayData, idx) => ({
        day: dayData.day,
        date: new Date(start.getTime() + idx * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        schedule: dayData.activities.map((act) => ({
          time: act.time || "09:00 AM",
          activity: act.name,
          description: act.description,
          location: lastSearch
        }))
      }));

      const payload = {
        destination: lastSearch,
        startDate: saveStartDate,
        endDate: saveEndDate,
        numberOfDays,
        budget: 25000, // default placeholder
        tripType: "Solo",
        travelers: 1,
        interests: ["Sightseeing"],
        accommodationPreference: "Standard",
        foodPreference: "Local Cuisine",
        itinerary: mockSchedule,
        attractions: [
          { placeName: `${lastSearch} Main Heritage`, category: "Historical", bestTimeToVisit: "Morning", estimatedDuration: "3 hours" }
        ],
        recommendedHotels: [
          { hotelName: `${lastSearch} Cozy Stay`, rating: 4.6, estimatedCost: 3500, location: lastSearch, reasonForRecommendation: "Highly recommended lodging from explorer portal" }
        ],
        recommendedRestaurants: [
          { restaurantName: `${lastSearch} Bistro`, cuisine: "Local Cuisine", estimatedCost: 700, specialty: "Chef Local Special Plate" }
        ],
        budgetBreakdown: {
          accommodationBudget: 10000,
          foodBudget: 6000,
          transportationBudget: 4000,
          activityBudget: 3000,
          emergencyBudget: 2000
        },
        weatherInfo: {
          forecast: "Clear skies and pleasant climate",
          warnings: "None",
          recommendations: "Pack standard travel gear"
        },
        riskAnalysis: {
          riskLevel: "Low",
          reason: "Standard travel safety profiles",
          recommendation: "Keep electronic copies of IDs"
        }
      };

      const response = await api.post("/trips", payload);
      if (response.data?.success) {
        toast.success(`Successfully saved trip to ${lastSearch}!`);
        setShowSaveModal(false);
        navigate(`/Tourist/generated-trip/${response.data.data.trip._id}`);
      } else {
        toast.error("Failed to save trip plan.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to write trip plan to database.");
    } finally {
      setSavingTrip(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Title Hero */}
        <header className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
            🧭 Global AI Destination Explorer
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Search any city globally. Tab through top attractions, hotels, local cuisine, and custom 3-day itineraries generated on-demand.
          </p>
        </header>

        {/* Search Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row gap-3" ref={autocompleteRef}>
            <div className="relative flex-grow">
              <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-blue-500 text-sm" />
              <input
                type="text"
                placeholder="Search Kyoto, Paris, Venice, Maui..."
                value={destinationInput}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-850"
              />
              
              {/* Autocomplete List */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full text-left px-4 py-3 text-xs text-slate-650 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                    >
                      <FaMapMarkerAlt className="text-slate-400" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-200 transition-colors"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              <span>Explore</span>
            </button>
          </form>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 divide-x divide-slate-100 shadow-xs">
          <button
            onClick={() => handleTabChange("attractions")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === "attractions" 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FaLandmark /> Attractions
          </button>
          <button
            onClick={() => handleTabChange("hotels")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === "hotels" 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FaHotel /> Hotels
          </button>
          <button
            onClick={() => handleTabChange("food")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === "food" 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FaUtensils /> Local Food
          </button>
          <button
            onClick={() => handleTabChange("itinerary")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === "itinerary" 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FaCalendarAlt /> Itinerary
          </button>
        </div>

        {/* Explore Results Display Area */}
        <div className="space-y-4">
          
          {loading ? (
            /* Skeleton Shimmer Loaders */
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <FaSpinner className="animate-spin text-blue-600" />
                <span className="text-xs text-slate-500 font-semibold">
                  Consulting {aiProvider === "groq" ? "Groq (Llama 3)" : "Gemini"} AI travel models for local data...
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden h-40 animate-pulse flex">
                    <div className="w-1/3 bg-slate-200" />
                    <div className="p-4 flex-1 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !results ? (
            /* Welcome / Preset suggestions panel */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
              <h3 className="text-base font-bold text-slate-800 mb-2">⭐ Discover Popular Cities</h3>
              <p className="text-slate-500 text-xs mb-6">Select a global hotspot to explore or type your destination above:</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDestinationInput(p.name);
                      performSearch(p.name, activeTab);
                    }}
                    className="p-4 border border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/20 text-center transition-all duration-200 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform inline-block mb-1.5">{p.emoji}</span>
                    <h4 className="font-bold text-xs text-slate-800 truncate">{p.name.split(",")[0]}</h4>
                    <span className="text-[10px] text-slate-400">{p.name.split(",")[1]?.trim() || ""}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : activeTab === "itinerary" ? (
            /* SPECIALIZED ITINERARY TIMELINE VIEW */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex justify-between items-center shadow-sm">
                <div>
                  <h2 className="text-xl font-bold">{results.title || `3 Days in ${lastSearch}`}</h2>
                  <p className="text-blue-100 text-xs mt-1 leading-relaxed max-w-xl">{results.overview}</p>
                </div>

                <button
                  onClick={handleOpenSaveModal}
                  className="px-4 py-2.5 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                >
                  <FaCalendarCheck /> Save Trip Plan
                </button>
              </div>

              <div className="space-y-4">
                {results.days && results.days.map((dayData) => (
                  <div key={dayData.day} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span>Day {dayData.day}: {dayData.theme || "Exploration"}</span>
                    </h3>

                    <div className="space-y-4 relative pl-4 border-l border-slate-200 ml-1.5">
                      {dayData.activities && dayData.activities.map((act, idx) => (
                        <div key={idx} className="relative text-xs">
                          <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-blue-600 text-[10px]">{act.time}</span>
                            <h4 className="font-bold text-slate-800 text-xs leading-snug">{act.name}</h4>
                            <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{act.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STANDARD CARDS GRID FOR ATTRACTIONS, HOTELS, FOOD */
            <div className="grid md:grid-cols-2 gap-6">
              {results.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  {/* Cover Photo */}
                  <div className="h-40 bg-slate-100 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      ★ {item.rating || 4.5}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="font-bold text-slate-800 text-sm leading-snug">{item.name}</h3>
                        <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex-shrink-0">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{item.description}</p>
                    </div>

                    {/* Metadata Section */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-400">
                      {activeTab === "attractions" && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <FaRegClock className="text-slate-400" />
                            <span><strong>Best Time:</strong> {item.bestTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FaTicketAlt className="text-slate-400" />
                            <span><strong>Fee:</strong> {item.fee}</span>
                          </div>
                        </>
                      )}

                      {activeTab === "hotels" && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <FaDollarSign className="text-slate-400" />
                            <span><strong>Price Guide:</strong> {item.priceRange || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FaMapMarkerAlt className="text-slate-400" />
                            <span><strong>Location:</strong> {item.locationSummary || "N/A"}</span>
                          </div>
                        </>
                      )}

                      {activeTab === "food" && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <FaUtensils className="text-slate-400" />
                            <span><strong>Recommended places:</strong> {(item.recommendedPlaces || []).join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FaInfoCircle className="text-slate-400" />
                            <span><strong>Key ingredients:</strong> {(item.keyIngredients || []).join(", ")}</span>
                          </div>
                        </>
                      )}

                      {/* Highlights / Amenities tags list */}
                      {(item.highlights || item.amenities) && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {(item.highlights || item.amenities).slice(0, 3).map((tag, tIdx) => (
                            <span key={tIdx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* CHOOSE DATE MODAL DIALOG ON TRIP CONFIRM */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center text-slate-800">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <FaSuitcase className="text-blue-500" /> Confirm Saved Dates
              </h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-snug">
              Choose your travel dates. This 3-day itinerary will be mapped to the dates you select and saved directly in your dashboard.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-[11px] font-bold text-slate-500">Start Date</label>
                <input
                  type="date"
                  value={saveStartDate}
                  onChange={(e) => setSaveStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-[11px] font-bold text-slate-500">End Date</label>
                <input
                  type="date"
                  value={saveEndDate}
                  onChange={(e) => setSaveEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSaveConfirmedTrip}
              disabled={savingTrip}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:bg-slate-300"
            >
              {savingTrip ? <FaSpinner className="animate-spin" /> : <FaCalendarCheck />}
              <span>Save as Trip & Explore</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DestinationSearch;