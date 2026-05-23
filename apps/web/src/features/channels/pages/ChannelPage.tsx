import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetChannel, useCreateChannel } from '../hooks/useChannels';
import { useChannelMembers, useAddChannelMember } from '../hooks/useChannelMembers';
import { useMembers } from '@/features/members/hooks/useMembers';
import { MessageList } from '@/features/messages/components/MessageList';
import { MessageComposer } from '@/features/messages/components/MessageComposer';
import { TypingIndicatorDisplay } from '@/features/messages/components/TypingIndicatorDisplay';
import { useMessageSocket } from '@/features/messages/hooks/useMessageSocket';
import { Button } from '@/shared/components/Button';
import { toast } from 'sonner';
import { MessageSquare, Users, Hash, Send } from 'lucide-react';
import type {WorkspaceMember} from '@teamhub/shared';

export const ChannelPage: React.FC = () => {
  const { workspaceId, channelId } = useParams() as { workspaceId: string; channelId: string };
  const { data: channel, isLoading: loadingChannel } = useGetChannel(workspaceId!, channelId!);
  const { data: members, isLoading: loadingMembers } = useChannelMembers(workspaceId!, channelId!);
  const addMember = useAddChannelMember(workspaceId!, channelId!);
  const createChannel = useCreateChannel(workspaceId!);
  const navigate = useNavigate();

  const { data: workspaceMembers } = useMembers(workspaceId!);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  // Bind real-time socket events for this channel
  useMessageSocket(channelId!);

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

  const handleStartDM = async (userId: string, userName: string) => {
    try {
      const dm = await createChannel.mutateAsync({
        name: userName,
        type: 'dm',
        participantUserId: userId,
      });
      navigate(`/workspaces/${workspaceId}/channels/${dm.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start conversation';
      toast.error(message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -mt-2 -mx-2 lg:-mt-4 lg:-mx-4 lg:h-[calc(100vh-9rem)] border border-white/5 rounded-2xl overflow-hidden bg-surface-primary shadow-2xl">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
         {/* Header */}
         <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-surface-elevated shrink-0">
           <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-accent/10 text-primary-accent">
               {channel?.type === 'dm' ? <MessageSquare className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
             </div>
             <div>
               <h2 className="font-semibold text-lg text-text-primary">{channel?.name}</h2>
               {channel?.type !== 'dm' && <p className="text-xs text-text-muted">{members?.length || 0} members</p>}
             </div>
           </div>
           {channel?.type !== 'dm' && (
             <Button variant="ghost" onClick={() => setShowMembers(!showMembers)} className={showMembers ? 'bg-white/10' : ''}>
               <Users className="h-5 w-5" />
             </Button>
           )}
         </div>
         
         {/* Message List area */}
         <MessageList channelId={channelId!} />

         {/* Composer area */}
         <div className="p-4 bg-surface-elevated shrink-0 relative">
           <TypingIndicatorDisplay channelId={channelId!} />
           <MessageComposer channelId={channelId!} />
         </div>
      </div>

      {/* Members Sidebar */}
      {channel?.type !== 'dm' && showMembers && (
        <div className="w-80 border-l border-white/5 bg-surface-secondary flex flex-col shrink-0 animate-in slide-in-from-right-8">
          <div className="h-16 border-b border-white/5 flex items-center px-6 shrink-0">
            <h3 className="font-semibold text-text-primary">Members</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            <div className="relative">
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Add members..."
                  className="rounded-lg border border-white/10 px-3 py-2 bg-surface-primary w-full text-sm outline-none focus:border-primary-accent/40 focus:bg-surface-elevated transition-colors"
                />
                <Button
                  onClick={() => selectedUserId && handleAdd(selectedUserId)}
                  disabled={addMember.isPending || !selectedUserId}
                  className="px-3"
                >
                  Add
                </Button>
              </div>

              {debounced && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-white/10 bg-surface-elevated shadow-xl">
                  {suggestions.map((s) => (
                    s.user !==undefined && (
                    <li
                      key={s.user.id}
                      onClick={() => { setSelectedUserId(s.user?.id || null); setQuery(s.user?.display_name || s.user?.email || ""); }}
                      className="cursor-pointer px-4 py-3 hover:bg-surface-primary/60 flex items-center gap-3 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary-accent/10 flex items-center justify-center font-semibold text-primary-accent">{s.user.display_name?.[0] ?? s.user.email?.[0]}</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{s.user.display_name || s.user.email}</span>
                        <span className="text-xs text-text-muted truncate">{s.user.email}</span>
                      </div>
                    </li>
                  )))}
                </ul>
              )}
            </div>

            <div>
              {loadingMembers ? (
                <div className="text-sm text-text-muted text-center py-4">Loading members...</div>
              ) : (
                <ul className="space-y-2">
                  {members?.length ? members.map((m: WorkspaceMember) => (
                    <li key={m.user.id} className="rounded-xl border border-white/5 bg-surface-primary/50 px-3 py-2.5 flex items-center justify-between group hover:border-primary-accent/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary-accent/10 flex items-center justify-center font-semibold text-primary-accent shrink-0">{m.user.display_name?.[0] ?? m.user.email?.[0]}</div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate group-hover:text-primary-accent transition-colors">{m.user.display_name || m.user.email}</span>
                          <span className="text-xs text-text-muted truncate">{m.user.email}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleStartDM(m.user.id, m.user.display_name || m.user.email || 'User')}
                        disabled={createChannel.isPending}
                        className="text-text-muted hover:text-primary-accent opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Send Message"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </li>
                  )) : <div className="text-text-muted text-sm text-center">No members in this channel</div>}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelPage;
