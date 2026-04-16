import React from "react";
import {
  Users,
  Mail,
  Building,
  Tag,
  ShieldCheck,
  UserX,
  Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../utils/api";

const fetchUsers = () => fetchApi("/admin/users");

const PlanBadge = ({ plan }) => {
  const colors = {
    FREE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    PREMIUM: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    PRO: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    UNLIMITED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${colors[plan] || colors.FREE}`}
    >
      {plan}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PENDING_APPROVAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${colors[status] || colors.PENDING_APPROVAL}`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchUsers,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return fetchApi(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries(["adminUsers"]),
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">User Management</h3>
        <p className="text-slate-400 text-sm mt-1">
          Manage B2B clients, subscriptions, and access permissions
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider bg-white/5">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin inline-block"></div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold">
                          {user.businessName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white uppercase">
                            {user.businessName}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {user.businessName}
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={user.planType} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.status === "PENDING_APPROVAL" && (
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: user.id,
                                status: "ACTIVE",
                              })
                            }
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            title="Approve"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        {user.status === "ACTIVE" && (
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: user.id,
                                status: "SUSPENDED",
                              })
                            }
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            title="Suspend"
                          >
                            <UserX size={16} />
                          </button>
                        )}
                        {user.status === "SUSPENDED" && (
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: user.id,
                                status: "ACTIVE",
                              })
                            }
                            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                            title="Reactivate"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
