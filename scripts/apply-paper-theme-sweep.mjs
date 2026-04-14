import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = ["components", "app"].map((d) => path.join(root, d));

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (p.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

const files = targets.flatMap((d) => (fs.existsSync(d) ? walk(d) : []));

const rules = [
  ["from-white/[0.08] to-white/[0.02]", "from-[var(--gl-surface)] to-[var(--gl-bg)]"],
  ["shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]", "shadow-[inset_0_1px_0_var(--gl-border)]"],
  ["shadow-[0_0_0_1px_rgba(255,255,255,0.04)]", "shadow-[0_0_0_1px_var(--gl-border)]"],
  ["border-white/25", "border-[var(--gl-border-strong)]"],
  ["border-white/20", "border-[var(--gl-border-strong)]"],
  ["border-white/15", "border-[var(--gl-border)]"],
  ["border-white/12", "border-[var(--gl-border)]"],
  ["border-white/10", "border-[var(--gl-border)]"],
  ["border-white/[0.06]", "border-[var(--gl-border)]"],
  ["hover:border-white/25", "hover:border-[var(--gl-border-strong)]"],
  ["hover:border-white/10", "hover:border-[var(--gl-border)]"],
  ["bg-white/[0.08]", "bg-[var(--gl-surface-muted)]"],
  ["bg-white/[0.04]", "bg-[var(--gl-surface)]"],
  ["bg-white/[0.02]", "bg-[var(--gl-surface-inset)]"],
  ["bg-white/15", "bg-[var(--gl-surface-muted)]"],
  ["bg-white/10", "bg-[var(--gl-surface-muted)]"],
  ["bg-white/5", "bg-[var(--gl-surface-inset)]"],
  ["hover:bg-white/15", "hover:bg-[var(--gl-surface-muted)]"],
  ["hover:bg-white/10", "hover:bg-[var(--gl-surface-muted)]"],
  ["hover:bg-white/5", "hover:bg-[var(--gl-surface-inset)]"],
  ["bg-black/40", "bg-[var(--gl-surface-inset)]"],
  ["bg-black/30", "bg-[var(--gl-surface-inset)]"],
  ["bg-black/25", "bg-[var(--gl-surface-muted)]"],
  ["bg-black/20", "bg-[var(--gl-surface-muted)]"],
  ["bg-black/15", "bg-[var(--gl-surface-muted)]"],
  ["divide-white/10", "divide-[var(--gl-border)]"],
  ["ring-white/10", "ring-[var(--gl-border)]"],
  ["text-white/35", "text-[var(--gl-muted)]"],
  ["text-white/40", "text-[var(--gl-muted)]"],
  ["shadow-lg shadow-black/30", "shadow-md shadow-[0_8px_24px_rgba(0,0,0,0.08)]"],
  ["text-[var(--gl-bg)]", "text-[var(--gl-on-accent)]"],
  ["border-[var(--gl-ink)]/25", "border-[var(--gl-border)]"],
  ["border-[var(--gl-ink)]/20", "border-[var(--gl-border)]"],
  ["border-[var(--gl-ink)]/15", "border-[var(--gl-border)]"],
  ["  backdrop-blur-md", ""],
  [" backdrop-blur-md", ""],
  ["backdrop-blur-md ", ""],
  ["  backdrop-blur-sm", ""],
  [" backdrop-blur-sm", ""],
  ["backdrop-blur-sm ", ""],
];

for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  for (const [a, b] of rules) {
    s = s.split(a).join(b);
  }
  if (s !== orig) fs.writeFileSync(file, s);
}

console.log("Paper theme sweep:", files.length, "tsx files scanned");
