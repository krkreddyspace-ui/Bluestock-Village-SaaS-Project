import React, { useState } from "react";
import {
  Database,
  Search,
  MapPin,
  Globe,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../utils/api";

const fetchVillages = async (query = "", page = 1) => {
  const url = query
    ? `/search?q=${query}&limit=50`
    : `/geo/villages?page=${page}&limit=50`;

  return fetchApi(url);
};

export default function VillageMaster() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["villages", search, page],
    queryFn: () => fetchVillages(search, page),
    keepPreviousData: true,
  });

  const villages = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold text-white">Village Master</h3>
          <p className="text-slate-400 text-sm mt-1">
            Explore and manage the global village database
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search villages..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-64"
            />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider bg-white/5">
                <th className="px-6 py-4">Village Name</th>
                <th className="px-6 py-4">MDDS Code</th>
                <th className="px-6 py-4">Sub-District</th>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500 text-sm">
                      Searching 600,000+ records...
                    </p>
                  </td>
                </tr>
              ) : villages.length > 0 ? (
                villages.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                          <MapPin size={16} />
                        </div>
                        <span className="text-sm font-bold text-white">
                          {v.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                      {v.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {v.subDistrict || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {v.district || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {v.state || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-20 text-center text-slate-500"
                  >
                    <Database size={48} className="mx-auto mb-4 opacity-10" />
                    No villages found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!search && (
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/2">
            <p className="text-sm text-slate-500">Showing page {page}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
