import { formatImperialInput, parseInches } from "@/lib/imperial";

export function DresserImperialInput({
  value,
  onChange,
  hint,
  placeholder,
  denominator = 16,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  denominator?: number;
}) {
  function handleBlur() {
    const parsed = parseInches(value);
    if (parsed === null) return;
    onChange(formatImperialInput(parsed, denominator));
  }

  return (
    <>
      <input
        className="input-wood"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        inputMode="decimal"
      />
      <span className="text-xs text-[var(--gl-muted)]">
        {hint ?? "Fractions supported (e.g. 34 1/2, 7/8, 3/4)."}
      </span>
    </>
  );
}
