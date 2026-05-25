'use client';

const TOP_ID = 'family-view-top';

export default function FamilyView(props) {
  const { toolbar, children, topId = TOP_ID, className = '' } = props;
  return (
    <div
      id={topId}
      className={'rounded-t-none rounded-b-lg overflow-hidden border border-base-content/5 bg-base-200/40 shadow-sm ' + (className || '')}
    >
      <div className="space-y-4 p-4">
        {toolbar}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export { TOP_ID };
