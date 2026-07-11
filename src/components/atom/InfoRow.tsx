interface InfoRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function InfoRow({ label, value, highlight }: InfoRowProps) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="text-[12px] font-semibold text-text-muted w-14 shrink-0">
        {label}
      </span>
      <span
        className={
          highlight
            ? "text-[20px] font-bold text-text-heading"
            : "text-[14px] text-text-body"
        }
      >
        {value}
      </span>
    </div>
  );
}
