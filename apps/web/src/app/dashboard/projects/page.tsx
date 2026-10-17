import { ProjectStudio } from "@/components/dashboard/ProjectStudio";

export default function DashboardProjectsPage() {
  return (
    <div className="space-y-6 sm:space-y-7">
      <div>
        <p className="eyebrow mb-2">Projects & access</p>
        <h1 className="dashboard-page-title text-paper">Manage projects and API permissions</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
          Group API keys by project and restrict what each key is allowed to do.
        </p>
      </div>
      <ProjectStudio />
    </div>
  );
}
