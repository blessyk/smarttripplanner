import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { 
  FaCalendarAlt, FaMapMarkerAlt, FaWallet, FaUsers, 
  FaSuitcase, FaHotel, FaUtensils, FaCar, FaInfoCircle, FaSpinner 
} from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

const schema = yup.object().shape({
  destination: yup.string().required("Destination is required"),
  startDate: yup.date().required("Start date is required"),
  endDate: yup
    .date()
    .min(yup.ref("startDate"), "End date must be after start date")
    .required("End date is required"),
  budget: yup.number().typeError("Budget must be a number").positive("Budget must be positive").required("Budget is required"),
  travelers: yup.number().typeError("Travelers must be a number").positive().integer().default(1).required("Number of travelers is required"),
  tripType: yup.string().required("Trip type is required"),
  accommodationPreference: yup.string().required("Accommodation preference is required"),
  foodPreference: yup.string().required("Food preference is required"),
  transportationPreference: yup.string().required("Transportation preference is required"),
  specialRequirements: yup.string().nullable()
});

const placeTypesList = [
  "Beach", "Hiking", "Trekking", "Adventure", "Nature", "Wildlife", "Zoo", 
  "Amusement Park", "Boating", "Historical Places", "Museums", "Shopping", 
  "Food Exploration", "Religious Places", "Photography", "Night Life"
];

const TripPlanner = () => {
  const [dbDestinations, setDbDestinations] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const stages = [
    "Locating destination coordinates...",
    "Retrieving local weather forecasts via Open-Meteo...",
    "Analyzing historical tourist reviews and sentiment...",
    "Optimizing budget allocation variables...",
    "Compiling day-by-day travel itinerary with OpenAI...",
    "Saving customized planner data..."
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
      }, 2500);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await api.get("/destinations");
        if (response.data?.success) {
          setDbDestinations(response.data.data.destinations || []);
        }
      } catch (err) {
        console.error("Failed to fetch destinations for autocomplete:", err);
      }
    };
    fetchDestinations();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      destination: location.state?.destination || "",
      travelers: 1,
      tripType: "Solo",
      accommodationPreference: "Standard",
      foodPreference: "Local Cuisine",
      transportationPreference: "Public Transport"
    }
  });

  const handleInterestToggle = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        interests: selectedInterests
      };
      
      const response = await api.post("/ai/generate-trip", payload);
      if (response.data?.success) {
        const tripId = response.data.data.trip._id;
        toast.success("AI Trip Planner has generated your trip successfully!");
        navigate(`/Tourist/generated-trip/${tripId}`);
      } else {
        toast.error("Failed to generate trip. Try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong during trip generation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-6 bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/20 min-h-screen">
      {loading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center max-w-md w-full mx-4 text-center">
            <FaSpinner className="animate-spin text-5xl text-blue-400 mb-4" />
            <h3 className="text-xl font-extrabold mb-2">Creating Your Trip</h3>
            <p className="text-blue-200 text-sm animate-pulse h-12 flex items-center justify-center font-medium">
              {stages[loadingStage]}
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Autocomplete Datalist */}
      <datalist id="db-destinations-list">
        {dbDestinations.map((dest) => (
          <option key={dest._id} value={dest.name} />
        ))}
      </datalist>

      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            🌍 AI Smart Trip Planner
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Enter your destination and travel details. Our AI travel architect will craft a customized, weather-aware, budget-optimized travel package.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-md border border-slate-150/60 p-6 md:p-8 space-y-6 hover:shadow-lg transition-all duration-300">
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Destination */}
            <div className="relative">
              <label className="block mb-1 text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-blue-500" /> Destination *
              </label>
              <input
                {...register("destination")}
                placeholder="Enter city, region or country..."
                list="db-destinations-list"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.destination ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.destination && (
                <p className="text-red-500 text-xs mt-1">{errors.destination.message}</p>
              )}
            </div>

            {/* Travelers */}
            <div>
              <label className="block mb-1 text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                <FaUsers className="text-blue-500" /> Number of Travelers *
              </label>
              <input
                type="number"
                {...register("travelers")}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.travelers ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.travelers && (
                <p className="text-red-500 text-xs mt-1">{errors.travelers.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label className="block mb-1 text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                <FaCalendarAlt className="text-blue-500" /> Start Date *
              </label>
              <input
                type="date"
                {...register("startDate")}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block mb-1 text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                <FaCalendarAlt className="text-blue-500" /> End Date *
              </label>
              <input
                type="date"
                {...register("endDate")}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Budget */}
            <div>
              <label className="block mb-1 text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                <FaWallet className="text-blue-500" /> Total Budget (INR) *
              </label>
              <input
                type="number"
                {...register("budget")}
                placeholder="e.g. 50000"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.budget ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.budget && (
                <p className="text-red-500 text-xs mt-1">{errors.budget.message}</p>
              )}
            </div>

            {/* Trip Type */}
            <div>
              <label className="block mb-1 text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                <FaSuitcase className="text-blue-500" /> Trip Type *
              </label>
              <select
                {...register("tripType")}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Solo">Solo</option>
                <option value="Friends">Friends</option>
                <option value="Family">Family</option>
                <option value="Couple">Couple</option>
                <option value="Kids">With Kids</option>
                <option value="Business">Business</option>
              </select>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="border-t border-slate-150 pt-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">🏠 Preferences & Settings</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Accommodation */}
              <div>
                <label className="block mb-1 text-slate-750 font-semibold text-sm flex items-center gap-1.5">
                  <FaHotel className="text-blue-500" /> Accommodation
                </label>
                <select
                  {...register("accommodationPreference")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Budget">Budget</option>
                  <option value="Standard">Standard</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Resort">Resort</option>
                  <option value="Homestay">Homestay</option>
                </select>
              </div>

              {/* Food */}
              <div>
                <label className="block mb-1 text-slate-750 font-semibold text-sm flex items-center gap-1.5">
                  <FaUtensils className="text-blue-500" /> Food Preference
                </label>
                <select
                  {...register("foodPreference")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Local Cuisine">Local Cuisine</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              {/* Transportation */}
              <div>
                <label className="block mb-1 text-slate-750 font-semibold text-sm flex items-center gap-1.5">
                  <FaCar className="text-blue-500" /> Transportation
                </label>
                <select
                  {...register("transportationPreference")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Public Transport">Public Transport</option>
                  <option value="Self Drive Car">Self Drive Car</option>
                  <option value="Private Taxi">Private Taxi</option>
                  <option value="Flight + Local Transit">Flight + Local Transit</option>
                  <option value="Trains">Trains</option>
                </select>
              </div>
            </div>
          </div>

          {/* Place Types interests */}
          <div className="border-t border-slate-150 pt-6">
            <label className="block mb-2 text-slate-800 font-bold text-sm">
              🌟 Interested Place Types
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {placeTypesList.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all duration-150 border ${
                      selected
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 shadow-xs font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50"
                    }`}
                  >
                    {selected ? "✓ " : "+ "} {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Requirements */}
          <div className="border-t border-slate-150 pt-6">
            <label className="block mb-1 text-slate-750 font-semibold text-sm flex items-center gap-1.5">
              <FaInfoCircle className="text-blue-500" /> Special Requirements (Optional)
            </label>
            <textarea
              {...register("specialRequirements")}
              rows={3}
              placeholder="e.g. wheelchair accessibility, traveling with elderly, strict dinner timings, prefer hiking in morning..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-750 hover:to-indigo-750 text-white rounded-xl transition-all font-bold shadow-md shadow-blue-100 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            Create My AI Itinerary
          </button>
        </form>
      </div>
    </div>
  );
};

export default TripPlanner;