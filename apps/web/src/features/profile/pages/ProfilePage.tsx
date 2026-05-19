import { useState } from 'react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMe } from '@/features/profile/api/profile.api';
import { User, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { toast } from 'sonner';
import { AvatarSelectionModal } from '@/features/profile/components/AvatarSelectionModal';

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const updateUserStore = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { display_name: string; avatar_url?: string }) => updateMe(data),
    onSuccess: (updatedUser) => {
      updateUserStore(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated successfully!');
    },
  });


  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ 
      display_name: displayName,
      avatar_url: avatarUrl 
    });
  };

  return (
    <section className="p-6 rounded-2xl bg-surface-secondary border border-white/5 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        <User className="h-5 w-5 text-primary-accent" />
        Public Profile
      </h2>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-surface-elevated border border-white/10 flex items-center justify-center text-2xl font-bold text-primary-accent overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.display_name?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => setIsAvatarModalOpen(true)}
            >
              Choose Avatar
            </Button>
            <p className="text-xs text-text-muted mt-2">Pick a premium abstract avatar.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/5 text-sm focus:border-primary-accent outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase">Email Address</label>
            <div className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-sm text-text-muted cursor-not-allowed">
              {user?.email}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={
            updateProfileMutation.isPending || 
            (displayName === user?.display_name && avatarUrl === user?.avatar_url)
          }
        >
          {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Profile Changes
        </Button>
      </form>

      <AvatarSelectionModal 
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={avatarUrl}
        onSelect={(url) => {
          setAvatarUrl(url);
          // Auto-save when avatar is selected? 
          // User preference might be to click 'Save' below, but let's just update local state for now.
        }}
      />
    </section>
  );
};

