import React, { useEffect, useMemo, useState } from 'react';
import { useMembers, useAddMember } from '../hooks/useMembers';
import { useUserSearch } from '../hooks/useUserSearch';
import { Button } from '@/shared/components/Button';
import { MemberActions } from './MemberActions';
import type { User, WorkspaceMember } from '@teamhub/shared';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/useAuthStore';

interface Props {
  workspaceId: string;
}

export const MemberList: React.FC<Props> = ({ workspaceId }) => {
  const { data: members, isLoading } = useMembers(workspaceId);
  const addMemberMutation = useAddMember(workspaceId);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const { data: searchResults = [] } = useUserSearch(debounced);
  const workspaceMembers = useMemo(
    () => (members ?? []).filter((member): member is WorkspaceMember & { user: NonNullable<WorkspaceMember['user']> } => Boolean(member.user)),
    [members],
  );
  const actorRole = useMemo(
    () => workspaceMembers.find((member) => member.user.id === currentUserId)?.role ?? 'member',
    [currentUserId, workspaceMembers],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const existingMemberIds = useMemo(() => new Set(workspaceMembers.map((member) => member.user.id)), [workspaceMembers]);
  const visibleSuggestions = useMemo(
    () => searchResults.filter((user: User) => !existingMemberIds.has(user.id)).slice(0, 8),
    [existingMemberIds, searchResults],
  );

  const handleAddMember = async (user: User) => {
    try {
      await addMemberMutation.mutateAsync({ userId: user.id });
      toast.success(`${user.display_name || user.email} added to workspace`);
      setQuery('');
      setDebounced('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add member';
      toast.error(message);
    }
  };

  if (isLoading) return <div>Loading members...</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Members</h3>
          <p className="text-xs text-text-muted">Manage workspace members</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all users by name or email"
            className="w-full sm:w-80 rounded-lg border border-white/10 bg-surface-secondary/80 px-3 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary-accent/40 focus:bg-surface-elevated"
          />
        </div>
      </div>

      {debounced && visibleSuggestions.length > 0 && (
        <ul className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-surface-secondary/95 p-2 shadow-2xl backdrop-blur-sm">
          {visibleSuggestions.map((u: User) => (
            <li key={u.id} className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-accent/15 bg-primary-accent/10 font-semibold text-primary-accent">
                  {u.display_name?.[0] ?? u.email?.[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{u.display_name || u.email}</div>
                  <div className="text-xs text-text-muted">{u.email}</div>
                </div>
              </div>
              <div>
                <Button onClick={() => void handleAddMember(u)} className="border-2 border-primary-accent/40 text-sm hover:bg-primary-accent/10">
                  Add
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ul className="space-y-3">
        {workspaceMembers.map((m) => (
          <li
            key={m.user.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-primary-accent/15 bg-surface-secondary/60 p-4 gap-4 transition-all hover:-translate-y-px hover:border-primary-accent/40 hover:bg-primary-accent/5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-accent/15 bg-primary-accent/10 text-primary-accent font-semibold shrink-0">
                {m.user.display_name?.[0] || m.user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.user.display_name || m.user.email}</div>
                <div className="text-xs text-text-secondary truncate">{m.user.email}</div>
              </div>
            </div>
            <div className="flex justify-end border-t border-white/5 pt-3 sm:pt-0 sm:border-none w-full sm:w-auto">
              <MemberActions
                workspaceId={workspaceId}
                userId={m.user.id}
                currentRole={m.role}
                actorRole={actorRole}
                isSelf={m.user.id === currentUserId}
              />
            </div>
          </li>
        ))}
      </ul>

    </div>
  );
};
