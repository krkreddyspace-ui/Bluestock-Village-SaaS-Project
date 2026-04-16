import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Database, Mail, Lock, ArrowRight, Github } from "lucide-react";
import { fetchApi } from "../utils/api";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", data.data.token);
      setUser(data.data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.message === "INVALID_CREDENTIALS"
          ? "Invalid email or password."
          : err.message.includes("ACCOUNT_NOT_ACTIVE")
            ? "Account is not active. Contact admin."
            : err.message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f111a] relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-2xl shadow-brand-600/20 mb-6">
            <Database className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Welcome to Bluestock
          </h2>
          <p className="text-slate-400 mt-2">
            The source of truth for Indian geographical data.
          </p>
        </div>

        <div className="glass-card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-slate-500"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full pl-10"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-slate-500"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 group"
            >
              {isLoading ? "Signing in..." : "Sign in to Dashboard"}
              {!isLoading && (
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
            <p className="text-center text-xs text-slate-500 uppercase tracking-widest font-bold">
              Or continue with
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300">
                <Github size={18} />
                <span className="text-sm font-medium">GitHub</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.13-.45-4.63H24v9.3h12.91c-.58 2.85-2.2 5.28-4.61 6.9l7.46 5.78C44.12 37.93 46.98 31.89 46.98 24.55z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 1.89 10.78l7.98-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.46-5.78c-2.19 1.48-4.99 2.36-8.43 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-brand-400 font-medium hover:underline"
          >
            Register your business
          </Link>
        </p>
      </div>
    </div>
  );
}
