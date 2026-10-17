"use client";

import Image from "next/image";
import { Menu, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/hooks/useAppContext";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface HeaderProps {
  onNewCase?: () => void;
}

export function Header({ onNewCase }: HeaderProps) {
  const { toggleSidebar, persona, selectPersona } = useApp();

  const handleMenuClick = () => {
    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}
    toggleSidebar();
  };

  const handleNewChatClick = () => {
    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}
    if (onNewCase) {
      onNewCase();
    }
  };

  const handleLogoClick = () => {
    if (persona) {
      selectPersona(persona);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between px-3 pt-[env(safe-area-inset-top)] sm:px-4 border-b border-border/70 bg-[var(--appbar-bg)] backdrop-blur-xl select-none transition-colors">
      {/* Left: Drawer Toggle */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-9 w-9 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted active:scale-95 transition-all"
          onClick={handleMenuClick}
          aria-label="Open chat drawer"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </Button>
      </div>

      {/* Center: Clean Brand Logo */}
      <button
        onClick={handleLogoClick}
        aria-label="Hippocrates Home"
        className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
      >
        <div className="relative h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-lg overflow-hidden border border-border/80 shadow-2xs shrink-0">
          <Image
            src="/logo.jpg"
            alt="Hippocrates Logo"
            width={30}
            height={30}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <span className="font-bold text-sm sm:text-[15px] tracking-tight text-foreground font-sans">
          Hippocrates
        </span>
      </button>

      {/* Right: New Consultation Action Shortcut */}
      <div className="flex items-center">
        {onNewCase ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleNewChatClick}
            aria-label="Start new consultation"
            title="New Chat"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <SquarePen className="h-4.5 w-4.5" strokeWidth={2} />
          </Button>
        ) : (
          <div className="w-9" />
        )}
      </div>
    </header>
  );
}
