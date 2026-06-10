import { formatRelativeTime } from '../utils/formatTime';

interface LiveFeedProps {
  activities: any[];
}

export const LiveFeed = ({ activities }: LiveFeedProps) => {
  return (
    <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl shadow-premium backdrop-blur-md p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Live Feed</h2>
        <p className="text-xs text-text-muted mt-0.5">Real-time collaboration updates</p>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin pl-1">
        {activities.map((act) => (
          <div key={act.id} className="flex items-start gap-3.5 text-xs animate-fade-in relative pl-4 border-l border-white/5 pb-2.5 last:pb-0">
            {/* Event Marker */}
            <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-accent/40 border border-primary-accent/60" />

            <div className="min-w-0 flex-1">
              <p className="text-text-secondary leading-snug">
                <span className="font-bold text-text-primary">{act.user.display_name}</span>{' '}
                {act.type.includes('task_created') && <span>created task <span className="font-semibold text-text-primary">{act.targetName}</span> in <span className="font-semibold">{act.metadata?.boardName}</span></span>}
                {act.type.includes('task_updated') && <span>updated task <span className="font-semibold text-text-primary">{act.targetName}</span></span>}
                {act.type.includes('document_created') && <span>created document <span className="font-semibold text-text-primary">{act.targetName}</span></span>}
                {act.type.includes('document_updated') && <span>updated document <span className="font-semibold text-text-primary">{act.targetName}</span></span>}
                {act.type.includes('comment_created') && <span>commented on <span className="font-semibold text-text-primary">{act.targetName}</span>: <span className="italic text-text-muted">"{act.metadata?.content}"</span></span>}
              </p>
              <span className="text-[10px] text-text-muted font-semibold mt-1 block">
                {formatRelativeTime(act.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-text-muted italic">No logs recorded yet. Events stream automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};
