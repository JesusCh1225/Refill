export default function Pagination({ page, totalPages, onChange }: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-[13px] border cursor-pointer transition-colors ${
            p === page ? "bg-brand text-white border-brand" : "bg-white text-text-body border-border-base hover:border-brand/50"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
