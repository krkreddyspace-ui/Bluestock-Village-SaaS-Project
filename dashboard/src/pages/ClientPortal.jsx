import React, { useState } from "react";
import {
  Key,
  Copy,
  RotateCcw,
  Trash2,
  Plus,
  CheckCircle2,
  CopyCheck,
  ExternalLink,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../utils/api";

const fetchUserKeys = () => fetchApi("/auth/api-keys");
const fetchUsage = async () => {
  // In a real app, this would be a user-specific traffic endpoint
  // For now, we'll return an empty or simulated set based on real stats
  return {
    data: [{ name: "Last 24h", usage: 0 }],
    summary: { daily: 0, monthly: 0, limit: 5000 },
  };
};

export default function ClientPortal() {
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const { data: keysData, isLoading } = useQuery({
    queryKey: ["userKeys"],
    queryFn: fetchUserKeys,
  });
  const { data: usageData } = useQuery({
    queryKey: ["userUsage"],
    queryFn: fetchUsage,
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name) => {
      return fetchApi("/auth/api-keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["userKeys"]);
      if (data.success) {
        setShowSecret(data.data);
      }
    },
  });

  const keys = keysData?.data || [];
  const usage = usageData?.summary || { daily: 0, monthly: 0, limit: 5000 };

  const copyToClipboard = (val) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(val);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Secret Modal */}
      {showSecret && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-8 border-brand-500/30">
            <h4 className="text-xl font-bold text-white mb-2">
              Key Generated Successfully
            </h4>
            <p className="text-slate-400 text-sm mb-6">
              Store this secret key safely. It will not be shown again.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  API Key
                </label>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-brand-400 font-mono text-sm break-all">
                  {showSecret.key}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Secret Key
                </label>
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400 font-mono text-sm break-all">
                  {showSecret.secret}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSecret(null)}
              className="w-full mt-8 btn-primary"
            >
              I've stored the keys
            </button>
          </div>
        </div>
      )}

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-white">Daily API Usage</h4>
            <div className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold flex items-center gap-1 border border-brand-500/20">
              <CheckCircle2 size={12} />
              Within {usage.daily < usage.limit ? "Limit" : "Quota"}
            </div>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center text-slate-600 italic">
            <AreaChart
              data={usageData?.data || []}
              className="w-full h-full opacity-20"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#ffffff05"
              />
              <Area
                type="monotone"
                dataKey="usage"
                stroke="#556eff"
                fill="#556eff"
                fillOpacity={0.05}
              />
            </AreaChart>
            <div className="absolute text-sm">Waiting for live traffic...</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 bg-brand-600/5 border-brand-500/20">
            <p className="text-slate-400 text-sm font-medium">Quick Stats</p>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">
                    Daily Quota: {usage.daily} / {usage.limit}
                  </span>
                  <span className="text-brand-400">
                    {Math.round((usage.daily / usage.limit) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(usage.daily / usage.limit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-brand-500/10">
            <h5 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> Need more requests?
            </h5>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your Free plan supports {usage.limit.toLocaleString()}{" "}
              requests/day. Upgrade to Pro for high-throughput access.
            </p>
            <button className="w-full mt-4 btn-primary py-2 text-sm opacity-50 cursor-not-allowed">
              Upgrade Plan (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="glass-card">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold text-white">API Credentials</h4>
            <p className="text-slate-400 text-xs mt-1">
              Manage your keys for programmatic access to village data.
            </p>
          </div>
          <button
            onClick={() => createKeyMutation.mutate("Production Key")}
            disabled={createKeyMutation.isLoading}
            className="btn-primary"
          >
            <Plus size={18} />
            Generate New Key
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider bg-white/5">
                <th className="px-6 py-4">Key Name</th>
                <th className="px-6 py-4">API Key</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Last Used</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    Loading keys...
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {k.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5 w-fit">
                        {k.key.substring(0, 10)}...
                        {k.key.substring(k.key.length - 4)}
                        <button
                          onClick={() => copyToClipboard(k.key)}
                          className="text-slate-500 hover:text-brand-400 transition-colors"
                        >
                          {copiedKey === k.key ? (
                            <CopyCheck size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {k.lastUsed
                        ? new Date(k.lastUsed).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <button className="text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && keys.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-600 italic text-sm"
                  >
                    No keys generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Examples */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-bold text-white mb-6">Quick Integration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-brand-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400"></div>
              Node.js Fetch
            </h5>
            <pre className="bg-black/40 rounded-xl p-4 text-[13px] font-mono text-slate-300 border border-white/5 overflow-x-auto">
              {`const response = await fetch('http://localhost:3000/v1/search?q=Manibeli', {
  headers: {
    'x-api-key': '${keys[0]?.key || "ak_your_key_here"}'
  }
});
const data = await response.json();`}
            </pre>
          </div>
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Python Requests
            </h5>
            <pre className="bg-black/40 rounded-xl p-4 text-[13px] font-mono text-slate-300 border border-white/5 overflow-x-auto">
              {`import requests

headers = {'x-api-key': '${keys[0]?.key || "ak_your_key_here"}'}
response = requests.get(
    'http://localhost:3000/v1/search?q=Manibeli',
    headers=headers
)
print(response.json())`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
