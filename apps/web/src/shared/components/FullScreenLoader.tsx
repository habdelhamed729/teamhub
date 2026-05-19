import { Loader2 } from 'lucide-react';

export const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Starting TeamHub...
        </p>
      </div>
    </div>
  );
};
