import React from "react";
import {
  Activity,
  Clock,
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../utils/api";

const fetchGlobalLogs = () => fetchApi("/admin/logs");

export default function ApiLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["globalLogs"],
    queryFn: fetchGlobalLogs,
  });
  const logs = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold text-white">API Traffic Logs</h3>
          <p className="text-slate-400 text-sm mt-1">
            Real-time monitoring of all public API requests
          </p>
        </div>
        <div className="flex gap-2 text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg items-center">
          <Activity size={14} className="text-emerald-400 animate-pulse" />
          Live Monitoring Active
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider bg-white/5">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Endpoint</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Latency</th>
                <th className="px-6 py-4">Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin inline-block"></div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-300 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-bold text-brand-400 border border-brand-500/20">
                          {log.method}
                        </span>
                        <span className="text-sm font-medium text-white">
                          {log.endpoint}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold ${log.status < 400 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {log.status < 400 ? (
                          <CheckCircle size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        {log.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-400">
                      {log.responseTime}ms
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {log.apiKey?.user?.businessName ||
                        "API Key " + log.apiKeyId}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-20 text-center text-slate-500 italic"
                  >
                    <Clock size={48} className="mx-auto mb-4 opacity-10" />
                    No traffic recorded yet. Try using the API to see live logs!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
