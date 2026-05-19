import logo from '@/assets/Logo.webp';

interface AuthHeroProps {
  title?: string;
  description?: string;
}

export const AuthHero = ({ 
  title = "The all-in-one workspace for modern teams", 
  description = "Chat, manage tasks, write docs, and get AI insights — all in one place." 
}: AuthHeroProps) => {
  const features = [
    {
      title: 'Real-time Chat',
      desc: 'Socket.io powered',
      icon: (
        <svg className="h-5 w-5 text-primary-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      title: 'Kanban Boards',
      desc: 'Drag & drop tasks',
      icon: (
        <svg className="h-5 w-5 text-primary-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      title: 'Documents',
      desc: 'AI-summarized',
      icon: (
        <svg className="h-5 w-5 text-primary-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'AI Insights',
      desc: 'Claude analytics',
      icon: (
        <svg className="h-5 w-5 text-ai-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="lg:w-1/2 flex flex-col justify-center items-center px-8 lg:px-24 py-12 lg:py-0">
      <div className="flex justify-center">
        <img src={logo} alt="TeamHub Logo" className="h-80 w-auto object-contain" />
      </div>

      <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 text-center -mt-24">
        {title.includes('modern teams') ? (
          <>
            {title.split('modern teams')[0]} <br />
            <span className="text-primary-accent">modern teams</span>
          </>
        ) : title}
      </h1>

      <p className="text-text-secondary text-lg mb-12 max-w-lg text-center">
        {description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full">
        {features.map((f, i) => (
          <div key={i} className="p-4 rounded-xl bg-surface-secondary border border-white/5 flex items-start gap-4 transition-all hover:border-primary-accent/20 group">
            <div className="p-2 rounded-lg bg-surface-elevated border border-white/5 transition-colors group-hover:bg-primary-accent/5">
              {f.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
