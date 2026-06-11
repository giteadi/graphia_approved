import React, { useState } from 'react';
import { registerUser, loginUser, saveSession, AuthUser } from '../services/authService';

interface AuthPageProps {
  onAuth: (user: AuthUser, token: string) => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
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
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center px-4">
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
        </div>
      </div>
    </div>
  );
}
