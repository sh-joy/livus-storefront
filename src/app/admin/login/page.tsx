'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email address and password.');
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
        setErrorMessage(res.error.message || 'Invalid admin credentials.');
      } else {
        const userRole = (res.data?.user as any)?.role || 'user';
        if (userRole === 'superadmin' || userRole === 'admin') {
          router.push('/admin');
        } else {
          // Sign out regular user from admin portal
          await authClient.signOut();
          setErrorMessage('Access denied: Administrative privileges required.');
        }
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-radial from-neutral-900/50 to-black pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-md bg-[#121212] border border-neutral-800 p-8 shadow-2xl flex flex-col gap-6">
        
        {/* Top Header */}
        <div className="flex flex-col gap-2 text-center items-center">
          <div className="size-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-2 text-amber-400">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-wider text-white">
            LIVUS Admin Portal
          </h1>
          <p className="text-xs text-neutral-400 font-sans">
            Authorized management access for Superadmin &amp; Staff
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs uppercase font-mono tracking-wider text-neutral-300">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@livus.com"
              required
              className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors font-sans"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs uppercase font-mono tracking-wider text-neutral-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="size-4 animate-spin text-black" />}
            <span>{loading ? 'AUTHENTICATING...' : 'ACCESS ADMIN PANEL'}</span>
          </button>
        </form>

        {/* Back Link */}
        <div className="border-t border-neutral-800/80 pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
