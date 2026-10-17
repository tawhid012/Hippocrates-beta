"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  X,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  SquarePen,
  ChevronRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaseSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/hooks/useAppContext";
import { useAuth } from "@/context/AuthContext";
import { formatUserIdentifier } from "@/lib/auth/phoneUtils";
import { CasesListSkeleton } from "@/components/skeletons/CasesListSkeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCaseDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCaseTitle(title: string): string {
  if (!title) return "Health Consultation";
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  if (title.startsWith("Report:") && uuidRegex.test(title)) {
    return "Report Analysis";
  }
  return title;
}

const triggerHaptic = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // safe on web
  }
};

// ---------------------------------------------------------------------------
// Case Item with inline rename + delete
// ---------------------------------------------------------------------------

interface CaseItemProps {
  caseItem: CaseSummary;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => Promise<void>;
}

function CaseItem({ caseItem, isActive, onSelect, onDelete, onRename }: CaseItemProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(caseItem.title);
  const [renameLoading, setRenameLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      setRenameValue(caseItem.title);
      setTimeout(() => inputRef.current?.select(), 30);
    }
  }, [renaming, caseItem.title]);

  const commitRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === caseItem.title) {
      setRenaming(false);
      return;
    }
    setRenameLoading(true);
    try {
      await onRename(trimmed);
    } finally {
      setRenameLoading(false);
      setRenaming(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void commitRename();
    if (e.key === "Escape") setRenaming(false);
  };

  if (confirmingDelete) {
    return (
      <div className="flex items-center justify-between gap-1.5 px-3 py-2.5 my-1 bg-destructive/10 border border-destructive/25 rounded-2xl animate-in fade-in-0 duration-150">
        <span className="text-[12px] font-semibold text-destructive truncate">Delete chat?</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void triggerHaptic();
              setConfirmingDelete(false);
              onDelete();
            }}
            className="px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-semibold hover:bg-destructive/90 transition shadow-xs cursor-pointer"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(false);
            }}
            className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-[11px] font-medium hover:bg-muted/80 transition cursor-pointer border border-border"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative w-full rounded-2xl transition-all duration-150 my-0.5",
        isActive
          ? "bg-accent/15 text-accent ring-1 ring-accent/30 font-medium"
          : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
      )}
    >
      {/* Main clickable row */}
      <button
        type="button"
        onClick={() => {
          if (!renaming) {
            void triggerHaptic();
            onSelect();
          }
        }}
        className="w-full min-w-0 overflow-hidden text-left px-3 py-2.5 cursor-pointer"
      >
        <div className="flex items-start gap-2.5 pr-8 min-w-0">
          <MessageSquare
            className={cn(
              "h-4 w-4 mt-0.5 shrink-0 transition-transform duration-150",
              isActive ? "text-accent" : "text-muted-foreground/70 group-hover:text-foreground"
            )}
            strokeWidth={1.75}
          />
          <div className="min-w-0 flex-1">
            {renaming ? (
              <div className="flex items-center gap-1.5 -mx-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={() => void commitRename()}
                  className="w-full min-w-0 bg-background text-[13px] font-medium text-foreground rounded-lg px-2 py-0.5 outline-none ring-2 ring-accent/50 focus:ring-accent border border-border shadow-xs"
                  disabled={renameLoading}
                />
                {renameLoading ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" />
                ) : (
                  <button
                    type="button"
                    onClick={() => void commitRename()}
                    className="shrink-0 text-accent hover:text-accent/80 p-0.5"
                    title="Save"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setRenaming(false)}
                  className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <p
                className={cn(
                  "text-[13px] truncate leading-snug tracking-[-0.005em]",
                  isActive ? "text-accent font-semibold" : "text-foreground/90 font-medium"
                )}
              >
                {formatCaseTitle(caseItem.title)}
              </p>
            )}

            {!renaming && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 tabular-nums">
                {formatCaseDate(caseItem.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Actions Menu (⋯) */}
      {!renaming && (
        <div
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex items-center transition-all duration-150 z-30",
            isActive
              ? "opacity-100 visible pointer-events-auto"
              : "opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto focus-within:opacity-100 focus-within:visible focus-within:pointer-events-auto"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-all border border-border shadow-2xs"
                title="Conversation actions"
                aria-label="Conversation actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-38 rounded-2xl bg-card border border-border p-1.5 shadow-xl text-card-foreground"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setRenaming(true);
                }}
                className="gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 text-xs font-medium focus:bg-muted focus:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
                className="gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------

interface SidebarProps {
  onNewCase: () => void;
  onSelectCase: (caseId: string) => void;
  onDeleteCase: (caseId: string) => Promise<void>;
  onRenameCase: (caseId: string, newTitle: string) => Promise<void>;
  onOpenSettings: () => void;
  cases: CaseSummary[];
  casesLoading?: boolean;
  activeCaseId?: string | null;
}

export function Sidebar({
  onNewCase,
  onSelectCase,
  onDeleteCase,
  onRenameCase,
  onOpenSettings,
  cases,
  casesLoading = false,
  activeCaseId,
}: SidebarProps) {
  const { sidebarOpen, setSidebarOpen, persona } = useApp();
  const { user, isPatientAccount, isDoctorVerified } = useAuth();
  const isPatient = persona === "patient";

  const identifier = formatUserIdentifier(user);
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    identifier ||
    (isPatient ? "Patient" : "Doctor");

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined);

  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "H";

  const isCurrentDoctor = persona === "doctor" || user?.user_metadata?.role === "doctor";

  const handleNewChat = () => {
    void triggerHaptic();
    onNewCase();
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleProfileClick = () => {
    void triggerHaptic();
    onOpenSettings();
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop for phones (< 768px) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Drawer */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : -320,
          opacity: sidebarOpen ? 1 : 0.8,
        }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className={cn(
          // Mobile: Full-height native Android drawer docked from left top to bottom above header
          "fixed inset-y-0 left-0 z-[90] flex h-full w-[84vw] max-w-[320px] flex-col overflow-hidden bg-card text-foreground border-r border-border shadow-2xl pt-safe pb-safe",
          // Desktop: relative flex column
          "md:relative md:z-30 md:h-full md:shrink-0 md:transform-none",
          sidebarOpen ? "w-[280px] min-w-[280px]" : "md:w-0 md:min-w-0 md:pointer-events-none md:border-r-0 hidden md:flex"
        )}
      >
        <div className="flex h-full w-full flex-col">
          {/* Native Drawer Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="relative p-1 rounded-xl bg-muted border border-border shadow-2xs">
                <Image
                  src="/logo.jpg"
                  alt="Hippocrates"
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-lg object-contain"
                  priority
                />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground leading-tight">
                  HIPPOCRATES
                </h2>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isPatient ? "Patient Health AI" : "Physician Copilot"}
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden shrink-0 text-muted-foreground hover:text-foreground rounded-xl"
              onClick={() => {
                void triggerHaptic();
                setSidebarOpen(false);
              }}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>

          {/* New Chat Primary Action Button */}
          <div className="p-3 space-y-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-accent text-accent-foreground font-semibold text-xs shadow-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                <span>{isPatient ? "New Consultation" : "New Clinical Case"}</span>
              </span>
              <SquarePen className="h-4 w-4 opacity-75" />
            </button>
          </div>

          {/* Previous Consultations / Cases */}
          <div className="flex-1 overflow-hidden px-3">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {isPatient ? "Recent Consultations" : "Case Records"}
              </span>
              {cases.length > 0 && (
                <span className="text-[10px] text-muted-foreground/60 tabular-nums font-mono">
                  {cases.length}
                </span>
              )}
            </div>

            <ScrollArea className="h-[calc(100%-1.75rem)]">
              <div className="space-y-0.5 pr-1 pb-4">
                {casesLoading && (
                  <div className="px-1 py-1 space-y-2">
                    <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground font-medium">
                      <Loader2 className="h-3 w-3 animate-spin text-accent" strokeWidth={2} />
                      <span>Syncing clinical records…</span>
                    </div>
                    <CasesListSkeleton count={4} />
                  </div>
                )}

                {!casesLoading && cases.length === 0 && (
                  <div className="rounded-2xl px-4 py-6 text-center text-[12px] leading-relaxed text-muted-foreground bg-muted/30 border border-border/50 my-2">
                    {isPatient
                      ? "No previous consultations yet. Ask Aegis a health question or tap a suggestion above to start."
                      : "No saved cases yet. Start a new case to review clinical differential."}
                  </div>
                )}

                {!casesLoading &&
                  cases.map((caseItem) => (
                    <CaseItem
                      key={caseItem.id}
                      caseItem={caseItem}
                      isActive={activeCaseId === caseItem.id}
                      onSelect={() => {
                        onSelectCase(caseItem.id);
                        if (typeof window !== "undefined" && window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      onDelete={() => void onDeleteCase(caseItem.id)}
                      onRename={(newTitle) => onRenameCase(caseItem.id, newTitle)}
                    />
                  ))}
              </div>
            </ScrollArea>
          </div>

          {/* Drawer Footer: User Profile Card (Clicking opens Settings & Theme Controls) */}
          <div className="mt-auto p-3 border-t border-border/60 bg-card">
            <button
              type="button"
              onClick={handleProfileClick}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-muted/50 hover:bg-muted text-foreground transition-all duration-150 border border-border/80 group cursor-pointer shadow-2xs text-left"
              aria-label="User Profile and Settings"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* User Avatar */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover border border-border shadow-xs"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  ) : (
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                        isCurrentDoctor
                          ? "bg-slate-900 dark:bg-slate-800 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {initials || <User className="h-4 w-4" />}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                      isPatientAccount
                        ? "bg-blue-500"
                        : isDoctorVerified
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                  />
                </div>

                {/* Name & Role */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate leading-tight group-hover:text-accent transition-colors">
                    {fullName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5 font-sans">
                    {isPatientAccount ? "Patient • Aegis" : isCurrentDoctor ? "Doctor • Oracle" : "Account & Themes"}
                  </p>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mini Rail on Desktop when sidebar is collapsed */}
      {!sidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="hidden md:flex relative shrink-0 z-30 h-full w-[64px] flex-col items-center py-4 border-r border-border bg-card text-foreground"
        >
          <div className="flex flex-col gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              title="New Consultation"
              className="rounded-2xl h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <SquarePen className="h-4 w-4" strokeWidth={1.8} />
            </Button>
          </div>

          {/* Mini Rail Profile Button at bottom */}
          <div className="mt-auto flex flex-col gap-2 pb-2">
            <button
              type="button"
              onClick={handleProfileClick}
              title={`Profile & Settings (${fullName})`}
              className="relative rounded-full h-10 w-10 flex items-center justify-center p-0.5 border border-border hover:ring-2 hover:ring-accent/40 transition-all cursor-pointer shadow-xs"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  width={34}
                  height={34}
                  className="h-8.5 w-8.5 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <div
                  className={`h-8.5 w-8.5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrentDoctor
                      ? "bg-slate-900 dark:bg-slate-800 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {initials}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                  isPatientAccount
                    ? "bg-blue-500"
                    : isDoctorVerified
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
