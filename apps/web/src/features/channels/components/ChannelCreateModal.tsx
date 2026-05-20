import React, { useEffect, useMemo, useState } from 'react';
import type { ChannelType, User } from '@teamhub/shared';
import { Button } from '@/shared/components/Button';
import { useCreateChannel } from '../hooks/useChannels';
import { toast } from 'sonner';
import { useUserSearch } from '@/features/members/hooks/useUserSearch';

interface Props {
  workspaceId: string;
  onClose: () => void;
}

export const ChannelCreateModal: React.FC<Props> = ({ workspaceId, onClose }) => {
  const createChannel = useCreateChannel(workspaceId);
  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('public');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: searchResults = [] } = useUserSearch(debounced);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const suggestions = useMemo(() => {
    if (type !== 'dm') return [];
    return searchResults.filter((user) => user.id !== selectedUser?.id).slice(0, 8);
  }, [searchResults, selectedUser?.id, type]);

  const submit = async () => {
    try {
      const payload = type === 'dm'
        ? (() => {
            if (!selectedUser) {
              throw new Error('Select one person for the DM channel');
            }

            return {
              name: selectedUser.display_name || selectedUser.email,
              type,
              participantUserId: selectedUser.id,
            };
          })()
        : { name, type };

      await createChannel.mutateAsync(payload);
      toast.success('Channel created');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create channel';
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-105 bg-surface-elevated p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Create Channel</h3>

        <div className="space-y-3">
          {type !== 'dm' ? (
            <>
              <label className="block text-sm">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-white/5 p-2 bg-transparent" />
            </>
          ) : (
            <>
              <label className="block text-sm">Search person by email or name</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all accounts"
                className="w-full rounded-lg border border-white/10 bg-surface-secondary/80 px-3 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary-accent/40 focus:bg-surface-elevated"
              />

              {selectedUser && (
                <div className="flex items-center justify-between rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-300">
                  <span className="text-sm font-medium">{selectedUser.display_name || selectedUser.email}</span>
                  <button type="button" className="text-xs font-semibold uppercase tracking-wider" onClick={() => setSelectedUser(null)}>
                    Clear
                  </button>
                </div>
              )}

              {debounced && suggestions.length > 0 && (
                <ul className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-surface-secondary/95 p-2 shadow-2xl backdrop-blur-sm">
                  {suggestions.map((user) => (
                    <li
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setQuery(user.display_name || user.email);
                        setDebounced('');
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-accent/15 bg-primary-accent/10 font-semibold text-primary-accent">
                          {user.display_name?.[0] ?? user.email?.[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">{user.display_name || user.email}</div>
                          <div className="text-xs text-text-muted">{user.email}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <label className="block text-sm">Type</label>
          <select
            value={type}
            onChange={(e) => {
              const nextType = e.target.value as ChannelType;
              setType(nextType);
              setQuery('');
              setDebounced('');
              setSelectedUser(null);
              if (nextType === 'dm') {
                setName('');
              }
            }}
            className="w-full rounded border border-primary-accent/20 p-2 bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent/20"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="dm">DM</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={submit}
            isLoading={createChannel.isPending}
            disabled={type === 'dm' ? !selectedUser : !name.trim()}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
};
