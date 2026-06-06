import { useState } from 'react';
import { useTaskComments } from '../hooks/useTaskComments';
import { Button } from '@/shared/components/Button';
import { Send, User as UserIcon } from 'lucide-react';

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
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : comments?.length === 0 ? (
          <p className="text-xs text-text-muted italic text-center py-4">No comments yet</p>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-white/5 flex items-center justify-center shrink-0">
                {comment.author.avatar_url ? (
                  <img src={comment.author.avatar_url} alt={comment.author.display_name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <UserIcon className="w-4 h-4 text-text-muted" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">{comment.author.display_name}</span>
                  <span className="text-[10px] text-text-muted">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <div className="bg-surface-elevated/50 border border-white/5 rounded-xl p-3 text-sm text-text-secondary leading-relaxed">
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
