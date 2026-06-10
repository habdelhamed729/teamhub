import logo from '@/assets/Logo.webp';
import { Brain, MessageSquare, CheckSquare, FileText } from 'lucide-react';

interface AuthHeroProps {
  title?: string;
  description?: string;
}

export const AuthHero = ({ 
  title = "Where collaboration meets intelligence", 
  description = "A unified workspace combining real-time messaging, interactive task boards, and AI-powered document intelligence." 
}: AuthHeroProps) => {
  const features = [
    {
      title: 'AI Assistant & Agents',
      desc: 'QA, summaries, & auto-assign',
      icon: <Brain className="h-5 w-5 text-ai-accent" />,
    },
    {
      title: 'Real-time Messaging',
      desc: 'Channels, DMs, & typing states',
      icon: <MessageSquare className="h-5 w-5 text-primary-accent" />,
    },
    {
      title: 'Kanban Boards',
      desc: 'Interactive task tracking & boards',
      icon: <CheckSquare className="h-5 w-5 text-primary-accent" />,
    },
    {
      title: 'Documents Hub',
      desc: 'Collaborate and organize docs',
      icon: <FileText className="h-5 w-5 text-primary-accent" />,
    },
  ];

  return (
    <div className="lg:w-1/2 flex flex-col justify-center items-center px-4 lg:px-12 py-8 lg:py-0">
      <div className="flex justify-center">
        <img src={logo} alt="TeamHub Logo" className="h-56 w-auto object-contain" />
      </div>

      <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 text-center -mt-10">
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
          <div key={i} className="p-4 rounded-xl bg-surface-secondary border border-white/5 flex items-start gap-3.5 transition-all hover:border-primary-accent/20 group">
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
