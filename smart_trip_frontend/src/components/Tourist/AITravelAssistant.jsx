import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FaCommentDots, FaCalendarAlt, FaPlane, FaChevronLeft, 
  FaArrowUp, FaRobot, FaUser, FaSpinner 
} from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

const AITravelAssistant = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const fetchTripDetails = async () => {
    try {
      const response = await api.get(`/trips/${id}`);
      if (response.data?.success) {
        setTrip(response.data.data.trip);
      }
    } catch (err) {
      console.error("Failed to fetch trip details:", err);
      toast.error("Failed to load trip parameters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  useEffect(() => {
    // Scroll chat to bottom whenever chatHistory changes
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [trip?.chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userText = inputMessage;
    setInputMessage("");
    setSending(true);

    // Optimistically push the user message to localized state
    setTrip((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chatHistory: [
          ...prev.chatHistory,
          { role: "user", message: userText, timestamp: new Date() }
        ]
      };
    });

    try {
      const response = await api.post("/ai/chat", {
        tripId: id,
        message: userText
      });

      if (response.data?.success) {
        setTrip(response.data.data.trip);
      } else {
        toast.error("Failed to modify trip.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "An error occurred during regeneration.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-semibold">Opening AI Chat logs...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Trip not found.</p>
        <Link to="/Tourist/my-trips" className="text-blue-600 underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            to={`/Tourist/generated-trip/${trip._id}`}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <FaChevronLeft />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              🤖 AI Co-Pilot Chat
            </h1>
            <p className="text-xs text-slate-400">
              Trip to <span className="font-semibold text-slate-600">{trip.destination}</span>
            </p>
          </div>
        </div>

        <Link
          to={`/Tourist/generated-trip/${trip._id}`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          View Full Dashboard
        </Link>
      </header>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Panel: Chat messenger (60% on desktop, full scrollable) */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col border-r border-slate-200 bg-white h-full relative">
          
          {/* Chat Logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
              💡 <strong>AI Tip:</strong> You can request modifications dynamically! Try saying:
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-700">
                <li>"Add one more day"</li>
                <li>"Change hotel preference to luxury"</li>
                <li>"Make my dining plans completely vegetarian"</li>
                <li>"Reduce the budget to ₹20,000"</li>
              </ul>
            </div>

            {trip.chatHistory && trip.chatHistory.map((chat, idx) => {
              const isAi = chat.role === "assistant";
              return (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] ${isAi ? "self-start" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Icon profile */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 shadow-sm ${
                    isAi ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                  }`}>
                    {isAi ? <FaRobot /> : <FaUser />}
                  </div>

                  {/* Speech bubble */}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isAi 
                      ? "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200" 
                      : "bg-blue-600 text-white rounded-tr-none shadow-sm shadow-blue-100"
                  }`}>
                    <p className="whitespace-pre-line">{chat.message}</p>
                    <span className={`block text-[9px] mt-1 text-right ${isAi ? "text-slate-400" : "text-blue-200"}`}>
                      {new Date(chat.timestamp).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-3 max-w-[80%] self-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-750 flex items-center justify-center text-xs flex-shrink-0 animate-pulse">
                  <FaRobot />
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-150 rounded-tl-none text-xs flex items-center gap-2 text-slate-400">
                  <FaSpinner className="animate-spin" />
                  <span>AI Travel planner is regenerating your itinerary...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form input footer */}
          <form 
            onSubmit={handleSendMessage} 
            className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask the AI to change the trip..."
              disabled={sending}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 text-slate-800"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="w-10 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-750 flex items-center justify-center flex-shrink-0 disabled:bg-slate-350 transition-colors shadow-sm"
            >
              <FaArrowUp />
            </button>
          </form>

        </div>

        {/* Right Panel: Live rendering of day-wise schedule (60% desktop) */}
        <div className="hidden md:flex md:flex-col md:flex-1 h-full bg-slate-50 p-6 overflow-y-auto">
          <div className="max-w-xl w-full mx-auto space-y-4">
            
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" /> Active Trip Schedule
              </h2>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {trip.numberOfDays} Days Total
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Budget Limit</span>
                <span className="text-xs font-bold text-slate-800">₹{trip.budget.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Hotels</span>
                <span className="text-xs font-bold text-slate-800 truncate block px-1">{trip.accommodationPreference}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Food Prefer</span>
                <span className="text-xs font-bold text-slate-800 truncate block px-1">{trip.foodPreference}</span>
              </div>
            </div>

            {/* Vertical timeline of all days */}
            <div className="space-y-4">
              {trip.itinerary.map((dayPlan) => (
                <div key={dayPlan.day} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800 text-xs">Day {dayPlan.day}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{dayPlan.date || ""}</span>
                  </div>

                  <div className="space-y-3.5 relative pl-4 border-l border-slate-150 ml-1.5">
                    {dayPlan.schedule && dayPlan.schedule.map((item, idx) => (
                      <div key={idx} className="relative text-xs">
                        {/* Circle Bullet */}
                        <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                        
                        <div>
                          <span className="font-semibold text-blue-600 block text-[10px]">{item.time}</span>
                          <span className="font-bold text-slate-800 block mt-0.5">{item.activity}</span>
                          {item.description && <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default AITravelAssistant;
