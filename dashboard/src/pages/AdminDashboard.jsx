import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Database,
  Activity,
  TrendingUp,
  Clock,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../utils/api";

const fetchStats = () => fetchApi("/admin/stats");
const fetchTraffic = () => fetchApi("/admin/traffic");
const fetchPendingUsers = () =>
  fetchApi("/admin/users?status=PENDING_APPROVAL");

const StatCard = ({ title, value, status, icon: Icon, color = "brand" }) => (
  <div className="glass-card p-6">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        <p className="text-xs mt-2 text-emerald-400 flex items-center gap-1">
          <TrendingUp size={12} />
          {status}
        </p>
      </div>
      <div className={`p-3 bg-${color}-600/10 rounded-xl text-${color}-400`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: fetchStats,
  });
  const { data: trafficData } = useQuery({
    queryKey: ["adminTraffic"],
    queryFn: fetchTraffic,
  });
  const { data: pendingData } = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: fetchPendingUsers,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return fetchApi(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingUsers"]);
      queryClient.invalidateQueries(["adminStats"]);
    },
  });

  const stats = statsData?.data || {};
  const traffic = trafficData?.data || [];
  const pendingUsers = pendingData?.data || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Villages"
          value={stats.totalVillages?.toLocaleString()}
          status="Live in Cloud"
          icon={Database}
        />
        <StatCard
          title="Total Clients"
          value={stats.totalUsers || 0}
          status="B2B Network"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Today's Requests"
          value={stats.todayRequests || 0}
          status="Real Traffic"
          icon={Activity}
          color="amber"
        />
        <StatCard
          title="Avg Latency"
          value={`${stats.avgLatency}ms`}
          status="Current Performance"
          icon={Clock}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-white">
              API Traffic (History)
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>{" "}
              Requests
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  traffic.length > 0
                    ? traffic
                    : [{ name: "Waiting for traffic", requests: 0 }]
                }
              >
                <defs>
                  <linearGradient
                    id="colorRequests"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#556eff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#556eff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff10"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#556eff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h4 className="text-lg font-bold text-white">Pending Approvals</h4>
            <p className="text-slate-400 text-xs mt-1">
              Review new B2B client requests
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pendingUsers.length > 0 ? (
              pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="text-sm font-bold text-white">
                        {user.businessName}
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-brand-400 text-[10px] font-bold uppercase tracking-wider">
                      {user.planType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        statusMutation.mutate({ id: user.id, status: "ACTIVE" })
                      }
                      disabled={statusMutation.isLoading}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} /> Approve
                    </button>
                    <button
                      onClick={() =>
                        statusMutation.mutate({
                          id: user.id,
                          status: "SUSPENDED",
                        })
                      }
                      disabled={statusMutation.isLoading}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500">
                <ShieldCheck size={32} className="mb-2 opacity-20" />
                <p className="text-xs italic">No pending requests</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Option = ({ children }) => (
  <option className="bg-[#1e293b]">{children}</option>
);
