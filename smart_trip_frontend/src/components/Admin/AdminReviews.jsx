import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { FaStar, FaSpinner, FaChevronDown, FaChevronUp, FaRobot, FaFilter } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import api from "../Utils/api";
import { toast } from "react-toastify";
import Pagination from "./Pagination";

const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

export default function AdminReviews() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalReviews: 0, avgRating: 0, sentimentCounts: { positive: 0, neutral: 0, negative: 0 } });
  const limit = 5;

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const searchParam = sentimentFilter === "all" ? "" : sentimentFilter;
      const response = await api.get(
        `/reviews/admin?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(searchParam)}`
      );
      if (response.data?.success) {
        setReviews(response.data.data || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
      toast.error("Failed to load user reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchReviews();
    }
  }, [isLoggedIn, currentPage, sentimentFilter]);

  if (!isLoggedIn) return <Navigate to="/" />;

  const totalReviews = stats.totalReviews;
  const avgDestinationRating = stats.avgRating;
  const sentimentCounts = stats.sentimentCounts;

  const positivePercent = totalReviews > 0 ? ((sentimentCounts.positive / totalReviews) * 100).toFixed(0) : 0;
  const chartData = [
    { name: "Positive", value: sentimentCounts.positive },
    { name: "Neutral",  value: sentimentCounts.neutral },
    { name: "Negative", value: sentimentCounts.negative },
  ].filter((item) => item.value > 0);

  const filteredReviews = reviews;

  const toggleExpand = (id) => setExpandedReviewId(expandedReviewId === id ? null : id);

  const StarRating = ({ rating }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar key={star} className={`text-xs ${star <= rating ? "text-amber-400" : "text-slate-700"}`} />
      ))}
    </div>
  );

  const subSections = (rev) => [
    { data: rev.hotel,      label: `Hotel: ${rev.hotel?.name} (${rev.hotel?.roomType})`, color: "border-blue-500",   emoji: "🏨" },
    { data: rev.room,       label: `Room: ${rev.room?.name}`,                             color: "border-violet-500", emoji: "🛏️" },
    { data: rev.restaurant, label: `Restaurant: ${rev.restaurant?.name}`,                 color: "border-amber-500",  emoji: "🍽️" },
    { data: rev.attraction, label: `Attraction: ${rev.attraction?.name}`,                 color: "border-teal-500",   emoji: "🎡" },
  ];

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Review Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor customer satisfaction and AI-analyzed sentiment data</p>
        </div>

        {loading ? (
          <div className="flex h-60 w-full items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="text-center">
              <FaSpinner className="animate-spin text-3xl text-rose-500 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Loading reviews & analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Feedbacks",   value: totalReviews,        sub: <><FaRobot className="inline mr-1" />AI analyzed</>, subColor: "text-violet-400" },
                { label: "Average Rating",    value: `${avgDestinationRating} / 5.0`, sub: <StarRating rating={Math.round(avgDestinationRating)} />, subColor: "" },
                { label: "Positive Sentiment",value: `${positivePercent}%`, sub: "Based on Gemini evaluation", subColor: "text-emerald-400", valueColor: "text-emerald-400" },
                { label: "Negative Sentiment",value: `${totalReviews > 0 ? ((sentimentCounts.negative / totalReviews) * 100).toFixed(0) : 0}%`, sub: "Flagged for action", subColor: "text-red-400", valueColor: "text-red-400" },
              ].map(({ label, value, sub, subColor, valueColor }) => (
                <div key={label} className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
                  <p className={`text-2xl font-extrabold mt-1 ${valueColor || "text-slate-100"}`}>{value}</p>
                  <div className={`text-[10px] mt-1 font-semibold ${subColor}`}>{sub}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Pie Chart */}
              <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-100">Sentiment Distribution</h3>
                {chartData.length > 0 ? (
                  <>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                            {chartData.map((entry, i) => (
                              <Cell key={i} fill={entry.name === "Positive" ? COLORS[0] : entry.name === "Negative" ? COLORS[2] : COLORS[1]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { label: "Positive", color: "bg-emerald-500", count: sentimentCounts.positive },
                        { label: "Neutral",  color: "bg-amber-500",   count: sentimentCounts.neutral },
                        { label: "Negative", color: "bg-red-500",     count: sentimentCounts.negative },
                      ].map(({ label, color, count }) => (
                        <div key={label} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded ${color}`} />
                            <span className="text-slate-400">{label}</span>
                          </div>
                          <span className="font-bold text-slate-200">{count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-44 items-center justify-center text-slate-500 text-xs italic">No data available.</div>
                )}
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <FaFilter className="text-slate-500 text-xs" /> Reviews ({filteredReviews.length})
                  </h3>
                  <div className="flex gap-1.5 flex-wrap">
                    {["all", "positive", "neutral", "negative"].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSentimentFilter(type);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all capitalize ${
                          sentimentFilter === type
                            ? "bg-rose-600 text-white border-rose-500"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[500px]">
                  {filteredReviews.length > 0 ? filteredReviews.map((rev) => {
                    const isExpanded = expandedReviewId === rev._id;
                    const userLabel = rev.userId?.name || "Deleted User";
                    const userEmail = rev.userId?.email || "";
                    const destinationLabel = rev.tripId?.destination || rev.destination.name;

                    return (
                      <div key={rev._id} className="p-4 hover:bg-slate-800/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-200 text-xs">{userLabel}</span>
                            <span className="text-[10px] text-slate-500 ml-2">({userEmail})</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Trip to: <span className="text-rose-400 font-semibold">{destinationLabel}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              rev.destination.sentiment?.label === "Positive"
                                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                                : rev.destination.sentiment?.label === "Negative"
                                ? "bg-red-950/60 text-red-400 border-red-800/60"
                                : "bg-amber-950/60 text-amber-400 border-amber-800/60"
                            }`}>
                              {rev.destination.sentiment?.label}
                            </span>
                            <button onClick={() => toggleExpand(rev._id)} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors">
                              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 space-y-1">
                          <div className="flex items-center gap-2">
                            <StarRating rating={rev.destination.rating} />
                            <span className="text-[10px] text-slate-500">{new Date(rev.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                          <p className="text-xs text-slate-400 italic">"{rev.destination.comment || "No comments written."}"</p>
                          {rev.destination.sentiment?.keywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {rev.destination.sentiment.keywords.map((kw, i) => (
                                <span key={i} className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">#{kw}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sub-Component Feedbacks</h4>
                            {subSections(rev).map(({ data: sub, label, color, emoji }) =>
                              sub?.name ? (
                                <div key={emoji} className={`text-xs space-y-1 border-l-2 ${color} pl-2`}>
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-300">{emoji} {label}</span>
                                    <StarRating rating={sub.rating} />
                                  </div>
                                  <p className="text-slate-500 italic">"{sub.comment || "No comment."}"</p>
                                  <div className="text-[9px] text-slate-600 flex justify-between">
                                    <span>AI: {sub.sentiment?.label}</span>
                                    <span>{sub.sentiment?.keywords?.join(", ")}</span>
                                  </div>
                                </div>
                              ) : null
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="p-8 text-center text-slate-500 text-xs italic">No matching reviews found.</div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-800 bg-slate-900/20">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
