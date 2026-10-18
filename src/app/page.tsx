"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { LandingPage } from "@/components/landing/LandingPage";

// Dynamically import the heavy clinical authenticated workspace so unauthenticated
// landing page visitors and crawlers receive an ultra-lightweight initial bundle (<80kB JS)
const AuthenticatedWorkspace = dynamic(
  () =>
    import("@/components/workspace/AuthenticatedWorkspace").then(
      (mod) => mod.AuthenticatedWorkspace
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading Hippocrates Workspace...</p>
        </div>
      </div>
    ),
  }
);

const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((mod) => mod.AuthModal),
  { ssr: false }
);

export default function HomePage() {
  const { user, openAuthModal } = useAuth();

  if (!user) {
    return (
      <>
        <LandingPage
          onSelectPersona={(p) => openAuthModal(p, "signup")}
          onLaunchAegisPro={() => openAuthModal("patient", "signup")}
          onGetStarted={() => openAuthModal("patient", "signup")}
        />
        <AuthModal />
      </>
    );
  }

  return <AuthenticatedWorkspace />;
}
