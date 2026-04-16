import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Database,
  Key,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
} from "lucide-react";

import { fetchApi } from "./utils/api";

// Pages
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const UserManagement = React.lazy(() => import("./pages/UserManagement"));
const VillageMaster = React.lazy(() => import("./pages/VillageMaster"));
const ApiLogs = React.lazy(() => import("./pages/ApiLogs"));

const ClientPortal = React.lazy(() => import("./pages/ClientPortal"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      active
        ? "bg-brand-600/20 text-brand-400 border border-brand-500/20 shadow-[0_0_15px_rgba(85,110,255,0.1)]"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const AppLayout = ({ children, user, setUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const adminMenu = [
    { id: "overview", icon: LayoutDashboard, label: "Analytics", path: "/" },
    { id: "users", icon: Users, label: "User Management", path: "/users" },
    { id: "data", icon: Database, label: "Village Master", path: "/data" },
    { id: "logs", icon: BarChart3, label: "API Logs", path: "/logs" },
  ];

  const clientMenu = [
    {
      id: "overview",
      icon: LayoutDashboard,
      label: "Usage Summary",
      path: "/",
    },
    { id: "keys", icon: Key, label: "API Keys", path: "/keys" },
    { id: "docs", icon: Globe, label: "Documentation", path: "/docs" },
    { id: "settings", icon: Settings, label: "Settings", path: "/settings" },
  ];

  const menu = user?.role === "ADMIN" ? adminMenu : clientMenu;

  return (
    <div className="flex min-h-screen bg-[#0f111a]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-card rounded-none border-y-0 border-l-0 transition-transform duration-300 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 m-0`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Database className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Bluestock <span className="text-brand-400">Village</span>
            </h1>
          </div>

          <nav className="space-y-2">
            {menu.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={window.location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-300"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : "ml-0"} p-6 lg:p-10 `}
      >
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Welcome back, {user?.businessName}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Here's what's happening with your API usage today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {user?.planType} Plan
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-brand-400 font-bold">
                {user?.businessName?.charAt(0)}
              </div>
            </div>
          </header>

          <React.Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
          >
            {children}
          </React.Suspense>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchApi("/auth/me")
        .then((data) => {
          setUser(data.data);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          user ? (
            <AppLayout user={user} setUser={setUser}>
              <Routes>
                {user.role === "ADMIN" ? (
                  <>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="data" element={<VillageMaster />} />
                    <Route path="logs" element={<ApiLogs />} />
                  </>
                ) : (
                  <>
                    <Route index element={<ClientPortal />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AppLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}
