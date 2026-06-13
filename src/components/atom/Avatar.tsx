interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  textClassName?: string;
}

export default function Avatar({ src, name, className = "w-8 h-8", textClassName = "text-sm" }: AvatarProps) {
  return src ? (
    <img src={src} alt={name} className={`${className} rounded-full object-cover`} />
  ) : (
    <div className={`${className} rounded-full bg-brand-bg flex items-center justify-center font-bold text-brand ${textClassName}`}>
      {name[0]}
    </div>
  );
}
