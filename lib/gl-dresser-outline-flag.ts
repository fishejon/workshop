/**
 * Opt-in preview: schematic derived from saved dresser parts (cut list), not planner field state.
 * Set `NEXT_PUBLIC_GL_DRESSER_PARTS_OUTLINE=1` in `.env.local` to enable.
 */
export function showDresserPartsLinkedOutline(): boolean {
  return process.env.NEXT_PUBLIC_GL_DRESSER_PARTS_OUTLINE === "1";
}
