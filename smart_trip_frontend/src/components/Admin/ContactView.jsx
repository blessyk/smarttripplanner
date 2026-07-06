import React, { useEffect, useState } from "react";
import View from "./View";
import Pagination from "./Pagination";
import Search from "./Search";
import useTable from "./Hooks/useTable";
import DetailModal from "./DetailModal";
import api from "../Utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ContactView() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContacts = async () => {
    try {
      const response = await api.get("/contacts");
      if (response.data?.success) {
        setContacts(response.data.data.contacts || []);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
      toast.error("Failed to fetch contact messages");
    }
  };

  // Fetch data
  useEffect(() => {
    fetchContacts();
  }, []);

  const handleDelete = async (contactItem) => {
    if (window.confirm(`Are you sure you want to delete this message from "${contactItem.name}"?`)) {
      try {
        const response = await api.delete(`/contacts/${contactItem._id}`);
        if (response.data?.success) {
          toast.success("Contact message deleted successfully!");
          fetchContacts();
        }
      } catch (err) {
        console.error("Failed to delete contact message:", err);
        toast.error(err.response?.data?.message || "Failed to delete message");
      }
    }
  };

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    currentRows,
  } = useTable(contacts, searchTerm, ["name", "email", "message"]);

  const columns = [
    { title: "Name", key: "name" },
    { title: "Email", key: "email" },
    { title: "Phone", key: "phone" },
    { title: "Message", key: "message" },
  ];

  const actions = [
    {
      label: "View",
      className: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60",
      onClick: (contact) => { setSelectedContact(contact); setIsModalOpen(true); },
    },
    {
      label: "Delete",
      className: "bg-red-950/60 text-red-400 border border-red-800/60 hover:bg-red-900/60",
      onClick: handleDelete,
    },
  ];

  return (
    <div className="p-4 bg-slate-950 min-h-screen">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Contact Messages</h1>
        <p className="text-slate-500 text-sm mt-1">Review and manage incoming contact form submissions</p>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="w-full mb-4">
        <Search
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search by name, email, or message"
        />
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
        title="Contact Message Details"
        data={selectedContact}
      />
    </div>
  );
}