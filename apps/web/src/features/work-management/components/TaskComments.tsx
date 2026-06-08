import { useState } from 'react';
import { useTaskComments } from '../hooks/useTaskComments';
import { Button } from '@/shared/components/Button';
import { Send } from 'lucide-react';

export const TaskComments = ({ taskId }: { taskId: string }) => {
  const [content, setContent] = useState('');
  const { comments, isLoading, createComment } = useTaskComments(taskId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment.mutate({ content }, {
      onSuccess: () => setContent('')
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Comments</h3>

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <textarea
            className="w-full bg-surface-secondary border border-white/5 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/50 transition-all resize-none"
            placeholder="Write a comment..."
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={createComment.isPending}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          iconOnly
          icon={<Send className="w-4 h-4" />}
          isLoading={createComment.isPending}
          disabled={!content.trim()}
          className="h-10 w-10 rounded-xl shrink-0"
        />
      </form>

      {/* List Comments */}
      <div className="space-y-6 pb-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 animate-pulse rounded w-1/4" />
                  <div className="h-16 bg-white/5 animate-pulse rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : comments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <Send className="w-5 h-5 opacity-20 rotate-12" />
            </div>
            <p className="text-xs text-text-muted font-medium">No comments yet</p>
            <p className="text-[10px] text-text-muted opacity-60">Be the first to start the conversation!</p>
          </div>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-fade-in group">
              <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-white/5 flex items-center justify-center shrink-0 shadow-sm group-hover:border-white/10 transition-colors">
                {comment.author.avatar_url ? (
                  <img src={comment.author.avatar_url} alt={comment.author.display_name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-[10px] font-bold text-text-muted">
                    {comment.author.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary hover:text-primary-accent transition-colors cursor-default">
                    {comment.author.display_name}
                  </span>
                  <span className="text-[9px] text-text-muted font-medium opacity-60">
                    {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl p-3 text-sm text-text-secondary leading-relaxed shadow-sm group-hover:border-white/10 transition-colors">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
