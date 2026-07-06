import React, { useState, useEffect } from "react";
import { FaStar, FaTimes, FaSpinner } from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

export default function SubmitReviewModal({ trip, existingReview, isOpen, onClose, onReviewSubmitted }) {
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [destinationRating, setDestinationRating] = useState(5);
  const [destinationComment, setDestinationComment] = useState("");

  const [hotelName, setHotelName] = useState("");
  const [roomType, setRoomType] = useState("Standard Room");
  const [hotelRating, setHotelRating] = useState(5);
  const [hotelComment, setHotelComment] = useState("");

  const [roomName, setRoomName] = useState("Room Stay & Amenities");
  const [roomRating, setRoomRating] = useState(5);
  const [roomComment, setRoomComment] = useState("");

  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [restaurantComment, setRestaurantComment] = useState("");

  const [attractionName, setAttractionName] = useState("");
  const [attractionRating, setAttractionRating] = useState(5);
  const [attractionComment, setAttractionComment] = useState("");

  // Sync state with existingReview when modal opens
  useEffect(() => {
    if (isOpen && trip) {
      if (existingReview) {
        setDestinationRating(existingReview.destination?.rating || 5);
        setDestinationComment(existingReview.destination?.comment || "");

        setHotelName(existingReview.hotel?.name || "");
        setRoomType(existingReview.hotel?.roomType || "Standard Room");
        setHotelRating(existingReview.hotel?.rating || 5);
        setHotelComment(existingReview.hotel?.comment || "");

        setRoomName(existingReview.room?.name || "Room Stay & Amenities");
        setRoomRating(existingReview.room?.rating || 5);
        setRoomComment(existingReview.room?.comment || "");

        setRestaurantName(existingReview.restaurant?.name || "");
        setRestaurantRating(existingReview.restaurant?.rating || 5);
        setRestaurantComment(existingReview.restaurant?.comment || "");

        setAttractionName(existingReview.attraction?.name || "");
        setAttractionRating(existingReview.attraction?.rating || 5);
        setAttractionComment(existingReview.attraction?.comment || "");
      } else {
        setDestinationRating(5);
        setDestinationComment("");

        setHotelName(trip.recommendedHotels?.[0]?.hotelName || "");
        setRoomType("Standard Room");
        setHotelRating(5);
        setHotelComment("");

        setRoomName("Room Stay & Amenities");
        setRoomRating(5);
        setRoomComment("");

        setRestaurantName(trip.recommendedRestaurants?.[0]?.restaurantName || "");
        setRestaurantRating(5);
        setRestaurantComment("");

        setAttractionName(trip.attractions?.[0]?.placeName || "");
        setAttractionRating(5);
        setAttractionComment("");
      }
    }
  }, [isOpen, existingReview, trip]);

  if (!isOpen || !trip) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      tripId: trip._id,
      destination: {
        name: trip.destination,
        rating: destinationRating,
        comment: destinationComment
      }
    };

    if (hotelName) {
      payload.hotel = {
        name: hotelName,
        roomType,
        rating: hotelRating,
        comment: hotelComment
      };
      
      // If hotel is selected, room is also eligible for submission
      if (roomName) {
        payload.room = {
          name: roomName,
          rating: roomRating,
          comment: roomComment
        };
      }
    }

    if (restaurantName) {
      payload.restaurant = {
        name: restaurantName,
        rating: restaurantRating,
        comment: restaurantComment
      };
    }

    if (attractionName) {
      payload.attraction = {
        name: attractionName,
        rating: attractionRating,
        comment: attractionComment
      };
    }

    try {
      const response = await api.post("/reviews", payload);
      if (response.data?.success) {
        toast.success(existingReview ? "Review updated!" : "Review submitted!");
        onReviewSubmitted(response.data.data);
        onClose();
      } else {
        toast.error("Failed to save review.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "An error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, setRating }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none transition-all hover:scale-110"
          >
            <FaStar
              className={`text-lg ${
                star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {existingReview ? "Edit Your Feedback" : "Share Your Experience"}
            </h3>
            <p className="text-xs text-slate-400">Review your trip to {trip.destination}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-xl transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Destination Section */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700">📍 Overall Destination Experience</label>
              <StarRating rating={destinationRating} setRating={setDestinationRating} />
            </div>
            <textarea
              value={destinationComment}
              onChange={(e) => setDestinationComment(e.target.value)}
              placeholder="How was the overall destination? What did you enjoy the most?"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 min-h-[60px]"
            />
          </div>

          {/* Hotel Stay Section */}
          {trip.recommendedHotels?.length > 0 && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <label className="text-sm font-bold text-slate-700">🏨 Hotel & Accommodation</label>
                <StarRating rating={hotelRating} setRating={setHotelRating} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="">-- No hotel stayed / reviewed --</option>
                  {trip.recommendedHotels.map((h, index) => (
                    <option key={index} value={h.hotelName}>{h.hotelName}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Room Type (e.g. Deluxe Suite)"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  disabled={!hotelName}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>
              <textarea
                value={hotelComment}
                onChange={(e) => setHotelComment(e.target.value)}
                disabled={!hotelName}
                placeholder="Review the hotel stay, service, location, and ambiance..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 min-h-[60px] disabled:opacity-50 disabled:bg-slate-100"
              />
            </div>
          )}

          {/* Room Stay Section */}
          {hotelName && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-1 duration-200">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">🛏️ Room Stay & Amenities</label>
                <StarRating rating={roomRating} setRating={setRoomRating} />
              </div>
              <input
                type="text"
                placeholder="Room Reference Name (e.g. Room 402)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              />
              <textarea
                value={roomComment}
                onChange={(e) => setRoomComment(e.target.value)}
                placeholder="Review the room cleanliness, bed comfort, view, Wi-Fi speed, or private bathroom..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 min-h-[60px]"
              />
            </div>
          )}

          {/* Restaurant Section */}
          {trip.recommendedRestaurants?.length > 0 && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">🍽️ Dining & Restaurants</label>
                <StarRating rating={restaurantRating} setRating={setRestaurantRating} />
              </div>
              <select
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="">-- No restaurant reviewed --</option>
                {trip.recommendedRestaurants.map((r, index) => (
                  <option key={index} value={r.restaurantName}>{r.restaurantName}</option>
                ))}
              </select>
              <textarea
                value={restaurantComment}
                onChange={(e) => setRestaurantComment(e.target.value)}
                disabled={!restaurantName}
                placeholder="Review the food taste, restaurant ambiance, or local cuisines..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 min-h-[60px] disabled:opacity-50 disabled:bg-slate-100"
              />
            </div>
          )}

          {/* Attractions Section */}
          {trip.attractions?.length > 0 && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">🎡 Sightseeing & Attractions</label>
                <StarRating rating={attractionRating} setRating={setAttractionRating} />
              </div>
              <select
                value={attractionName}
                onChange={(e) => setAttractionName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="">-- No attraction reviewed --</option>
                {trip.attractions.map((a, index) => (
                  <option key={index} value={a.placeName}>{a.placeName}</option>
                ))}
              </select>
              <textarea
                value={attractionComment}
                onChange={(e) => setAttractionComment(e.target.value)}
                disabled={!attractionName}
                placeholder="Review the local sight, views, or entry experience..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 min-h-[60px] disabled:opacity-50 disabled:bg-slate-100"
              />
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:bg-slate-400"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Analyzing Sentiment...
                </>
              ) : (
                existingReview ? "Update Review" : "Submit Review"
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
