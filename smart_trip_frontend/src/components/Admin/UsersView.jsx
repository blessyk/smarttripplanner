import React, { useState, useEffect } from "react";
import View from "./View";
import Pagination from "./Pagination";
import Search from "./Search";
import api from "../Utils/api";
import DetailModal from "./DetailModal";
import { toast } from "react-toastify";

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;

  const fetchUsers = async (page, search) => {
    try {
      const response = await api.get(
        `/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      );
      if (response.data?.success) {
        setUsers(response.data.data.users || []);
        setCurrentPage(response.data.pagination?.page || 1);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error(err.response?.data?.message || "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", aadharNumber: "" });
  const [editUserId, setEditUserId] = useState("");

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/admin/users/${editUserId}`, editForm);
      if (response.data?.success) {
        toast.success("User updated successfully!");
        setIsEditModalOpen(false);
        fetchUsers(currentPage, searchTerm);
      } else {
        toast.error("Failed to update user details.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update user.");
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      if (response.data?.success) {
        toast.success("User deleted successfully!");
        fetchUsers(currentPage, searchTerm);
      } else {
        toast.error("Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const columns = [
    { title: "Name", key: "name" },
    { title: "Email", key: "email" },
    { title: "Phone Number", key: "phone" },
    { title: "Aadhar", key: "aadharNumber" },
    { title: "Role", key: "role" },
  ];

  const actions = [
    {
      label: "View",
      className: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60",
      onClick: (user) => { setSelectedUser(user); setIsModalOpen(true); },
    },
    {
      label: "Edit",
      className: "bg-blue-950/60 text-blue-400 border border-blue-800/60 hover:bg-blue-900/60",
      onClick: (user) => {
        setEditUserId(user._id);
        setEditForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          aadharNumber: user.aadharNumber || ""
        });
        setIsEditModalOpen(true);
      },
    },
    {
      label: "Delete",
      className: "bg-red-950/60 text-red-400 border border-red-800/60 hover:bg-red-900/60",
      onClick: (user) => {
        if (user.role === 'admin') {
          toast.error("Cannot delete an administrator account!");
          return;
        }
        if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
          handleDeleteUser(user._id);
        }
      },
    },
  ];

  return (
    <div className="p-4 bg-slate-955 min-h-screen text-slate-100">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Users</h1>
        <p className="text-slate-500 text-sm mt-1">Browse and manage registered user accounts</p>
      </div>
      <div className="w-full">
        <Search
          searchTerm={searchTerm}
          setSearchTerm={handleSearchChange}
          placeholder="Search by name, email, phone, or Aadhar"
        />
      </div>

      {/* Table */}
      <View columns={columns} data={users} actions={actions} />

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
        title="User Details"
        data={selectedUser}
      />

      {/* Edit Form Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-250 text-xs">
            <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100">Edit User Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-300 font-bold">✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                <input
                  type="text"
                  required
                  pattern="\d{10}"
                  title="Exactly 10 digits"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aadhar Number</label>
                <input
                  type="text"
                  required
                  pattern="\d{12}"
                  title="Exactly 12 digits"
                  value={editForm.aadharNumber}
                  onChange={(e) => setEditForm({ ...editForm, aadharNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}