const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
} as const;

export default function Spinner({ size = "xl" }: { size?: keyof typeof sizeClasses }) {
  return (
    <div className={`${sizeClasses[size]} rounded-full border-2 border-brand border-t-transparent animate-spin`} />
  );
}
