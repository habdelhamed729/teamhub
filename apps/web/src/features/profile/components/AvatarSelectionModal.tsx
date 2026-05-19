import { X, Check } from 'lucide-react';
import { Button } from '@/shared/components/Button';

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onSelect: (avatarUrl: string) => void;
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Milo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Kiki',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Sasha',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Bella',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Identity1',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Identity2',
];

export const AvatarSelectionModal = ({ isOpen, onClose, currentAvatar, onSelect }: AvatarSelectionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface-secondary border border-white/5 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 text-text-primary">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 transition-colors text-text-muted hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold">Choose your Avatar</h2>
          <p className="text-text-secondary mt-1">Select an avatar that represents you across TeamHub.</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8">
          {AVATAR_OPTIONS.map((avatar, index) => {
            const isSelected = currentAvatar === avatar;
            return (
              <button
                key={index}
                onClick={() => onSelect(avatar)}
                className={`
                  relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group
                  ${isSelected ? 'border-primary-accent ring-4 ring-primary-accent/10' : 'border-transparent hover:border-white/10 hover:scale-105'}
                `}
              >
                <img src={avatar} alt={`Avatar option ${index}`} className="w-full h-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-primary-accent/20 flex items-center justify-center">
                    <div className="bg-primary-accent rounded-full p-1 shadow-lg">
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              </button>
            );
          })}
        </div>

        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1 py-3" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
