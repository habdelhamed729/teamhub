import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/shared/components/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 animate-zoom-in">
        {/* Close Button */}
        {!isLoading && (
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
            className="absolute right-4 top-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent transition-all"
          />
        )}

        <div className="flex gap-4">
          {/* Warning Icon Badge */}
          {isDanger && (
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-text-primary">
              {title}
            </h3>
            <p className="text-sm text-text-muted mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="secondary"
            size="sm"
            className="rounded-xl font-bold cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            variant={isDanger ? "danger-solid" : "primary"}
            size="sm"
            className="rounded-xl font-bold cursor-pointer"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
