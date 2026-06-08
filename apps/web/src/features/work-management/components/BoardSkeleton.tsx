export const BoardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-surface-elevated/50 border border-white/5 rounded-xl h-48" />
    ))}
  </div>
);

export const BoardDetailSkeleton = () => (
  <div className="flex gap-6 h-full overflow-hidden p-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="w-80 shrink-0 bg-surface-secondary/20 rounded-xl h-full border border-white/5 animate-pulse" />
    ))}
  </div>
);
