'use client';

import { Rows2, Columns2 } from 'lucide-react';
import EventsTimelineD3 from './EventsTimelineD3';

export default function EventsTimeline({ events, treeId, orientation, onOrientationChange }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="text-xs text-base-content/50">Layout:</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onOrientationChange?.('vertical')}
            className={`flex items-center justify-center w-8 h-8 rounded border-0 transition-colors cursor-pointer ${
              orientation === 'vertical'
                ? 'bg-base-300/80 text-base-content hover:bg-primary/40'
                : 'bg-transparent text-base-content/70 hover:bg-primary/30'
            }`}
            title="Vertical timeline"
          >
            <Rows2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => onOrientationChange?.('horizontal')}
            className={`flex items-center justify-center w-8 h-8 rounded border-0 transition-colors cursor-pointer ${
              orientation === 'horizontal'
                ? 'bg-base-300/80 text-base-content hover:bg-primary/40'
                : 'bg-transparent text-base-content/70 hover:bg-primary/30'
            }`}
            title="Horizontal timeline"
          >
            <Columns2 size={18} />
          </button>
        </div>
      </div>
      <EventsTimelineD3 events={events} treeId={treeId} orientation={orientation || 'vertical'} />
    </div>
  );
}
