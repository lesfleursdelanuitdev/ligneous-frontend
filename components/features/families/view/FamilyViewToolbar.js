'use client';

export default function FamilyViewToolbar(props) {
  const { children } = props;
  if (!children) return null;
  return (
    <div className="rounded-lg shadow-sm border border-base-content/5 bg-base-100 px-3 py-2.5">
      {children}
    </div>
  );
}
