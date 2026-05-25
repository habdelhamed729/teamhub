import React from "react";
import { ChevronDown } from "lucide-react";

export const BubbleBtn = ({
  onClick,
  isActive,
  children,
  title,
}: {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md transition-all duration-150 shrink-0 ${
      isActive
        ? "bg-primary-accent/20 text-primary-accent shadow-[0_0_8px_rgba(94,234,212,0.15)]"
        : "text-text-secondary hover:text-text-primary hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

export const BubbleDropdown = ({
  label,
  icon,
  isOpen,
  onClick,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) => (
  <div className="relative shrink-0" onMouseDown={(e) => e.stopPropagation()}>
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-150 text-xs font-semibold ${
        isOpen
          ? "bg-primary-accent/20 text-primary-accent shadow-[0_0_8px_rgba(94,234,212,0.15)]"
          : "text-text-secondary hover:text-text-primary hover:bg-white/10"
      }`}
    >
      {icon}
      <span className="hidden md:inline text-[11px] font-semibold">{label}</span>
      <ChevronDown size={11} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    
    {isOpen && (
      <div className="absolute left-0 top-full mt-2 bg-surface-elevated/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 min-w-[145px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
        {children}
      </div>
    )}
  </div>
);

export const DropdownItem = ({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg w-full text-left transition-colors text-xs font-medium ${
      isActive
        ? "bg-primary-accent/15 text-primary-accent"
        : "text-text-secondary hover:text-text-primary hover:bg-white/5"
    }`}
  >
    <div className="shrink-0">{icon}</div>
    <span>{label}</span>
  </button>
);
