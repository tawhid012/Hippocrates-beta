"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Cpu,
  Clock,
  LogOut,
  LayoutDashboard,
  Stethoscope,
  Users,
  FileText,
  Activity,
  ShieldCheck,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  Database,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACTIVE_PROVIDERS,
  FUTURE_PROVIDERS,
  createDefaultProviderStates,
  getActiveProviderName,
  type ProviderId,
  type ProviderState,
} from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ProviderConfigCard,
  FutureProviderCard,
} from "@/components/admin/ProviderConfigCard";
import { AdminCaseModal } from "@/components/admin/AdminCaseModal";
import { AdminUserModal, type UserSummaryItem } from "@/components/admin/AdminUserModal";

type AdminSection = "overview" | "physicians" | "users" | "cases" | "providers" | "health";

interface AnalyticsData {
  metrics: {
    totalUsers: number;
    patientUsers: number;
    doctorUsers: number;
    verifiedDoctors: number;
    unverifiedDoctors: number;
    totalSessions: number;
    aegisSessions: number;
    oracleSessions: number;
    totalMessages: number;
    totalReports: number;
  };
  systemHealth: {
    databaseConnected: boolean;
    databaseLatencyMs: number;
    activeProvider: string;
    geminiConfigured: boolean;
    openaiConfigured: boolean;
    protocolVersion: string;
    clinicalSafetyGuardrails: string;
    emergencyStoppingProtocol: string;
  };
  recentSessions: Array<{
    id: string;
    title: string;
    workspace_type: string;
    model: string;
    last_message_at: string;
    created_at: string;
    user_id?: string | null;
  }>;
  timestamp: string;
}

interface CaseItem {
  id: string;
  title: string;
  workspaceType: "aegis" | "oracle";
  model: string;
  persona: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  userId?: string | null;
  userName: string;
  userEmail: string;
  userRole: string;
  messageCount: number;
  assessmentStatus: string;
  urgencyLevel: string;
  hasRedFlag: boolean;
}

