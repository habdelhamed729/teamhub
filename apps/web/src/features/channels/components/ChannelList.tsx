import React, { useState } from 'react';
import { useChannels, useJoinChannel } from '../hooks/useChannels';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import type { Channel } from '@teamhub/shared';
import { ChannelCreateModal } from './ChannelCreateModal.tsx';
import { toast } from 'sonner';

interface Props {
  workspaceId: string;
}

export const ChannelList: React.FC<Props> = ({ workspaceId }) => {
  const { data: channels, isLoading } = useChannels(workspaceId);
  const joinChannel = useJoinChannel(workspaceId);
  const [openCreate, setOpenCreate] = useState(false);
  if (isLoading) return <div>Loading channels...</div>;

  const handleJoin = async (channelId: string) => {
    try {
      await joinChannel.mutateAsync(channelId);
      toast.success('Joined channel');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join channel';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Channels</h3>
          <p className="text-xs text-text-muted">Browse and join workspace channels</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpenCreate(true)}
          className="border-2 border-primary-accent/50 text-primary-accent hover:bg-primary-accent/10 w-full sm:w-auto justify-center"
        >
          Create Channel
        </Button>
      </div>
      <ul className="space-y-3">
        {channels?.length > 0 ? channels.map((c: Channel) => (
          <li key={c.id}>
            <div className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-primary-accent/15 bg-surface-secondary/60 p-4 gap-4 transition-all hover:-translate-y-px hover:border-primary-accent/40 hover:bg-primary-accent/5">
              <Link to={`/workspaces/${workspaceId}/channels/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-accent/15 bg-primary-accent/10 text-primary-accent font-semibold transition-colors group-hover:border-primary-accent/30 shrink-0">
                  #
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-text-primary">{c.name}</span>
                  <span className="text-xs text-text-muted">{c.type === 'public' ? 'Public channel' : c.type === 'private' ? 'Private channel' : 'Direct message'}</span>
                </div>
              </Link>

              <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3 sm:pt-0 sm:border-none">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    c.viewer_is_member
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                      : 'border-white/10 bg-surface-elevated text-text-muted'
                  }`}
                >
                  {c.viewer_is_member ? 'Member' : 'Not joined'}
                </span>
                {c.viewer_can_join && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border-2 border-primary-accent/40 text-primary-accent hover:bg-primary-accent/10"
                    onClick={() => void handleJoin(c.id)}
                  >
                    Join
                  </Button>
                )}
              </div>
            </div>
          </li>
        )) : <h4 className="text-xl mt-8 text-center font-bold">No Channels Found</h4>}
      </ul>
      {openCreate && <ChannelCreateModal workspaceId={workspaceId} onClose={() => setOpenCreate(false)} />}
    </div>
  );
};
