import AdminShell from "@/components/admin/admin-shell";
import AdminPlaceholder from "@/components/admin/admin-placeholder";

export default function AdminTrainingPage() {
  return (
    <AdminShell>
      <AdminPlaceholder
        titleEn="Training"
        titleAm="ስልጠና"
        descriptionEn="Video tutorials, Telegram onboarding material and representative training resources will be managed here."
        descriptionAm="Video tutorials፣ Telegram onboarding material እና representative training resources ከዚህ ይተዳደራሉ።"
      />
    </AdminShell>
  );
}