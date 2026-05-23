import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChannels } from '@/features/channels/hooks/useChannels';
import { Button } from '@/shared/components/Button';
import { ChannelCreateModal } from '@/features/channels/components/ChannelCreateModal';
import { MessageSquare, Plus } from 'lucide-react';

export const DirectMessagesPage: React.FC = () => {
  const { workspaceId } = useParams() as { workspaceId: string };
  const { data: channels, isLoading } = useChannels(workspaceId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) return <div className="p-6 text-text-muted">Loading conversations...</div>;

  const dms = channels?.filter(c => c.type === 'dm') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Direct Messages</h2>
          <p className="text-sm text-text-muted">Your private conversations</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>New Message</span>
        </Button>
      </div>

      <div className="grid gap-3">
        {dms.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-surface-secondary/50 p-8 text-center text-text-muted">
            <MessageSquare className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <p>You have no direct messages yet.</p>
            <Button variant="ghost" onClick={() => setIsModalOpen(true)} className="mt-4">
              Start a conversation
            </Button>
          </div>
        ) : (
          dms.map(dm => (
            <Link
              key={dm.id}
              to={`/workspaces/${workspaceId}/channels/${dm.id}`}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-surface-secondary/30 p-4 transition-colors hover:bg-surface-secondary/80 hover:border-primary-accent/30 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-accent/10 font-bold text-primary-accent">
                {dm.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text-primary group-hover:text-primary-accent transition-colors">
                  {dm.name}
                </h3>
                <p className="text-sm text-text-muted mt-0.5">
                  Direct Message
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {isModalOpen && (
        <ChannelCreateModal 
          workspaceId={workspaceId} 
          onClose={() => setIsModalOpen(false)} 
          defaultType="dm"
        />
      )}
    </div>
  );
};
