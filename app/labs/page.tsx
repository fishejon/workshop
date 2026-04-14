import { LabsPageContent } from "@/components/LabsPageContent";
import { ProjectProvider } from "@/components/ProjectContext";

export default function LabsPage() {
  return (
    <div className="min-h-full bg-[var(--gl-bg)] text-[var(--gl-text)]">
      <ProjectProvider>
        <LabsPageContent />
      </ProjectProvider>
    </div>
  );
}
