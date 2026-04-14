import { GrainlineApp } from "@/components/GrainlineApp";
import { ProjectProvider } from "@/components/ProjectContext";

export default function Home() {
  return (
    <div className="min-h-full bg-[var(--gl-bg)] text-[var(--gl-text)]">
      <ProjectProvider>
        <GrainlineApp />
      </ProjectProvider>
    </div>
  );
}
