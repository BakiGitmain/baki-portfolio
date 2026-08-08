import AdminShell from "@/components/admin/admin-shell";
import AdminPlaceholder from "@/components/admin/admin-placeholder";

export default function AdminApplicationsPage() {
  return (
    <AdminShell>
      <AdminPlaceholder
        titleEn="Applications"
        titleAm="ማመልከቻዎች"
        descriptionEn="This is where we will review, accept and reject sales representative applications."
        descriptionAm="የSales Representative applicationsን review፣ accept እና reject የምናደርግበት ክፍል ይሆናል።"
      />
    </AdminShell>
  );
}