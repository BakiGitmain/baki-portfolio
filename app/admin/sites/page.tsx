"use client";

import AdminShell from "@/components/admin/admin-shell";

import AdminSites from "@/components/admin/admin-sites";

export default function AdminSitesPage() {
  return (
    <AdminShell>
      <AdminSites />
    </AdminShell>
  );
}