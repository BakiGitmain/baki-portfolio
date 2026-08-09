"use client";

import {
  useParams,
} from "next/navigation";

import AdminShell from "@/components/admin/admin-shell";

import AdminSiteDetails from "@/components/admin/admin-site-details";

export default function AdminSiteDetailsPage() {
  const params =
    useParams<{
      id:
        string;
    }>();

  return (
    <AdminShell>
      <AdminSiteDetails
        siteId={
          params.id
        }
      />
    </AdminShell>
  );
}