import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, fetchUserProfile, logout } from "../redux/authSlice";
import { motion } from "framer-motion";
import { FaLock, FaEnvelope, FaShieldAlt } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

const loginSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      await dispatch(loginUser(data)).unwrap();
      const profileResult = await dispatch(fetchUserProfile()).unwrap();
      const userRole = profileResult?.data?.user?.role;
      if (userRole === "admin") {
        toast.success("Welcome back, Administrator.");
        navigate("/Admin");
      } else {
        toast.error("Access denied. Admin role required.");
        dispatch(logout());
      }
    } catch (err) {
      toast.error(err?.message || err?.error || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-slate-900/80 border border-slate-700/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-950/50 mb-4">
            <FaShieldAlt className="text-white text-xl" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Admin Portal</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to access administrative tools</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
                <FaEnvelope />
              </span>
              <input
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-slate-950 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 transition ${
                  errors.email ? "border-red-500 focus:ring-red-500/30" : "border-slate-700 focus:ring-rose-500/30 focus:border-rose-500/50"
                }`}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
                <FaLock />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-slate-950 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 transition ${
                  errors.password ? "border-red-500 focus:ring-red-500/30" : "border-slate-700 focus:ring-rose-500/30 focus:border-rose-500/50"
                }`}
              />
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-bold text-sm transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Verifying..." : "Secure Login"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-5">
          <button onClick={() => navigate("/")} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
