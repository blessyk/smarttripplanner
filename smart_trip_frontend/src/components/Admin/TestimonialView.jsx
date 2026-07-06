import React, { useState, useEffect } from "react";
import View from "./View";
import Pagination from "./Pagination";
import Search from "./Search";
import useTable from "./Hooks/useTable";
import DetailModal from "./DetailModal";
import api from "../Utils/api";
import Button from "../Button";
import { toast, ToastContainer } from "react-toastify";
import { FaCloudUploadAlt, FaTrashAlt, FaSpinner, FaTimes } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

export default function TestimonialsView() {
  const [testimonials, setTestimonials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Form states for creating a new testimonial
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({ name: "", location: "", text: "", rating: 5, image: "" });
  const [imageInputMethod, setImageInputMethod] = useState("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchTestimonials = async () => {
    try {
      const response = await api.get(
        `/testimonials?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`
      );
      if (response.data?.success) {
        setTestimonials(response.data.data.testimonials || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
      }
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
      toast.error("Failed to fetch testimonials");
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [currentPage, searchTerm]);

  const handleDelete = async (testimonialItem) => {
    if (window.confirm(`Are you sure you want to delete the testimonial from "${testimonialItem.name}"?`)) {
      try {
        const response = await api.delete(`/testimonials/${testimonialItem._id}`);
        if (response.data?.success) {
          toast.success("Testimonial deleted successfully!");
          fetchTestimonials();
        }
      } catch (err) {
        console.error("Failed to delete testimonial:", err);
        toast.error(err.response?.data?.message || "Failed to delete testimonial");
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data?.success) {
        setNewTestimonial((prev) => ({ ...prev, image: response.data.url }));
        toast.success("Image uploaded successfully!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddUrl = () => {
    if (!urlInput) return;
    if (!urlInput.startsWith("http://") && !urlInput.startsWith("https://")) {
      toast.error("Please provide a valid HTTP/HTTPS URL");
      return;
    }
    setNewTestimonial((prev) => ({ ...prev, image: urlInput }));
    toast.success("Image URL applied!");
  };

  const handleCreateTestimonial = async (e) => {
    e.preventDefault();
    if (!newTestimonial.name || !newTestimonial.location || !newTestimonial.text) {
      toast.error("Please fill in name, location, and message text");
      return;
    }

    try {
      const response = await api.post("/testimonials", newTestimonial);
      if (response.data?.success) {
        toast.success("Testimonial added successfully!");
        setIsAddModalOpen(false);
        setNewTestimonial({ name: "", location: "", text: "", rating: 5, image: "" });
        setUrlInput("");
        fetchTestimonials();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add testimonial");
    }
  };

  const currentRows = testimonials;

  const columns = [
    { title: "Name", key: "name" },
    { title: "Location", key: "location" },
    { title: "Rating", key: "rating" },
    { title: "Message", key: "text" },
  ];

  const actions = [
    {
      label: "View",
      className: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60",
      onClick: (testimonial) => { setSelectedTestimonial(testimonial); setIsModalOpen(true); },
    },
    {
      label: "Delete",
      className: "bg-red-950/60 text-red-400 border border-red-800/60 hover:bg-red-900/60",
      onClick: handleDelete,
    },
  ];

  return (
    <div className="p-4 bg-slate-950 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Testimonials</h1>
        <p className="text-slate-500 text-sm mt-1">Manage public testimonials displayed on the landing page</p>
      </div>

      {/* Top Bar with Search & Add Button */}
      <div className="flex gap-2 mb-4">
        <Search
          searchTerm={searchTerm}
          setSearchTerm={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by name, location, or text"
        />
        <div className="ml-auto flex-shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            + Add Testimonial
          </button>
        </div>
      </div>

      {/* Table */}
      <View columns={columns} data={currentRows} actions={actions} />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Detail View Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Testimonial Details"
        data={selectedTestimonial}
      />

      {/* Add Testimonial Form Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100">Add Testimonial</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateTestimonial} className="flex-grow overflow-y-auto p-5 space-y-4">
              {[
                { label: "Author Name", key: "name", placeholder: "e.g. Mike Taylor", type: "text" },
                { label: "Location / Role", key: "location", placeholder: "e.g. Mumbai, Maharashtra", type: "text" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                  <input
                    type={type}
                    required
                    value={newTestimonial[key]}
                    onChange={(e) => setNewTestimonial((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-700 rounded-xl text-sm text-slate-200 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder-slate-600"
                  />
                </div>
              ))}

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rating</label>
                <select
                  value={newTestimonial.rating}
                  onChange={(e) => setNewTestimonial((prev) => ({ ...prev, rating: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-700 rounded-xl text-sm text-slate-200 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                >
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n !== 1 ? "s" : ""}</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Message</label>
                <textarea
                  required
                  value={newTestimonial.text}
                  onChange={(e) => setNewTestimonial((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="Write feedback..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-700 rounded-xl text-sm text-slate-200 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder-slate-600 resize-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Author Picture</label>
                <div className="flex gap-4 mb-3">
                  {["upload", "url"].map((method) => (
                    <label key={method} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 cursor-pointer capitalize">
                      <input type="radio" name="imageInputMethodModal" checked={imageInputMethod === method} onChange={() => setImageInputMethod(method)} className="accent-rose-500" />
                      {method === "upload" ? "Upload File" : "Provide URL"}
                    </label>
                  ))}
                </div>

                {imageInputMethod === "upload" ? (
                  <div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="modal-browse-input" disabled={uploading} />
                    <label
                      htmlFor="modal-browse-input"
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${
                        uploading ? "border-slate-700 bg-slate-800/50 cursor-not-allowed" : "border-slate-700 hover:border-rose-500/60 hover:bg-rose-950/10"
                      }`}
                    >
                      {uploading ? (
                        <><FaSpinner className="text-xl text-slate-500 animate-spin mb-1" /><span className="text-[10px] text-slate-500">Uploading...</span></>
                      ) : (
                        <><FaCloudUploadAlt className="text-2xl text-slate-500 mb-1" /><span className="text-[10px] text-slate-500">Click to browse file</span></>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Paste avatar URL..."
                      className="flex-1 px-3 py-2 border border-slate-700 rounded-xl text-xs bg-slate-950 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                    <button type="button" onClick={handleAddUrl} className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors">
                      Apply
                    </button>
                  </div>
                )}

                {newTestimonial.image && (
                  <div className="mt-3 flex items-center gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
                    <img src={newTestimonial.image} alt="Avatar Preview" className="w-10 h-10 rounded-full object-cover border border-slate-700" onError={(e) => { e.target.src = "https://randomuser.me/api/portraits/men/32.jpg"; }} />
                    <span className="text-xs text-slate-500 truncate flex-1">{newTestimonial.image}</span>
                    <button type="button" onClick={() => setNewTestimonial((prev) => ({ ...prev, image: "" }))} className="p-1 text-red-400 hover:bg-red-950/40 rounded-lg transition-colors">
                      <FaTrashAlt className="text-xs" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800 gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition shadow-md">
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}