export function AdminPanel() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");

  // Providers state
  const [providerStates, setProviderStates] = useState<Record<ProviderId, ProviderState>>(
    createDefaultProviderStates
  );
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsMessage, setSettingsMessage] = useState("");

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Users state
  const [users, setUsers] = useState<UserSummaryItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "doctor" | "patient">("all");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummaryItem | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // Cases state
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [caseWorkspaceFilter, setCaseWorkspaceFilter] = useState<"all" | "aegis" | "oracle">("all");
  const [loadingCases, setLoadingCases] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseModalOpen, setCaseModalOpen] = useState(false);

  // Health state
  const [healthData, setHealthData] = useState<{
    status: string;
    uptimeSeconds: number;
    database: { status: string; latencyMs: number; error: string | null };
    aiEngine: { activeProvider: string; geminiConfigured: boolean; fastStreamingActive: boolean };
    memory: { rssMb: number; heapUsedMb: number };
    timestamp: string;
  } | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Real-time live data polling state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());

  const activeProviderName = getActiveProviderName(providerStates);

  // 1. Load Settings
  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    setSettingsMessage("");
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const settings = (await response.json().catch(() => ({}))) as {
        activeProvider?: "openai" | "gemini";
        geminiConfigured?: boolean;
        openaiConfigured?: boolean;
        geminiMaskedKey?: string;
        openaiMaskedKey?: string;
        error?: string;
      };

      if (!response.ok) throw new Error(settings.error || "Unable to load settings.");

      const isGeminiActive = settings.activeProvider !== "openai";

      setProviderStates((prev) => ({
        ...prev,
        gemini: {
          ...prev.gemini,
          enabled: isGeminiActive,
          apiKey: "",
          isConfigured: Boolean(settings.geminiConfigured),
          maskedKey: settings.geminiMaskedKey,
          status: settings.geminiConfigured ? "connected" : "not_configured",
        },
        openai: {
          ...prev.openai,
          enabled: settings.activeProvider === "openai",
          apiKey: "",
          isConfigured: Boolean(settings.openaiConfigured),
          maskedKey: settings.openaiMaskedKey,
          status: settings.openaiConfigured ? "connected" : "not_configured",
        },
      }));
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Unable to load settings.");
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // 2. Load Analytics
  const loadAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn("Analytics fetch failed:", err);
    } finally {
      if (!silent) setLoadingAnalytics(false);
    }
  }, []);

  // 3. Load Users
  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userRoleFilter !== "all") params.set("role", userRoleFilter);
      if (userSearch) params.set("search", userSearch);

      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn("Users fetch failed:", err);
    } finally {
      if (!silent) setLoadingUsers(false);
    }
  }, [userRoleFilter, userSearch]);

  // 4. Load Cases
  const loadCases = useCallback(async (silent = false) => {
    if (!silent) setLoadingCases(true);
    try {
      const params = new URLSearchParams();
      if (caseWorkspaceFilter !== "all") params.set("workspace", caseWorkspaceFilter);
      if (caseSearch) params.set("search", caseSearch);

      const res = await fetch(`/api/admin/cases?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setCases(json.cases || []);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn("Cases fetch failed:", err);
    } finally {
      if (!silent) setLoadingCases(false);
    }
  }, [caseWorkspaceFilter, caseSearch]);

  // 5. Load Health
  const loadHealth = useCallback(async (silent = false) => {
    if (!silent) setLoadingHealth(true);
    try {
      const res = await fetch("/api/admin/health", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setHealthData(json);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn("Health check failed:", err);
    } finally {
      if (!silent) setLoadingHealth(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadSettings();
    void loadAnalytics();
  }, [loadSettings, loadAnalytics]);

  // Tab switch effect
  useEffect(() => {
    if (activeSection === "physicians" || activeSection === "users") {
      void loadUsers();
    } else if (activeSection === "cases") {
      void loadCases();
    } else if (activeSection === "health") {
      void loadHealth();
    } else if (activeSection === "overview") {
      void loadAnalytics();
    }
  }, [activeSection, loadUsers, loadCases, loadHealth, loadAnalytics]);

  // Real-time live background polling (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      void loadAnalytics(true);
      if (activeSection === "physicians" || activeSection === "users") {
        void loadUsers(true);
      } else if (activeSection === "cases") {
        void loadCases(true);
      } else if (activeSection === "health") {
        void loadHealth(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeSection, loadAnalytics, loadUsers, loadCases, loadHealth]);

  // Refresh all data
  const handleRefreshAll = () => {
    void loadSettings();
    void loadAnalytics();
    if (activeSection === "physicians" || activeSection === "users") void loadUsers();
    if (activeSection === "cases") void loadCases();
    if (activeSection === "health") void loadHealth();
  };

  // Provider config handlers
  const handleEnable = useCallback((providerId: ProviderId, enabled: boolean) => {
    setProviderStates((prev) => {
      if (enabled) {
        const next = { ...prev };
        for (const id of Object.keys(next) as ProviderId[]) {
          next[id] = {
            ...next[id],
            enabled: id === providerId,
          };
        }
        return next;
      }
      return {
        ...prev,
        [providerId]: { ...prev[providerId], enabled: false },
      };
    });
  }, []);

  const handleApiKeyChange = useCallback((providerId: ProviderId, apiKey: string) => {
    setProviderStates((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        apiKey,
      },
    }));
  }, []);

  const handleTest = useCallback(async (providerId: ProviderId) => {
    if (providerId !== "openai" && providerId !== "gemini") return;

    setProviderStates((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], status: "testing" },
    }));

    try {
      const apiKey = providerStates[providerId].apiKey.trim() || undefined;
      const response = await fetch("/api/admin/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, apiKey }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Connection test failed.");

      setProviderStates((prev) => ({
        ...prev,
        [providerId]: { ...prev[providerId], status: "connected" },
      }));
      setSettingsMessage(`${providerId === "gemini" ? "Google Gemini" : "OpenAI"} connection verified successfully.`);
    } catch (error) {
      setProviderStates((prev) => ({
        ...prev,
        [providerId]: { ...prev[providerId], status: "error" },
      }));
      setSettingsMessage(error instanceof Error ? error.message : "Connection test failed.");
    }
  }, [providerStates]);

  const saveSettings = useCallback(async (providerId: ProviderId) => {
    const activeProvider = providerStates.gemini.enabled ? "gemini" : "openai";
    const apiKeyVal = providerStates[providerId].apiKey.trim();

    const payload: {
      activeProvider: string;
      geminiApiKey?: string;
      openaiApiKey?: string;
    } = {
      activeProvider,
    };

    if (apiKeyVal) {
      if (providerId === "gemini") payload.geminiApiKey = apiKeyVal;
      if (providerId === "openai") payload.openaiApiKey = apiKeyVal;
    }

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as {
      geminiConfigured?: boolean;
      openaiConfigured?: boolean;
      geminiMaskedKey?: string;
      openaiMaskedKey?: string;
      error?: string;
    };

    if (!response.ok) throw new Error(body.error || "Unable to save settings to database.");

    setProviderStates((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        apiKey: "",
        isConfigured: providerId === "gemini" ? Boolean(body.geminiConfigured) : Boolean(body.openaiConfigured),
        maskedKey: providerId === "gemini" ? body.geminiMaskedKey : body.openaiMaskedKey,
        lastSaved: new Date(),
        status: "connected",
      },
    }));

    setSettingsMessage(
      providerId === "gemini"
        ? "Gemini configuration saved to database. Active immediately for all Oracle & Aegis requests."
        : "Settings saved to database successfully."
    );
  }, [providerStates]);

  const handleSave = useCallback((providerId: ProviderId) => {
    if (providerId !== "openai" && providerId !== "gemini") return;
    setSettingsMessage("");

    saveSettings(providerId).catch((error) => {
      setSettingsMessage(error instanceof Error ? error.message : "Unable to save settings.");
    });
  }, [saveSettings]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }, [router]);

  const physiciansList = useMemo(() => {
    return users.filter((u) => u.role === "doctor");
  }, [users]);

  const unverifiedDoctorCount = analytics?.metrics.unverifiedDoctors ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon-sm" asChild className="rounded-xl hover:bg-slate-100">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 text-slate-700" strokeWidth={1.75} />
              </Link>
            </Button>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Hippocrates
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-white border-none shadow-xs">
                  Admin Console
                </Badge>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                Clinical Operations & Engine Governance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live System Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium">
                {activeProviderName || (analytics?.systemHealth.activeProvider === "gemini" ? "Google Gemini Core" : "OpenAI Core")}
              </span>
              {analytics?.systemHealth.databaseLatencyMs !== undefined && (
                <span className="text-slate-400 font-mono text-[11px]">
                  ({analytics.systemHealth.databaseLatencyMs}ms)
                </span>
              )}
            </div>

            {/* Live Auto-Refresh Toggle Badge */}
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              title={
                autoRefresh
                  ? `Real-time live sync active (5s interval). Last synced at ${lastRefreshedAt.toLocaleTimeString()}. Click to pause.`
                  : `Real-time sync paused. Last synced at ${lastRefreshedAt.toLocaleTimeString()}. Click to enable 5s live polling.`
              }
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none",
                autoRefresh
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              )}
            >
              <span className="relative flex h-2 w-2">
                {autoRefresh && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={cn("relative inline-flex rounded-full h-2 w-2", autoRefresh ? "bg-emerald-500" : "bg-slate-400")} />
              </span>
              <span>{autoRefresh ? "LIVE 5s" : "PAUSED"}</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              className="rounded-xl text-xs font-semibold gap-1.5 h-8 border-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", (loadingAnalytics || loadingUsers || loadingCases) && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 gap-1.5 h-8 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-200/60 rounded-2xl border border-slate-200 scrollbar-none shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSection("overview")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeSection === "overview"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <LayoutDashboard className="h-4 w-4 text-blue-600" />
            <span>Overview & Metrics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("physicians")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer relative",
              activeSection === "physicians"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Stethoscope className="h-4 w-4 text-emerald-600" />
            <span>Physicians</span>
            {unverifiedDoctorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {unverifiedDoctorCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("users")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeSection === "users"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Users className="h-4 w-4 text-indigo-600" />
            <span>User Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("cases")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeSection === "cases"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <FileText className="h-4 w-4 text-purple-600" />
            <span>Consultations & Cases</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("providers")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeSection === "providers"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Cpu className="h-4 w-4 text-teal-600" />
            <span>AI Engine & Models</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("health")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeSection === "health"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Activity className="h-4 w-4 text-rose-600" />
            <span>Diagnostics & Health</span>
          </button>
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeSection === "overview" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-400">Total Users</span>
                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">
                    {analytics?.metrics.totalUsers ?? 0}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-500 pt-0">
                  <span className="text-blue-600 font-semibold">{analytics?.metrics.patientUsers ?? 0}</span> Patients ·{" "}
                  <span className="text-emerald-700 font-semibold">{analytics?.metrics.doctorUsers ?? 0}</span> Doctors
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-400">Verified Physicians</span>
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <UserCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">
                    {analytics?.metrics.verifiedDoctors ?? 0}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-500 pt-0 flex items-center justify-between">
                  <span>Medical Council IDs stamped</span>
                  {unverifiedDoctorCount > 0 && (
                    <span className="text-amber-600 font-semibold">{unverifiedDoctorCount} pending review</span>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-400">Consultations</span>
                    <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">
                    {analytics?.metrics.totalSessions ?? 0}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-500 pt-0">
                  <span className="text-blue-600 font-semibold">{analytics?.metrics.aegisSessions ?? 0}</span> Aegis ·{" "}
                  <span className="text-emerald-700 font-semibold">{analytics?.metrics.oracleSessions ?? 0}</span> Oracle
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-400">Clinical Telemetry</span>
                    <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">
                    {analytics?.metrics.totalMessages ?? 0}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-500 pt-0">
                  <span>Messages exchanged · {analytics?.metrics.totalReports ?? 0} reports parsed</span>
                </CardContent>
              </Card>
            </div>

            {/* Middle Section: Engine Health & Protocol Guardrails */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Clinical Engine & Safety Protocol Status</h3>
                  </div>
                  <Badge className="bg-emerald-500 text-white text-[10px]">Operational</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Active Model Engine</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {analytics?.systemHealth.activeProvider === "gemini" ? "Google Gemini 2.5 Flash" : "OpenAI GPT-4o"}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Sub-100ms FastStream
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Clinical Safety Mode</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">Level 1 Emergency Lockdown</span>
                    <span className="text-[10px] text-blue-700 font-medium mt-1 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Red-flag Interceptors Active
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Database & Latency</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      Supabase Cloud ({analytics?.systemHealth.databaseLatencyMs ?? 0}ms)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-1">
                      Zero-cross-user RLS Enforced
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <strong className="text-slate-800">Healthcare Governance Notice:</strong> In accordance with clinical compliance requirements,
                  Aegis (patients) and Oracle (doctors) operate in 100% strict isolation. System prompts are immutable on the critical path.
                </p>
              </Card>

              {/* Quick Actions Panel */}
              <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Administrative Shortcuts</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Quick operations for managing medical practitioners and AI routing.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveSection("physicians")}
                    className="w-full justify-between text-xs font-semibold rounded-xl h-10 border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-emerald-600" />
                      Verify Doctor Registrations
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setActiveSection("cases")}
                    className="w-full justify-between text-xs font-semibold rounded-xl h-10 border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Inspect Consultations Audit
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setActiveSection("providers")}
                    className="w-full justify-between text-xs font-semibold rounded-xl h-10 border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-teal-600" />
                      Configure AI Provider Keys
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Recent Consultations Feed */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Recent Clinical Consultations</h3>
                  <p className="text-xs text-slate-500">Live feed of active sessions across Aegis & Oracle</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("cases")}
                  className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All Cases <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Consultation Title</th>
                      <th className="px-4 py-3">Workspace</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics?.recentSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                          {s.title || "Untitled Consultation"}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                              s.workspace_type === "aegis"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            )}
                          >
                            {s.workspace_type === "aegis" ? "Aegis (Patient)" : "Oracle (Doctor)"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">{s.model}</td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {s.last_message_at ? new Date(s.last_message_at).toLocaleTimeString() : "N/A"}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCaseId(s.id);
                              setCaseModalOpen(true);
                            }}
                            className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!analytics?.recentSessions || analytics.recentSessions.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No consultation records recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 2: PHYSICIANS */}
        {activeSection === "physicians" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-emerald-600" />
                  Physician Verification Directory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review and verify official Medical Council Registration Numbers for clinical copilot access.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search doctor or Reg No..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
                />
              </div>
            </div>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Physician Name</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Registration Number</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Consultations</th>
                      <th className="px-4 py-3">Registered Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {physiciansList.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {doc.fullName}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          <div>{doc.email || "No email"}</div>
                          {doc.phone && <div className="text-[11px] font-mono text-slate-400">{doc.phone}</div>}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 font-semibold">
                          {doc.doctorRegistrationNumber || (
                            <span className="text-amber-600 font-sans italic font-normal">Not Provided</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                              doc.isVerified
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            )}
                          >
                            {doc.isVerified ? "Verified Practitioner" : "Pending Verification"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{doc.sessionCount} cases</td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(doc);
                              setUserModalOpen(true);
                            }}
                            className="h-7 px-3 text-xs rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer"
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {physiciansList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          {loadingUsers ? "Loading physician directory..." : "No doctors found matching criteria."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 3: ALL USERS */}
        {activeSection === "users" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  All User Accounts Directory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete directory of registered patients and medical doctors.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter("all")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      userRoleFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter("patient")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      userRoleFilter === "patient" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500"
                    )}
                  >
                    Patients
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter("doctor")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      userRoleFilter === "doctor" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500"
                    )}
                  >
                    Doctors
                  </button>
                </div>

                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search name, email, phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
                  />
                </div>
              </div>
            </div>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">User Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Mobile Phone</th>
                      <th className="px-4 py-3">Consultations</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-slate-900">{u.fullName}</td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                              u.role === "doctor"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-blue-50 text-blue-700 border-blue-300"
                            )}
                          >
                            {u.role === "doctor" ? "Doctor" : "Patient"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{u.email || "—"}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">{u.phone || "—"}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{u.sessionCount}</td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setUserModalOpen(true);
                            }}
                            className="h-7 px-3 text-xs rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          {loadingUsers ? "Loading user directory..." : "No user accounts found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 4: CASES */}
        {activeSection === "cases" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Clinical Consultations & Case Audit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect conversation transcripts, safety assessment statuses, and clinical notes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCaseWorkspaceFilter("all")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      caseWorkspaceFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaseWorkspaceFilter("aegis")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      caseWorkspaceFilter === "aegis" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500"
                    )}
                  >
                    Aegis (Patient)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaseWorkspaceFilter("oracle")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      caseWorkspaceFilter === "oracle" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500"
                    )}
                  >
                    Oracle (Doctor)
                  </button>
                </div>

                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search cases or ID..."
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
                  />
                </div>
              </div>
            </div>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Consultation Title</th>
                      <th className="px-4 py-3">Workspace</th>
                      <th className="px-4 py-3">Owner User</th>
                      <th className="px-4 py-3">Assessment Status</th>
                      <th className="px-4 py-3">Urgency</th>
                      <th className="px-4 py-3">Turns</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cases.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 max-w-xs truncate">
                          {c.title}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                              c.workspaceType === "aegis"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            )}
                          >
                            {c.workspaceType === "aegis" ? "Aegis" : "Oracle"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          <div className="font-medium text-slate-800">{c.userName}</div>
                          {c.userEmail && <div className="text-[10px] text-slate-400">{c.userEmail}</div>}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                          {c.assessmentStatus}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={c.hasRedFlag ? "destructive" : "secondary"}
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              c.hasRedFlag ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {c.urgencyLevel}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{c.messageCount}</td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString() : "N/A"}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCaseId(c.id);
                              setCaseModalOpen(true);
                            }}
                            className="h-7 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {cases.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                          {loadingCases ? "Loading consultation cases..." : "No consultation cases found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 5: AI ENGINE & PROVIDERS */}
        {activeSection === "providers" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-teal-600" />
                  AI Engine & Model Provider Configuration
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure API keys and select the core language model powering Aegis & Oracle.
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Encrypted Database Storage
              </span>
            </div>

            {(loadingSettings || settingsMessage) && (
              <div className="rounded-2xl p-4 text-xs bg-white border border-slate-200 text-slate-700 shadow-xs flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <span>{loadingSettings ? "Loading provider configurations…" : settingsMessage}</span>
              </div>
            )}

            {ACTIVE_PROVIDERS.map((provider) => (
              <ProviderConfigCard
                key={provider.id}
                provider={provider}
                state={providerStates[provider.id]}
                onEnable={(enabled) => handleEnable(provider.id, enabled)}
                onApiKeyChange={(key) => handleApiKeyChange(provider.id, key)}
                onTest={() => handleTest(provider.id)}
                onSave={() => handleSave(provider.id)}
              />
            ))}

            {/* Clinical Governance Protocol Summary */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Clinical Protocol Immutability & Safety Policy
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hippocrates utilizes specialized system prompt orchestrators (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">aegisSystemPrompt.ts</code> and <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">oracleSystemPrompt.ts</code>).
                These prompts are hardcoded, immutable, and protected from arbitrary prompt drift to ensure patient triage safety and zero diagnostic hallucinations.
              </p>
            </Card>

            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Upcoming Model Integrations</h3>
              <div className="grid gap-3 xl:grid-cols-2">
                {FUTURE_PROVIDERS.map((provider) => (
                  <FutureProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 6: HEALTH & DIAGNOSTICS */}
        {activeSection === "health" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="h-5 w-5 text-rose-600" />
                  System Diagnostics & Security Health
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live telemetry, database latency pings, and security verification.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadHealth()}
                disabled={loadingHealth}
                className="h-9 px-3 text-xs rounded-xl font-semibold gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingHealth && "animate-spin")} />
                Run Diagnostic Ping
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Database Status</span>
                  <Database className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {healthData?.database.status === "connected" ? "Operational" : "Degraded"}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Latency: {healthData?.database.latencyMs ?? 0}ms
                </div>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">System Uptime</span>
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {healthData ? Math.floor(healthData.uptimeSeconds / 60) : 0} minutes
                </div>
                <div className="text-xs text-slate-500">Continuous execution</div>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Memory Footprint</span>
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {healthData?.memory.heapUsedMb ?? 0} MB
                </div>
                <div className="text-xs text-slate-500">Heap Used ({healthData?.memory.rssMb ?? 0} MB RSS)</div>
              </Card>
            </div>

            {/* Security Checklist */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Security & Clinical Compliance Controls
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">HMAC-SHA256 Session Signature</strong>
                    <span className="text-slate-500">Admin cookie verified with timing-safe cryptographic comparisons.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">Brute-Force Lockout Gate</strong>
                    <span className="text-slate-500">Automatic 5-minute lockout after 5 consecutive failed login attempts.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">Per-User Row Level Security (RLS)</strong>
                    <span className="text-slate-500">Cross-user consultation bleed blocked at both API & database layers.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">Doctor Credential Verification Gate</strong>
                    <span className="text-slate-500">Oracle clinical decision support strictly locked without registration ID.</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Case Detail Modal */}
      <AdminCaseModal
        caseId={selectedCaseId}
        open={caseModalOpen}
        onOpenChange={setCaseModalOpen}
        onCaseDeleted={() => {
          void loadCases();
          void loadAnalytics();
        }}
      />

      {/* User Management Modal */}
      <AdminUserModal
        user={selectedUser}
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        onUserUpdated={() => {
          void loadUsers();
          void loadAnalytics();
        }}
        onUserDeleted={() => {
          void loadUsers();
          void loadAnalytics();
        }}
      />
    </div>
  );
}
