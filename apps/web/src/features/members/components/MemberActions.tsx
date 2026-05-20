import React from 'react';
import { useUpdateMemberRole, useRemoveMember } from '../hooks/useMembers';
import { Button } from '@/shared/components/Button';
import { toast } from 'sonner';
import type { WorkspaceRole } from '@teamhub/shared';

interface Props {
  workspaceId: string;
  userId: string;
  currentRole: WorkspaceRole;
  actorRole: WorkspaceRole;
  isSelf?: boolean;
}

export const MemberActions: React.FC<Props> = ({ workspaceId, userId, currentRole, actorRole, isSelf = false }) => {
  const update = useUpdateMemberRole(workspaceId);
  const remove = useRemoveMember(workspaceId);

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as WorkspaceRole;
    try {
      await update.mutateAsync({ userId, dto: { role } });
      toast.success('Role updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message);
    }
  };

  const handleRemove = async () => {
    const ok = confirm('Remove this member from the workspace?');
    if (!ok) return;
    try {
      await remove.mutateAsync(userId);
      toast.success('Member removed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      toast.error(message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {actorRole === 'owner' && !isSelf && (
        <select value={currentRole} onChange={handleRoleChange} className="rounded-lg border border-white/10 bg-surface-secondary/80 p-1.5 text-sm text-text-primary outline-none transition-colors focus:border-primary-accent/40">
          <option value="owner">owner</option>
          <option value="admin">admin</option>
          <option value="member">member</option>
        </select>
      )}
      {(actorRole === 'owner' && currentRole !== 'owner') || (actorRole === 'admin' && currentRole === 'member') ? (
        <Button variant="danger" size="sm" onClick={handleRemove}>
          Remove
        </Button>
      ) : null}
    </div>
  );
};
