import AdminProgramDetail from "@/components/admin/admin-program-detail";
import AdminShell from "@/components/admin/admin-shell";

export default async function AdminProgramDetailPage({
  params,
}: {
  params: Promise<{
    programId: string;
  }>;
}) {
  const { programId } = await params;

  return (
    <AdminShell>
      <AdminProgramDetail programId={programId} />
    </AdminShell>
  );
}
