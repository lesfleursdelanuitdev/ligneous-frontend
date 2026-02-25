export default function TreePageHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <h1 className="text-2xl font-bold text-base-content">{title}</h1>
      {subtitle && <p className="text-base-content/60">{subtitle}</p>}
    </div>
  );
}
