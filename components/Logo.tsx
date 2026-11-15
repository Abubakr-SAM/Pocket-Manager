export default function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill="var(--foreground)" />
      <g
        stroke="var(--background)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 24a6 6 0 0 1 6-6h18" />
        <rect x="14" y="24" width="36" height="26" rx="7" />
        <path d="M50 35h-8a4 4 0 0 0 0 8h8" />
      </g>
      <circle cx="42" cy="39" r="1.5" fill="var(--background)" />
    </svg>
  );
}