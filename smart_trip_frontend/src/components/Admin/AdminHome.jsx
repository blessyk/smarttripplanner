import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Card from "./Card";
import { FaUser, FaGlobe, FaStar, FaEnvelope, FaSpinner } from "react-icons/fa";
import UserVisitsChart from "./UserVisitsChart";
import api from "../Utils/api";
import { toast } from "react-toastify";

export default function AdminHome() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  
  const [metrics, setMetrics] = useState({ users: 0, testimonials: 0, contacts: 0 });
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  if (!isLoggedIn) return <Navigate to="/" />;

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        const [usersRes, testRes, contactRes, visitsRes] = await Promise.all([
          api.get("/admin/users?limit=1"),
          api.get("/testimonials"),
          api.get("/contacts"),
          fetch("/API/visits.json").then((r) => r.json()).catch(() => []),
        ]);

        setMetrics({
          users: usersRes.data?.pagination?.total || 0,
          testimonials: testRes.data?.data?.testimonials?.length || 0,
          contacts: contactRes.data?.data?.contacts?.length || 0,
        });
        setVisits(visitsRes);
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);



  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-extrabold text-slate-100 mb-1 tracking-tight">Admin Dashboard</h1>
      <p className="mb-7 text-slate-450 text-sm">
        Welcome back, <span className="text-rose-400 font-bold">{user?.name}</span>
      </p>
 
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card title="Total Users"   value={metrics.users}        icon={<FaUser />}     accent="indigo" trend="" onClick={() => navigate("/Admin/users")} />
            <Card title="Testimonials"  value={metrics.testimonials} icon={<FaStar />}     accent="amber"  trend="" onClick={() => navigate("/Admin/testimonials")} />
            <Card title="Contact Msgs"  value={metrics.contacts}     icon={<FaEnvelope />} accent="pink"   trend="" onClick={() => navigate("/Admin/contact")} />
          </div>
 
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-md">
              <h2 className="text-slate-100 font-semibold text-sm mb-1">User Visits</h2>
              <p className="text-slate-500 text-xs mb-4">Last 7 days</p>
              <UserVisitsChart data={visits} />
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-md">
              <h2 className="text-slate-100 font-semibold text-sm mb-1">Recent Activity</h2>
              <p className="text-slate-500 text-xs mb-4">Latest actions across the platform</p>
              <p className="text-slate-400 text-sm mt-4">Activity feed is dynamically tracking database updates.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
