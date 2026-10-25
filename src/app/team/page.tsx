"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { UserRole } from "@/types";
import {
  UserCog,
  Plus,
  ShieldCheck,
  Mail,
  User,
  CheckCircle2,
  Lock,
  Trash2,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "invited";
  lastActive: string;
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "mem-01",
      name: "John Doe",
      email: "fleet@atlasrentals.com",
      role: "owner",
      status: "active",
      lastActive: "Active Now",
    },
    {
      id: "mem-02",
      name: "Carlos Mendez",
      email: "carlos.mendez@atlasrentals.com",
      role: "rental_manager",
      status: "active",
      lastActive: "2 hours ago",
    },
    {
      id: "mem-03",
      name: "Elena Gomez",
      email: "elena.gomez@atlasrentals.com",
      role: "finance_manager",
      status: "active",
      lastActive: "Yesterday",
    },
    {
      id: "mem-04",
      name: "David Silva",
      email: "david.fleet@atlasrentals.com",
      role: "fleet_manager",
      status: "active",
      lastActive: "3 days ago",
    },
    {
      id: "mem-05",
      name: "Marcus Vance",
      email: "marcus.v@atlasrentals.com",
      role: "rental_staff",
      status: "invited",
      lastActive: "Pending Invitation",
    },
  ]);

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("rental_staff");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setMembers([
      ...members,
      {
        id: `mem-${Date.now()}`,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        status: "invited",
        lastActive: "Pending Invitation",
      },
    ]);

    setIsInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
  };

  const handleRevoke = (id: string) => {
    if (confirm("Revoke access for this employee?")) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  const permissionMatrix = [
    { module: "Vehicles & Fleet", permissions: ["View Inventory", "Create Vehicle", "Update Rates", "Retire Asset"], roles: { owner: true, agency_admin: true, rental_manager: true, fleet_manager: true, finance_manager: false, rental_staff: false } },
    { module: "Rentals & Bookings", permissions: ["View Bookings", "Create Reservation", "Override Pricing", "Cancel Booking"], roles: { owner: true, agency_admin: true, rental_manager: true, fleet_manager: false, finance_manager: false, rental_staff: true } },
    { module: "Inspections (Handover)", permissions: ["Perform Check-out", "Perform Check-in", "Charge Damages"], roles: { owner: true, agency_admin: true, rental_manager: true, fleet_manager: true, finance_manager: false, rental_staff: true } },
    { module: "Payments & Invoices", permissions: ["View Invoices", "Record Cash/Card", "Issue Refunds"], roles: { owner: true, agency_admin: true, rental_manager: false, fleet_manager: false, finance_manager: true, rental_staff: false } },
    { module: "Financial Reports", permissions: ["P&L Summary", "Deposit Liability", "Export Tax Docs"], roles: { owner: true, agency_admin: true, rental_manager: false, fleet_manager: false, finance_manager: true, rental_staff: false } },
    { module: "Team & Configuration", permissions: ["Invite Staff", "Revoke Roles", "Agency Settings"], roles: { owner: true, agency_admin: false, rental_manager: false, fleet_manager: false, finance_manager: false, rental_staff: false } },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Team Management & Role Permissions (RBAC)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure employee memberships, assign granular operational roles, and enforce security policies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Invite Team Member
          </button>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Active Agency Members ({members.length})
          </h3>
          <span className="text-xs text-slate-400">
            Multi-user seat allocation compliant
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Role Assigned</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {m.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{m.email}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="capitalize font-bold text-slate-800 dark:text-slate-200 block">
                      {m.role.replace("_", " ")}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">
                    {m.lastActive}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {m.role !== "owner" && (
                      <button
                        onClick={() => handleRevoke(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle p-5 space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-600" />
            Security & Permission Enforcement Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Action-level permissions enforced across server actions, API endpoints, and database RLS policies.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-100 dark:border-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b">
              <tr>
                <th className="p-3">Functional Module</th>
                <th className="p-3">Operations</th>
                <th className="p-3 text-center">Owner</th>
                <th className="p-3 text-center">Rental Mgr</th>
                <th className="p-3 text-center">Fleet Mgr</th>
                <th className="p-3 text-center">Finance Mgr</th>
                <th className="p-3 text-center">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissionMatrix.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {p.module}
                  </td>
                  <td className="p-3 text-slate-500">
                    {p.permissions.join(", ")}
                  </td>
                  <td className="p-3 text-center text-emerald-600 font-black">✓</td>
                  <td className="p-3 text-center font-bold">
                    {p.roles.rental_manager ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="p-3 text-center font-bold">
                    {p.roles.fleet_manager ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="p-3 text-center font-bold">
                    {p.roles.finance_manager ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="p-3 text-center font-bold">
                    {p.roles.rental_staff ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <Modal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          title="Invite Agency Employee"
          description="Send secure onboarding invitation with pre-assigned permissions."
          maxWidth="md"
        >
          <form onSubmit={handleInvite} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="sarah@atlasrentals.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Role Assignment *
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl capitalize font-semibold"
              >
                <option value="rental_manager">Rental Manager (Full Bookings & Contracts)</option>
                <option value="fleet_manager">Fleet Manager (Maintenance & Telemetry)</option>
                <option value="finance_manager">Finance Manager (Invoices, Deposits & Payments)</option>
                <option value="rental_staff">Rental Staff (Handover & Return Checklists)</option>
                <option value="readonly">Read-only User (View Only)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-sm"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
