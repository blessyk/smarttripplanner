import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FaLock, FaEye, FaEyeSlash, FaKey } from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

const schema = yup.object().shape({
  oldPassword: yup.string().required("Current password is required"),
  newPassword: yup.string().min(4, "Minimum 4 characters").required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm your password"),
});

export default function ChangePassword() {
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.put("/admin/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      if (res.data?.success) {
        toast.success("Password updated successfully!");
        reset();
      } else {
        toast.error(res.data?.message || "Failed to update password.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ id, label, showKey, registerKey, error }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
          <FaLock />
        </span>
        <input
          type={show[showKey] ? "text" : "password"}
          placeholder="••••••••"
          {...register(registerKey)}
          className={`w-full pl-9 pr-10 py-2.5 rounded-xl border bg-slate-950 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 transition ${
            error ? "border-red-500 focus:ring-red-500/30" : "border-slate-700 focus:ring-rose-500/30 focus:border-rose-500/50"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show[showKey] ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <h1 className="text-2xl font-extrabold text-slate-100 mb-1 tracking-tight">Change Password</h1>
      <p className="mb-7 text-slate-500 text-sm">Update your administrator account credentials</p>

      <div className="max-w-md">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-pink-950/60 border border-pink-800/60 flex items-center justify-center text-pink-400">
              <FaKey />
            </div>
            <div>
              <p className="text-slate-100 font-semibold text-sm">Security Settings</p>
              <p className="text-slate-500 text-xs">Use a strong password with mixed characters</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PasswordField
              id="old"
              label="Current Password"
              showKey="old"
              registerKey="oldPassword"
              error={errors.oldPassword?.message}
            />
            <PasswordField
              id="new"
              label="New Password"
              showKey="new"
              registerKey="newPassword"
              error={errors.newPassword?.message}
            />
            <PasswordField
              id="confirm"
              label="Confirm New Password"
              showKey="confirm"
              registerKey="confirmPassword"
              error={errors.confirmPassword?.message}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white text-sm font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
