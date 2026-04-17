import { DresserMaterialsSnapshotProvider } from "@/components/DresserMaterialsSnapshotContext";
import { DresserPlanSyncProvider } from "@/components/DresserPlanSyncContext";
import { GrainlineApp } from "@/components/GrainlineApp";
import { ProjectProvider } from "@/components/ProjectContext";
import { WelcomeModal } from "@/components/WelcomeModal";

export default function Home() {
  return (
    <div className="min-h-full bg-[var(--gl-bg)] text-[var(--gl-text)]">
      <ProjectProvider>
        <DresserPlanSyncProvider>
          <DresserMaterialsSnapshotProvider>
            <WelcomeModal />
            <GrainlineApp />
          </DresserMaterialsSnapshotProvider>
        </DresserPlanSyncProvider>
      </ProjectProvider>
    </div>
  );
}
