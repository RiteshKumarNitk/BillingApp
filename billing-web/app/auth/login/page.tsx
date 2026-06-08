"use client";

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, CheckCircle, Shield, BarChart3 } from 'lucide-react';

const REMEMBERED_EMAIL_KEY = 'billingapp_remembered_email';
const REMEMBER_ME_KEY = 'billingapp_remember_me';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const shouldRemember = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (shouldRemember) {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  const handleRememberMe = (checked: boolean) => {
    setRememberMe(checked);
    if (checked) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
      if (email) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      }
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An error occurred during sign in. Please try again.');
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, title: 'Bank-Level Security', desc: 'Your data is encrypted and secure' },
    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track sales, inventory, and trends live' },
    { icon: Zap, title: 'Lightning Fast POS', desc: 'Complete billing in under 10 seconds' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-pink-500/8 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '3s' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative w-full flex flex-col lg:flex-row">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-[55%] flex-col justify-center p-12 xl:p-16 relative">
          <div className="max-w-lg animate-fade-in">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Zap className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold text-white">
                Billing<span className="text-indigo-400">App</span>
              </span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-5 tracking-tight leading-tight">
              Welcome to the future of
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">business management</span>
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-md">
              The all-in-one platform for POS billing, inventory management, and business analytics. Trusted by 500+ businesses.
            </p>

            {/* Features list */}
            <div className="mt-10 space-y-5">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10 group-hover:bg-white/15 transition-colors">
                    <feature.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-white text-sm">{feature.title}</span>
                    <span className="text-slate-400 text-sm"> — {feature.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            n            {/* Trust badges */}
            <div className="mt-12 flex items-center gap-6">
              {['500+ Businesses', '99.9% Uptime', 'SOC 2 Compliant'].map((badge, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-400">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 min-h-screen lg:min-h-0">
          <div className="w-full max-w-md animate-fade-in">
            {/* Mobile brand header */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-4">
                <Zap className="w-7 h-7 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold text-white">BillingApp</h1>
              <p className="text-sm text-slate-300/70 mt-1">Sign in to your dashboard</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/[0.97] backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-8 sm:p-10 border border-white/30">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
                <p className="text-sm text-gray-500 mt-1.5">Enter your credentials to access your account</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2.5 animate-slide-up">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="you@example.com"
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50/50 hover:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => handleRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-4 w-4 rounded border-2 border-gray-300 bg-white transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-600 group-hover:border-gray-400" />
                      <svg className="absolute top-0.5 left-0.5 h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                  </label>
                  {/* <a href="mailto:support@billingapp.com" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Forgot password?
                  </a> */}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <span className="text-sm text-gray-500">Don&apos;t have an account? </span>
                <Link href="/auth/register" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Start free trial
                </Link>
              </div> */}
            </div>

            {/* Back to home link */}
            <div className="mt-6 text-center">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}