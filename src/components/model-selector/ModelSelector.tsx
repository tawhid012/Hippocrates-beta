"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Check, Shield, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORACLE_MODELS } from "@/config/oracle-models";
import { AEGIS_MODELS } from "@/config/aegis-models";
import { useApp } from "@/hooks/useAppContext";
import { Badge } from "@/components/ui/badge";
import type { AIModelId } from "@/lib/types";

import { Haptics, ImpactStyle } from "@capacitor/haptics";

export function ModelSelector() {
  const { persona, selectedModel, setSelectedModel } = useApp();
  const [open, setOpen] = useState(false);

  const isPatient = persona === "patient";
  const models = isPatient ? AEGIS_MODELS : ORACLE_MODELS;

  // Find selected model definition or fallback to default
  const currentModel =
    models.find((m) => m.id === selectedModel) || models[0];

  const triggerHaptic = () => {
    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}
  };

  const handleSelect = (modelId: string, available: boolean) => {
    if (!available) return;
    triggerHaptic();
    setSelectedModel(modelId as AIModelId);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setOpen(!open);
        }}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-tight",
          "bg-card/95 hover:bg-card text-foreground border border-border/90 transition-all cursor-pointer shadow-md backdrop-blur-md",
          "active:scale-95",
          open && "ring-2 ring-blue-500/30 border-blue-500/50"
        )}
      >
        {isPatient ? (
          <Shield className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.2} />
        ) : (
          <Stethoscope className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.2} />
        )}

        <span className="font-semibold text-foreground/90">{currentModel.name}</span>

        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
          strokeWidth={2.2}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-xs"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-[min(340px,calc(100vw-2rem))] bg-card/95 backdrop-blur-2xl border border-border rounded-2xl p-2 shadow-2xl"
            >
              <div className="px-3 py-2 mb-1 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isPatient ? "Aegis Models (Patient AI)" : "Oracle Models (Doctor AI)"}
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Active
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {isPatient
                    ? "Patient health guidance for symptoms and report interpretation."
                    : "Clinical decision support for certified medical practitioners."}
                </p>
              </div>

              <div className="space-y-1">
                {models.map((model) => {
                  const isSelected = selectedModel === model.id;
                  const isAvailable = model.status === "available";

                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleSelect(model.id, isAvailable)}
                      disabled={!isAvailable}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150",
                        !isAvailable
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-muted/70 active:scale-[0.99]",
                        isSelected &&
                          isAvailable &&
                          "bg-muted/90 font-semibold ring-1 ring-blue-500/30 dark:ring-blue-500/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Sparkles
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              isSelected && isAvailable
                                ? "text-blue-500"
                                : "text-muted-foreground/60"
                            )}
                            strokeWidth={2}
                          />
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              isSelected && isAvailable
                                ? "text-foreground"
                                : "text-foreground/80"
                            )}
                          >
                            {model.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isAvailable && (
                            <Badge variant="upcoming">Coming Soon</Badge>
                          )}
                          {isSelected && isAvailable && (
                            <Check className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.5} />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 ml-5.5 leading-relaxed">
                        {model.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
