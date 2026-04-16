import { ShopModeContent } from "@/components/ShopModeContent";
import { ProjectProvider } from "@/components/ProjectContext";

export default function ShopPage() {
  return (
    <div className="min-h-full bg-[var(--gl-bg)] text-[var(--gl-text)]">
      <ProjectProvider>
        <ShopModeContent />
      </ProjectProvider>
    </div>
  );
}
