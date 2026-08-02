'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both admin email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password: password,
      });

      if (res.error) {
        setErrorMessage(res.error.message || 'Invalid administrative credentials.');
      } else {
        const userRole = (res.data?.user as any)?.role || 'user';
        if (userRole === 'superadmin' || userRole === 'admin') {
          // Set dedicated admin session cookie for admin route isolation
          document.cookie = `livus_admin_session=true; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
          document.cookie = `livus_admin_role=${userRole}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
          router.push('/admin');
        } else {
          // Reject non-admin users from admin portal
          await authClient.signOut();
          document.cookie = 'livus_admin_session=; path=/; max-age=0';
          document.cookie = 'livus_admin_role=; path=/; max-age=0';
          setErrorMessage('Access denied: Administrative privileges required.');
        }
      }
    } catch (err: any) {
      console.error('Admin sign-in error:', err);
      setErrorMessage(err?.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6"
      style={{ fontFamily: "var(--font-geist-sans), Geist, system-ui, sans-serif" }}
    >
      {/* Background Subtle Overlay */}
      <div className="absolute inset-0 bg-radial from-neutral-900/50 to-black pointer-events-none" />

      {/* Main Form Container */}
      <div className="relative w-full max-w-md bg-[#121212] border border-neutral-800 p-8 shadow-2xl flex flex-col gap-6">
        
        {/* Top Header */}
        <div className="flex flex-col gap-2 text-center items-center">
          <div className="size-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-2 text-amber-400">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Admin Sign-in
          </h1>
          <p className="text-xs text-neutral-400">
            Dedicated portal for superadmin and staff administration
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Admin Sign-In Form */}
        <form onSubmit={handleAdminSignIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-medium text-neutral-300">
              Admin email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="off"
              required
              className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-medium text-neutral-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              required
              className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="size-4 animate-spin text-black" />}
            <span>{loading ? 'Authenticating...' : 'Sign in to admin'}</span>
          </button>
        </form>

        {/* Back Link */}
        <div className="border-t border-neutral-800/80 pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
