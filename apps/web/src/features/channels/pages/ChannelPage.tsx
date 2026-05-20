import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetChannel } from '../hooks/useChannels';
import { useChannelMembers, useAddChannelMember } from '../hooks/useChannelMembers';
import { useMembers } from '@/features/members/hooks/useMembers';
import { Button } from '@/shared/components/Button';
import { toast } from 'sonner';
import type {WorkspaceMember} from '@teamhub/shared';

export const ChannelPage: React.FC = () => {
  const { workspaceId, channelId } = useParams() as { workspaceId: string; channelId: string };
  const { data: channel, isLoading: loadingChannel } = useGetChannel(workspaceId!, channelId!);
  const { data: members, isLoading: loadingMembers } = useChannelMembers(workspaceId!, channelId!);
  const addMember = useAddChannelMember(workspaceId!, channelId!);

  const { data: workspaceMembers } = useMembers(workspaceId!);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const suggestions = useMemo(() => {
    if (!debounced) return [];
    const q = debounced.toLowerCase();
    return (workspaceMembers || []).filter((m) => {
      const name = (m.user?.display_name || '').toLowerCase();
      const email = (m.user?.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }).slice(0, 8);
  }, [debounced, workspaceMembers]);

  if (loadingChannel) return <div>Loading channel...</div>;

  const handleAdd = (userId: string) => {
    setSelectedUserId(null);
    setQuery('');
    addMember.mutate(
      { userId },
      {
        onSuccess: () => toast.success('Member added to channel'),
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to add member';
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">{channel?.name}</h2>
          <p className="text-sm text-text-muted">Channel details</p>
        </div>
      </div>

      <div className="space-y-3">
        {channel?.type !== 'dm' ? (
          <div className="relative">
            <div className="flex items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workspace members by name or email"
                className="rounded-lg border px-3 py-2 bg-surface-primary w-160"
              />
              <Button
                onClick={() => selectedUserId && handleAdd(selectedUserId)}
                disabled={addMember.isPending || !selectedUserId}
                className="border-2 border-primary-accent/60 hover:bg-primary-accent/10"
              >
                Add Member
              </Button>
            </div>

            {debounced && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-2 max-h-60 w-160 overflow-auto rounded-lg border bg-surface-elevated">
                {suggestions.map((s) => (
                  s.user !==undefined && (
                  <li
                    key={s.user.id}
                    onClick={() => { setSelectedUserId(s.user?.id || null); setQuery(s.user?.display_name || s.user?.email || ""); }}
                    className="cursor-pointer px-4 py-3 hover:bg-surface-primary/60 flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary-accent/10 flex items-center justify-center font-semibold">{s.user.display_name?.[0] ?? s.user.email?.[0]}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{s.user.display_name || s.user.email}</span>
                      <span className="text-xs text-text-muted">{s.user.email}</span>
                    </div>
                  </li>
                )))}
              </ul>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-surface-secondary/70 px-4 py-3 text-sm text-text-muted">
            This is a direct message channel. Members are fixed and cannot be added here.
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium">Members</h3>
          {loadingMembers ? (
            <div>Loading members...</div>
          ) : (
            <ul className="space-y-2 mt-3">
              {members?.length ? members.map((m: WorkspaceMember) => (
                <li key={m.user.id} className="rounded-xl border border-primary-accent/10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-accent/10 flex items-center justify-center font-semibold">{m.user.display_name?.[0] ?? m.user.email?.[0]}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{m.user.display_name || m.user.email}</span>
                      <span className="text-xs text-text-muted">{m.user.email}</span>
                    </div>
                  </div>
                </li>
              )) : <div className="text-text-muted">No members in this channel</div>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelPage;
