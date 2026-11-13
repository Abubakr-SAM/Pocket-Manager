"use client";

export default function ChartTypeSwitch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
            value === option.value
              ? "border-foreground bg-foreground text-background"
              : "border-line text-muted hover:bg-hover"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}