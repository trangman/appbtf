"use client"

import { useState } from "react";
import Link from "next/link";
import LogoHeader from '@/components/LogoHeader';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("If an account with that email exists, a reset link has been sent.");
      } else {
        setError(data.error || "Unable to send reset email. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-700 rounded-lg p-8 shadow-xl">
                     {/* Logo */}
           <LogoHeader />

          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-slate-300 text-sm mb-4">Better Than Freehold</p>
            <h1 className="text-white text-2xl font-semibold mb-4">
              Reset Your Password
            </h1>
            <p className="text-slate-300 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            {/* Back to Sign In Link */}
            <div className="text-center">
              <Link
                href="/signin"
                className="text-slate-300 hover:text-white text-sm underline"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 