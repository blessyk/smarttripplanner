import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCloudUploadAlt, FaSpinner, FaMapMarkerAlt, FaCompass, FaChevronRight, FaSync } from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

export default function ImagePrediction() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setPrediction(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setAnalyzing(true);

    try {
      const base64Image = await convertToBase64(imageFile);
      const mimeType = imageFile.type;

      const response = await api.post("/ai/predict-destination", {
        image: base64Image,
        mimeType
      });

      if (response.data?.success && response.data.data) {
        setPrediction(response.data.data);
        toast.success("Destination identified successfully!");
      } else {
        toast.error("Failed to analyze image.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "An error occurred during analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setPrediction(null);
  };

  const handlePlanTrip = () => {
    if (!prediction) return;
    navigate("/Tourist/TripPlanner", {
      state: { destination: `${prediction.destination}, ${prediction.location}` }
    });
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🧭 Explore by Image Identification
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload an image of any landmark or scenic spot to identify the destination and instantly plan your customized itinerary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Upload / Preview */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Tourist Spot Photo</h2>
            
            {imagePreview ? (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-100 aspect-video bg-slate-100 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Laser scan line animation during analysis */}
                {analyzing && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent top-0 animate-bounce shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ animationDuration: '2.5s' }} />
                )}

                {/* Cover overlay when scanning */}
                {analyzing && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold gap-2">
                    <FaSpinner className="animate-spin text-lg" /> Analyzing landmark details...
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-50/40"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                }`}
                onClick={() => document.getElementById("landmark-file-picker").click()}
              >
                <input
                  id="landmark-file-picker"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  className="hidden"
                />
                <FaCloudUploadAlt className="text-4xl text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-700">Drag and drop your photo here</p>
                <p className="text-[10px] text-slate-400 mt-1">or click to browse local storage (JPEG, PNG)</p>
              </div>
            )}

            {imagePreview && !analyzing && (
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-grow py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Analyze Image
                </button>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all"
                  title="Upload another image"
                >
                  <FaSync />
                </button>
              </div>
            )}

          </div>

          {/* Right Column: AI Analysis Result */}
          <div className="space-y-6">
            
            {/* If no analysis ran yet */}
            {!prediction && !analyzing && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm h-60 flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg">
                  <FaCompass />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-xs sm:text-sm">Awaiting Image Identification</h3>
                  <p className="text-[10px] text-slate-450 mt-1 max-w-xs mx-auto leading-normal">
                    AI will automatically analyze structural patterns, geographic features, and tourist records to identify the spot.
                  </p>
                </div>
              </div>
            )}

            {/* Loading placeholder */}
            {analyzing && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm h-60 flex flex-col items-center justify-center space-y-3 animate-pulse">
                <FaSpinner className="animate-spin text-2xl text-indigo-550" />
                <div>
                  <h3 className="font-bold text-slate-650 text-xs">Matching Visual Features...</h3>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Retrieving architectural records and matching descriptions.
                  </p>
                </div>
              </div>
            )}

            {/* Display Results */}
            {prediction && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="border-b border-slate-100 pb-3">
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-150">
                    Landmark Identified
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-800 mt-2">{prediction.destination}</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                    <FaMapMarkerAlt className="text-red-400" /> {prediction.location}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spot Description</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 border border-slate-100 p-3.5 rounded-2xl italic">
                    "{prediction.description}"
                  </p>
                </div>

                <button
                  onClick={handlePlanTrip}
                  className="w-full py-3 bg-gradient-to-r from-blue-650 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Plan a Trip to this Destination <FaChevronRight className="text-[10px]" />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
