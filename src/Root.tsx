import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { getToken, getUser, clearSession, AuthUser } from './services/authService.ts';

// Lazy-loaded route components for optimal initial bundle splitting
const App = lazy(() => import('./App.tsx'));
const AuthPage = lazy(() => import('./components/AuthPage.tsx'));
const HomePage = lazy(() => import('./components/HomePage.tsx'));
const AboutPage = lazy(() => import('./components/AboutPage.tsx'));
const TermsPage = lazy(() => import('./components/TermsPage.tsx'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage.tsx'));
const RefundPage = lazy(() => import('./components/RefundPage.tsx'));
const AdminPanel = lazy(() => import('./components/AdminPanel.tsx'));
const PasswordResetFlow = lazy(() => import('./components/PasswordResetFlow.tsx'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-[#666]">Loading...</span>
      </div>
    </div>
  );
}

function RootContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if this is a report-only tab
  const isReportTab = searchParams.get('report') === '1';

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (token && savedUser) {
      setUser(savedUser);
    }
    setChecked(true);
  }, []);

  function handleAuth(authUser: AuthUser, _token: string) {
    setUser(authUser);
    // Redirect admin to admin panel, others to app
    if (authUser.email === 'admin@graphiacheck.in') {
      navigate('/admin');
    } else {
      navigate('/app');
    }
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    navigate('/');
  }

  if (!checked) return null;

  // Report tab — skip auth check, load App directly in report-only mode
  if (isReportTab) {
    const fakeUser: AuthUser = getUser() || { id: 0, name: 'User', email: '' };
    return (
      <Suspense fallback={<PageFallback />}>
        <App user={fakeUser} onLogout={() => window.close()} reportTabMode={true} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<HomePage onGetStarted={() => navigate('/auth')} onHome={() => navigate('/')} onAbout={() => navigate('/about')} onTerms={() => navigate('/terms')} onPrivacy={() => navigate('/privacy')} onRefund={() => navigate('/refund')} />} />
        <Route path="/about" element={<AboutPage onBack={() => navigate('/')} onTerms={() => navigate('/terms')} onPrivacy={() => navigate('/privacy')} onRefund={() => navigate('/refund')} />} />
        <Route path="/terms" element={<TermsPage onBack={() => navigate('/')} onTerms={() => navigate('/terms')} onPrivacy={() => navigate('/privacy')} onRefund={() => navigate('/refund')} />} />
        <Route path="/privacy" element={<PrivacyPage onBack={() => navigate('/')} onTerms={() => navigate('/terms')} onPrivacy={() => navigate('/privacy')} onRefund={() => navigate('/refund')} />} />
        <Route path="/refund" element={<RefundPage onBack={() => navigate('/')} onTerms={() => navigate('/terms')} onPrivacy={() => navigate('/privacy')} onRefund={() => navigate('/refund')} />} />
        <Route path="/auth" element={<AuthPage onAuth={handleAuth} onBack={() => navigate('/')} />} />
        <Route path="/forget-password" element={<PasswordResetFlow />} />
        <Route path="/app" element={user ? <App user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}

export default function Root() {
  return (
    <BrowserRouter>
      <RootContent />
    </BrowserRouter>
  );
}
