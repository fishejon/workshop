/**
 * When true, joinery rules may apply on the main cut-list path (future work per roadmap P1).
 * Default **off** — `project.joints` / connections remain labs-first until P1-T2+ ships.
 * Set `NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1` only during integration slices.
 */
export function isMainPathJoineryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GL_MAIN_PATH_JOINERY === "1";
}
