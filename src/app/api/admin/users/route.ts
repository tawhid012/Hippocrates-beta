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

    const { data: profiles, error } = await query;
    if (error || !profiles) {
      return apiError(error?.message || "Failed to query user profiles.", 500);
    }

    // Also fetch sessions count per user
    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("user_id");

    const sessionCountByUser: Record<string, number> = {};
    if (sessions) {
      for (const s of sessions) {
        if (s.user_id) {
          sessionCountByUser[s.user_id] = (sessionCountByUser[s.user_id] || 0) + 1;
        }
      }
    }

    let filtered = profiles.map((p) => {
      const isVerified = Boolean(
        p.role === "doctor" &&
        p.doctor_registration_number &&
        p.doctor_registration_number.trim().length >= 3
      );
      return {
        id: p.id,
        email: p.email,
        phone: p.phone,
        fullName: p.full_name || (p.email ? p.email.split("@")[0] : "Unnamed User"),
        role: p.role,
        doctorRegistrationNumber: p.doctor_registration_number,
        isVerified,
        sessionCount: sessionCountByUser[p.id] || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    if (statusFilter === "verified") {
      filtered = filtered.filter((u) => u.isVerified);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((u) => u.role === "doctor" && !u.isVerified);
    }

    if (search) {
      filtered = filtered.filter((u) => {
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
      users: filtered,
      total: filtered.length,
    });
  } catch (err) {
    console.error("[Admin Users] Query error:", err);
    return apiError("Failed to fetch user directory.", 500);
  }
}
