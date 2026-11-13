import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  amount: string;
  amountClassName?: string;
  icon?: ReactNode;
  note?: string;
  noteClassName?: string;
};

export default function StatCard({
  title,
  amount,
  amountClassName = "text-foreground",
  icon,
  note,
  noteClassName = "text-muted",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{title}</p>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <p
        className={`mt-2 text-xl font-semibold sm:text-2xl ${amountClassName}`}
      >
        {amount}
      </p>
      {note && <p className={`mt-1 text-xs ${noteClassName}`}>{note}</p>}
    </div>
  );
}