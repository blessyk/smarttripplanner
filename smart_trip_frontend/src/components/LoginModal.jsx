import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import Input from "./Input";
import "react-toastify/dist/ReactToastify.css";
import { loginUser, fetchUserProfile, logout } from "./redux/authSlice";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

// Yup validation schema
const loginSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

export default function LoginModal({ closeModal, onSwitch }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, user, loading } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onChange", 
  });

  const onSubmit = async (data) => {
    try {
      await dispatch(loginUser(data)).unwrap();
      const profileResult = await dispatch(fetchUserProfile()).unwrap();
      const userRole = profileResult?.data?.user?.role;
      
      if (userRole === "admin") {
        toast.error("Access denied. Please use the admin login portal.");
        dispatch(logout());
      } else {
        toast.success("Login successful!");
        closeModal();
        navigate("/Tourist");
      }
    } catch (err) {
      const errorMsg = err?.message || err?.error || "Invalid email or password";
      toast.error(errorMsg);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="relative bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
          
          {/* Left panel - Animated illustration of traveler handling ticket */}
          <div className="hidden md:flex md:w-[45%] flex-col justify-center items-center p-8 bg-gradient-to-br from-indigo-600 via-purple-650 to-pink-500 text-white relative overflow-hidden select-none">
            <span className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/10" />
            <span className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-white/10" />
            
            <div className="text-center space-y-4 relative z-10 flex flex-col items-center w-full">
              <h3 className="text-2xl font-extrabold tracking-tight">Welcome Back</h3>
              <p className="text-pink-100 text-[11px] leading-relaxed max-w-[220px]">
                Log in to access your customized AI itineraries, saved trip plans, and real-time weather alerts.
              </p>
              
              {/* Animated ticket handling */}
              <div className="pt-6 relative w-40 h-40 flex items-center justify-center">
                {/* Background Traveler Image */}
                <img
                  src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?fm=jpg&q=90&w=400"
                  alt="traveler illustration"
                  className="w-28 h-28 object-cover rounded-full shadow-lg border border-white/20"
                />
                
                {/* Floating login ticket card "handled" by traveler */}
                <div 
                  className="absolute bg-white text-slate-800 p-2.5 rounded-xl shadow-xl border border-slate-100/50 flex flex-col gap-1 text-[9px] w-28 font-bold text-left pointer-events-none"
                  style={{ animation: "handTicket 4s ease-in-out infinite" }}
                >
                  <div className="flex items-center gap-1.5 text-indigo-650 text-[10px]">
                    <span>🎫</span> <span>Boarding Pass</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden my-0.5">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-4/5 rounded-full animate-pulse" />
                  </div>
                  <div className="text-[7px] text-slate-400 uppercase tracking-wider">GATE 08 · READY</div>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes handTicket {
                0%, 100% { transform: translate(-12px, 35px) rotate(-6deg); }
                50% { transform: translate(-4px, 20px) rotate(6deg); }
              }
            `}</style>
          </div>

          {/* Right panel - Form */}
          <div className="flex-1 p-6 md:p-8 relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer text-sm"
            >
              ✕
            </button>

            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">Sign In</h2>
            <p className="text-slate-400 text-xs mb-6">Enter your travel credentials to proceed.</p>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                error={errors.email?.message}
              />

              <Input
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                error={errors.password?.message}
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-md shadow-blue-100/50 font-bold transition-all text-xs cursor-pointer ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="text-center pt-4 border-t border-slate-100 mt-6 space-y-2.5">
              <p className="text-slate-400 text-[10px]">New to Smart Trip Planner?</p>
              <button
                type="button"
                onClick={onSwitch}
                className="w-full py-2.5 rounded-xl border border-indigo-200/80 text-indigo-600 hover:bg-indigo-50/50 font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                Create New Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}