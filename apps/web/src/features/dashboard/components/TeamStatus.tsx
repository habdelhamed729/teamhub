interface TeamStatusProps {
  members: any[];
}

export const TeamStatus = ({ members }: TeamStatusProps) => {
  return (
    <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl shadow-premium backdrop-blur-md p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Team Status</h2>
        <p className="text-xs text-text-muted mt-0.5">Current teammate online statuses</p>
      </div>

      <div className="space-y-3.5 border-none">
        {members.map((member) => {
          const statusDotColors: Record<string, string> = {
            online: 'bg-success shadow-[0_0_10px_#22c55e]',
            offline: 'bg-text-muted opacity-60',
            away: 'bg-warning shadow-[0_0_10px_#f59e0b]',
            dnd: 'bg-danger shadow-[0_0_10px_#ef4444]'
          };

          return (
            <div key={member.user_id} className="flex items-center justify-between gap-3 bg-surface-secondary/20 border border-white/5 px-3 py-2.5 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="w-8 h-8 rounded-md bg-surface-elevated border border-white/10 flex items-center justify-center font-bold text-xs text-text-primary">
                    {member.user.avatar_url ? (
                      <img src={member.user.avatar_url} alt={member.user.display_name} className="w-full h-full object-cover rounded-md" />
                    ) : (
                      member.user.display_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-main-bg ${statusDotColors[member.user.status] || 'bg-text-muted'}`} />
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-text-primary truncate">{member.user.display_name}</h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">{member.user.status}</p>
                </div>
              </div>

              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-text-muted uppercase shrink-0 select-none">
                {member.role}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
