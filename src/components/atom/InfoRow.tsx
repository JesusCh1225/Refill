interface InfoRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function InfoRow({ label, value, highlight }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] font-semibold text-text-muted w-14 shrink-0">
        {label}
      </span>
      <span
        className={
          highlight
            ? "text-[22px] font-bold text-text-heading"
            : "text-[15px] text-text-body"
        }
      >
        {value}
      </span>
    </div>
  );
}
