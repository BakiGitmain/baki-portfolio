import AdminShell from "@/components/admin/admin-shell";
import PartnerChat from "@/components/chat/partner-chat";

export default function AdminChatPage() {
  return (
    <AdminShell>
      <PartnerChat role="admin" />
    </AdminShell>
  );
}
