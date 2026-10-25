"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { atlasStore } from "@/lib/db/store";
import { AuditLog } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Database,
  Lock,
} from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLogs(atlasStore.getAuditLogs());
  }, []);

  const filteredLogs = logs.filter((l) => {
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.entity_type.toLowerCase().includes(term) ||
      l.entity_id.toLowerCase().includes(term) ||
      (l.user_name && l.user_name.toLowerCase().includes(term))
    );
  });

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            System Activity & Security Audit Trail
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Immutable log of financial transactions, vehicle status modifications, and operator authorizations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <Lock className="w-3.5 h-3.5" />
          Tamper-Evident System Log Active
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search action, operator, entity ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
          />
        </div>
        <div className="text-xs text-slate-400">
          {logs.length} Logged Audit Events
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Action Code</th>
                <th className="py-3.5 px-4">Entity Type</th>
                <th className="py-3.5 px-4">Entity ID</th>
                <th className="py-3.5 px-4">Details / Payload</th>
                <th className="py-3.5 px-4">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {formatDate(log.created_at, "MMM dd, yyyy HH:mm:ss")}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {log.user_name || "System"}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                    {log.action}
                  </td>

                  <td className="py-3.5 px-4 capitalize font-semibold text-slate-700 dark:text-slate-300">
                    {log.entity_type}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {log.entity_id}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600 dark:text-slate-400 max-w-[280px] truncate">
                    {log.new_values ? JSON.stringify(log.new_values) : "—"}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {log.ip_address || "127.0.0.1"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
