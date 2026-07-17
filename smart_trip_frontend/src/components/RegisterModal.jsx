import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast, ToastContainer } from "react-toastify";
import Input from "./Input";
import { registerSchema } from "../components/Utils/Validation";
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "./redux/authSlice";

export default function RegisterModal({ onSwitch, closeModal }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password");

  // Password strength logic
  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const widthPercent = (strength / 4) * 100;

  const strengthColor = [
    "bg-gray-300",   // 0
    "bg-red-500",    // 1
    "bg-orange-400", // 2
    "bg-yellow-400", // 3
    "bg-green-500",  // 4
  ][strength] || "bg-gray-300";

  const onSubmit = async (data) => {
    try {
      await dispatch(registerUser(data)).unwrap();
      toast.success("Registered successfully!");
      reset();
      onSwitch();
    } catch (err) {
      const errorMsg = err?.message || err?.error || "Registration failed";
      toast.error(errorMsg);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs overflow-y-auto p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {/* Left panel - Decorative graphic */}
          <div className="hidden md:flex md:w-[45%] flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden select-none">
            <span className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/10" />
            <span className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-white/10" />
            
            <div className="text-center space-y-4 relative z-10 flex flex-col items-center">
              <h3 className="text-2xl font-extrabold tracking-tight">Your Journey Starts Here</h3>
              <p className="text-blue-100 text-[11px] leading-relaxed max-w-[220px]">
                Create your account to design weather-aware itineraries, optimize budgets, and travel with our AI Consultant.
              </p>
              <div className="pt-4">
                <img
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?fm=jpg&q=90&w=400"
                  alt="travel graphic"
                  className="w-36 h-36 object-cover rounded-2xl shadow-md border border-white/20"
                  style={{ animation: "floatModal 5s ease-in-out infinite" }}
                />
              </div>
            </div>

            <style>{`
              @keyframes floatModal {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }
            `}</style>
          </div>

          {/* Right panel - Registration Form */}
          <div className="flex-1 p-6 md:p-8 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer text-sm"
            >
              ✕
            </button>

            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">Create Account</h2>
            <p className="text-slate-400 text-xs mb-6">Join us to start planning your custom itineraries.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <Input
                placeholder="Enter your name"
                {...register("name")}
                error={errors.name?.message}
              />

              <Input
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                error={errors.email?.message}
              />

              <Input
                type="tel"
                placeholder="Enter phone number"
                {...register("phone")}
                error={errors.phone?.message}
              />

              <Input
                placeholder="Enter your aadhaar number"
                {...register("aadhaar")}
                error={errors.aadhaar?.message}
              />

              <Input
                type="password"
                placeholder="Enter password"
                {...register("password")}
                error={errors.password?.message}
              />

              {/* Password strength bar with animation */}
              <div className="w-full bg-gray-200 h-1.5 rounded mt-1 overflow-hidden">
                <div
                  className={`h-1.5 rounded transition-all duration-500 ease-in-out ${strengthColor}`}
                  style={{ width: `${widthPercent}%` }}
                ></div>
              </div>

              {/* Live password hints */}
              {password && (
                <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                  {password.length < 8 && "• At least 8 characters. "} 
                  {!/[A-Z]/.test(password) && "• Include an uppercase letter. "} 
                  {!/[0-9]/.test(password) && "• Include a number. "} 
                  {!/[^A-Za-z0-9]/.test(password) && "• Include a special character. "}
                </p>
              )}

              <Input
                type="password"
                placeholder="Confirm password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:opacity-95 shadow-blue-100/50 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Registering..." : "Register"}
              </button>

              <div className="text-center pt-3 border-t border-slate-100 mt-4">
                <p className="text-slate-500 text-xs">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={onSwitch}
                    className="text-indigo-650 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}