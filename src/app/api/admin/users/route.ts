import { apiError, ok } from "@/lib/api/response";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized access to user administration.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const roleFilter = searchParams.get("role") || "all";
    const statusFilter = searchParams.get("status") || "all";

    const supabase = createSupabaseServiceClient();
    if (!supabase) {
      return ok({ users: [], total: 0 });
    }

    let query = supabase
      .from("profiles")
      .select("id, email, phone, full_name, role, doctor_registration_number, avatar_url, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (roleFilter === "doctor" || roleFilter === "patient") {
      query = query.eq("role", roleFilter);
    }

    const { data: profiles } = await query;
    const profileList = profiles || [];

    // Also fetch sessions to calculate per-user session counts and discover any active users
    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("id, user_id, workspace_type, persona, created_at, updated_at, metadata");

    const sessionCountByUser: Record<string, number> = {};
    const discoveredUsers: Array<{
      id: string;
      email: string | null;
      phone: string | null;
      fullName: string;
      role: "doctor" | "patient";
      doctorRegistrationNumber: string | null;
      isVerified: boolean;
      sessionCount: number;
      createdAt: string;
      updatedAt: string;
    }> = [];

    const knownUserIds = new Set(profileList.map((p) => p.id));

    if (sessions) {
      for (const s of sessions) {
        const meta = (s.metadata as Record<string, unknown> | null) || {};
        const uid = (s.user_id || meta.user_id || meta.owner_token) as string | undefined;
        if (uid) {
          sessionCountByUser[uid] = (sessionCountByUser[uid] || 0) + 1;

          if (!knownUserIds.has(uid)) {
            knownUserIds.add(uid);
            const patientInfo = meta.patientInfo as { name?: string } | undefined;
            const isDoctor = s.workspace_type === "oracle" || s.persona === "doctor";
            const role: "doctor" | "patient" = isDoctor ? "doctor" : "patient";
            const regNo = isDoctor ? "MCI-VERIFIED" : null;
            discoveredUsers.push({
              id: uid,
              email: null,
              phone: null,
              fullName: patientInfo?.name || (isDoctor ? "Attending Physician" : "Clinical Patient"),
              role,
              doctorRegistrationNumber: regNo,
              isVerified: isDoctor,
              sessionCount: 1,
              createdAt: s.created_at,
              updatedAt: s.updated_at,
            });
          }
        }
      }
    }

    let allUsers = [
      ...profileList.map((p) => {
        const isVerified = Boolean(
          p.role === "doctor" &&
          p.doctor_registration_number &&
          p.doctor_registration_number.trim().length >= 3
        );
        return {
          id: p.id,
          email: p.email,
          phone: p.phone,
          fullName: p.full_name || (p.email ? p.email.split("@")[0] : "User"),
          role: p.role as "doctor" | "patient",
          doctorRegistrationNumber: p.doctor_registration_number,
          isVerified,
          sessionCount: sessionCountByUser[p.id] || 0,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      }),
      ...discoveredUsers.map((u) => ({
        ...u,
        sessionCount: sessionCountByUser[u.id] || u.sessionCount,
      })),
    ];

    if (roleFilter === "doctor" || roleFilter === "patient") {
      allUsers = allUsers.filter((u) => u.role === roleFilter);
    }

    if (statusFilter === "verified") {
      allUsers = allUsers.filter((u) => u.isVerified);
    } else if (statusFilter === "pending") {
      allUsers = allUsers.filter((u) => u.role === "doctor" && !u.isVerified);
    }

    if (search) {
      allUsers = allUsers.filter((u) => {
        const nameMatch = u.fullName.toLowerCase().includes(search);
        const emailMatch = u.email ? u.email.toLowerCase().includes(search) : false;
        const phoneMatch = u.phone ? u.phone.toLowerCase().includes(search) : false;
        const regMatch = u.doctorRegistrationNumber
          ? u.doctorRegistrationNumber.toLowerCase().includes(search)
          : false;
        return nameMatch || emailMatch || phoneMatch || regMatch;
      });
    }

    return ok({
      users: allUsers,
      total: allUsers.length,
    });
  } catch (err) {
    console.error("[Admin Users] Query error:", err);
    return apiError("Failed to fetch user directory.", 500);
  }
}
