"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Save,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserSummaryItem {
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
}

interface AdminUserModalProps {
  user: UserSummaryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
  onUserDeleted?: (userId: string) => void;
}

export function AdminUserModal({
  user,
  open,
  onOpenChange,
  onUserUpdated,
  onUserDeleted,
}: AdminUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"doctor" | "patient">("patient");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user && open) {
      setFullName(user.fullName || "");
      setRole(user.role);
      setDoctorRegNo(user.doctorRegistrationNumber || "");
      setIsVerified(user.isVerified);
      setStatusMessage(null);
    }
  }, [user, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          role,
          doctorRegistrationNumber: doctorRegNo.trim() || undefined,
          isVerified,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update user profile.");

      setStatusMessage({ type: "success", text: "User profile updated successfully." });
      onUserUpdated?.();
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update user.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Are you sure you want to permanently delete account for ${user.fullName}? All associated consultation records will be purged.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user account.");
      onUserDeleted?.(user.id);
      onOpenChange(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user account.");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg p-0 overflow-hidden bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl">
        <div className="p-4 sm:p-6 pb-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                User Governance
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1",
                  role === "doctor"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/70"
                    : "bg-blue-50 text-blue-800 border-blue-200/70"
                )}
              >
                {role === "doctor" ? <Stethoscope className="h-3 w-3" /> : <HeartPulse className="h-3 w-3" />}
                {role === "doctor" ? "Physician Account" : "Patient Account"}
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              {user.fullName || "User Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-mono">
              ID: {user.id}
            </DialogDescription>
          </DialogHeader>

          {/* User info meta bar */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
            {user.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-400" />
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1 font-mono">
                <Phone className="h-3 w-3 text-slate-400" />
                {user.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
          {statusMessage && (
            <div
              className={cn(
                "p-3 rounded-xl text-xs flex items-center gap-2",
                statusMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              )}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs font-semibold text-slate-700">
              Full Name
            </Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 text-xs rounded-xl bg-slate-50/70 border-slate-200 focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Account Role</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                  role === "patient"
                    ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                <HeartPulse className="h-3.5 w-3.5" />
                <span>Patient</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                  role === "doctor"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Doctor</span>
              </button>
            </div>
          </div>

          {/* Doctor Verification Section */}
          {role === "doctor" && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950">Medical Council Verification</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    isVerified
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  )}
                >
                  {isVerified ? "Verified" : "Pending Verification"}
                </Badge>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-doctor-reg" className="text-[11px] font-semibold text-emerald-900">
                  Doctor Registration Number
                </Label>
                <Input
                  id="edit-doctor-reg"
                  value={doctorRegNo}
                  onChange={(e) => setDoctorRegNo(e.target.value)}
                  placeholder="e.g. MCI-2018-84920"
                  className="h-9 text-xs rounded-lg bg-white border-emerald-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-900">Physician Credentials Verified:</span>
                <Button
                  type="button"
                  variant={isVerified ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setIsVerified(!isVerified)}
                  className={cn(
                    "h-8 text-xs rounded-lg cursor-pointer",
                    !isVerified && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  {isVerified ? "Revoke Verification" : "Mark as Verified"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs rounded-xl h-9 cursor-pointer"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Delete Account
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs rounded-xl h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-xl h-9 cursor-pointer"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
