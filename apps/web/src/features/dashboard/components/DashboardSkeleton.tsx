export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse text-white">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-white/5 rounded-xl" />
          <div className="h-4 w-96 bg-white/5 rounded-lg" />
        </div>
        <div className="h-16 w-64 bg-white/5 rounded-2xl" />
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-white/5 border border-white/5 rounded-2xl" />
        <div className="h-44 bg-white/5 border border-white/5 rounded-2xl" />
        <div className="h-44 bg-white/5 border border-white/5 rounded-2xl" />
      </div>

      {/* Layout Split Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="h-64 bg-white/5 border border-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 border border-white/5 rounded-2xl" />
        </div>
        <div className="h-96 bg-white/5 border border-white/5 rounded-2xl" />
      </div>
    </div>
  );
};
