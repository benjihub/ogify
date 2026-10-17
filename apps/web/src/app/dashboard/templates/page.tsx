import { TemplateStudio } from "@/components/dashboard/TemplateStudio";

export default function DashboardTemplatesPage() {
  return (
    <div className="space-y-6 sm:space-y-7">
      <div>
        <p className="eyebrow mb-2">Templates</p>
        <h1 className="dashboard-page-title text-paper">Build reusable render templates</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
          Design a branded card once, then render it with different text and colors through the API.
        </p>
      </div>
      <TemplateStudio />
    </div>
  );
}
