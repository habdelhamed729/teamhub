import logo from '@/assets/Logo.webp';

export const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 bg-main-bg flex flex-col items-center justify-center z-50 animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          {/* Subtle Backglow */}
          <div className="absolute inset-0 bg-primary-accent/20 rounded-full blur-3xl animate-pulse" />
          
          <img 
            src={logo} 
            alt="TeamHub Logo" 
            className="h-70 w-auto object-contain relative z-10 animate-pulse transition-transform duration-1000" 
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-primary-accent font-bold tracking-[0.2em] text-xs uppercase animate-pulse">
            TeamHub
          </p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-accent/40 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-accent/40 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-accent/40 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};
