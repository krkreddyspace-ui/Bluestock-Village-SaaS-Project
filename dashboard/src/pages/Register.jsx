import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  Database,
} from "lucide-react";
import { fetchApi } from "../utils/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    businessName: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.message === "EMAIL_EXISTS"
          ? "This email is already registered."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-6">
        <div className="glass-card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Registration Successful!
          </h2>
          <p className="text-slate-400 mb-8">
            Your account has been created and is pending admin approval. You'll
            be able to log in once approved.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-brand-600/20"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-6">
      <div className="glass-card p-10 max-w-md w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Database className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 text-sm">
              Join Bluestock Village Platform
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Business Name
            </label>
            <div className="relative">
              <Building2
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) =>
                  setForm({ ...form, businessName: e.target.value })
                }
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-8">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
