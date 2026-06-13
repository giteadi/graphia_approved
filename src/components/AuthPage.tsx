import React, { useState } from 'react';
import { registerUser, loginUser, saveSession, AuthUser } from '../services/authService';
import Navbar from "./Navbar";
import { ArrowLeft } from "lucide-react";
import ForgetPassword from './ForgetPassword';
import VerifyOTP from './VerifyOTP';
import ResetPassword from './ResetPassword';

interface AuthPageProps {
  onAuth: (user: AuthUser, token: string) => void;
  onBack?: () => void;
}

export default function AuthPage({ onAuth, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [passwordFlow, setPasswordFlow] = useState<'none' | 'forget' | 'verify' | 'reset'>('none');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (mode === 'register') {
        res = await registerUser(name, email, password);
      } else {
        res = await loginUser(email, password);
      }
      saveSession(res.token, res.user);
      onAuth(res.user, res.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex flex-col">
      {/* Navbar with back button */}
      <header className="bg-white border-b border-[#e0d9ce] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1a3a4a] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-[#1a3a4a] font-bold text-lg tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
              GraphiaCheck
            </span>
          </div>
          <nav className="flex items-center gap-8">
            {onBack && (
              <button
                onClick={onBack}
                className="text-[#1a1a2e] text-sm hover:text-[#1a3a4a] transition-colors flex items-center gap-1"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Logo / Title */}
          <div className="text-center mb-10">
            <h1 className="font-mono text-3xl font-bold tracking-widest text-[#141414] uppercase">
              Graphia
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#141414] opacity-50 mt-2">
              Handwriting Assessment Tool
            </p>
          </div>

        {/* Card */}
        <div className="bg-white border border-[#141414] p-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#141414] mb-6">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#141414] opacity-60 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full border border-[#141414] bg-transparent px-3 py-2 font-mono text-sm text-[#141414] outline-none focus:ring-1 focus:ring-[#141414]"
                />
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#141414] opacity-60 block mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-[#141414] bg-transparent px-3 py-2 font-mono text-sm text-[#141414] outline-none focus:ring-1 focus:ring-[#141414]"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#141414] opacity-60 block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full border border-[#141414] bg-transparent px-3 py-2 font-mono text-sm text-[#141414] outline-none focus:ring-1 focus:ring-[#141414]"
              />
            </div>

            {error && (
              <p className="font-mono text-[10px] text-red-600 uppercase tracking-wider">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#141414] text-[#E4E3E0] font-mono text-[11px] uppercase tracking-widest py-3 hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle */}
          <p className="font-mono text-[10px] uppercase tracking-wider text-center mt-6 text-[#141414] opacity-60">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="underline opacity-100 font-bold"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>

          {/* Forget Password Link */}
          {mode === 'login' && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-center mt-4 text-[#141414] opacity-60">
              <button
                onClick={() => { setPasswordFlow('forget'); setError(null); }}
                className="underline opacity-100"
              >
                Forget Password?
              </button>
            </p>
          )}
        </div>
        </div>
      </div>

      {/* Password Reset Flow */}
      {passwordFlow === 'forget' && (
        <ForgetPassword
          onBack={() => setPasswordFlow('none')}
          onSuccess={(email) => {
            setResetEmail(email);
            setPasswordFlow('verify');
          }}
        />
      )}

      {passwordFlow === 'verify' && (
        <VerifyOTP
          email={resetEmail}
          onBack={() => setPasswordFlow('forget')}
          onSuccess={(otp) => {
            setResetOtp(otp);
            setPasswordFlow('reset');
          }}
        />
      )}

      {passwordFlow === 'reset' && (
        <ResetPassword
          email={resetEmail}
          otp={resetOtp}
          onBack={() => setPasswordFlow('verify')}
          onSuccess={() => {
            setPasswordFlow('none');
            setMode('login');
            setError(null);
          }}
        />
      )}
    </div>
  );
}
