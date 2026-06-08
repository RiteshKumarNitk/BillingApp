"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Lock, Save, Loader2, Star, Calendar, ShoppingBag, Eye, EyeOff
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  loyaltyPoints: number;
  totalSpent: number;
  _count: { orderRequests: number };
}

export default function CustomerProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customer/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          setName(d.profile.name || "");
          setPhone(d.profile.phone || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const body: any = { name, phone };
      if (newPassword) {
        if (!currentPassword) {
          setError("Current password is required to set a new password");
          setSaving(false);
          return;
        }
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        setSaving(false);
        return;
      }

      if (data.profile) {
        setProfile((prev) => prev ? { ...prev, ...data.profile } : null);
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An error occurred. Please try again.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Failed to load profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account settings</p>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/25">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{profile.name}</h2>
            <p className="text-sm opacity-80">{profile.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <ShoppingBag className="w-4 h-4 opacity-80 mx-auto mb-1" />
            <p className="text-lg font-bold">{profile._count.orderRequests}</p>
            <p className="text-[10px] opacity-70">Orders</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <Star className="w-4 h-4 opacity-80 mx-auto mb-1" />
            <p className="text-lg font-bold">{profile.loyaltyPoints}</p>
            <p className="text-[10px] opacity-70">Points</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <span className="text-sm">₹</span>
            <p className="text-lg font-bold">{profile.totalSpent.toFixed(0)}</p>
            <p className="text-[10px] opacity-70">Spent</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-3 py-2 rounded-xl text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 rounded-xl text-xs">
            Profile updated successfully!
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={profile.email}
              readOnly
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
            />
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          Member since {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Change Password</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </form>

      <div className="h-4" />
    </div>
  );
}
