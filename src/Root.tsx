import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import App from './App.tsx';
import AuthPage from './components/AuthPage.tsx';
import HomePage from './components/HomePage.tsx';
import AboutPage from './components/AboutPage.tsx';
import TermsPage from './components/TermsPage.tsx';
import PrivacyPage from './components/PrivacyPage.tsx';
import RefundPage from './components/RefundPage.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import PasswordResetFlow from './components/PasswordResetFlow.tsx';
import { getToken, getUser, clearSession, AuthUser } from './services/authService.ts';

type Page = 'home' | 'about' | 'terms' | 'privacy' | 'refund' | 'auth' | 'app';

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
    return <App user={fakeUser} onLogout={() => window.close()} reportTabMode={true} />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage onGetStarted={() => navigate('/auth')} onHome={() => navigate('/')} onAbout={() => navigate('/about')} onTerms={() => navigate('/terms')} onPrivacy={() => navigate('/privacy')} onRefund={() => navigate('/refund')} />} />
      <Route path="/about" element={<AboutPage onBack={() => navigate('/')} onTerms={() => navigate('/terms')} onPrivacy={() => navigate('/privacy')} onRefund={() => navigate('/refund')} />} />
      <Route path="/terms" element={<TermsPage onBack={() => navigate('/')} />} />
      <Route path="/privacy" element={<PrivacyPage onBack={() => navigate('/')} />} />
      <Route path="/refund" element={<RefundPage onBack={() => navigate('/')} />} />
      <Route path="/auth" element={<AuthPage onAuth={handleAuth} onBack={() => navigate('/')} />} />
      <Route path="/forget-password" element={<PasswordResetFlow />} />
      <Route path="/app" element={user ? <App user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}

export default function Root() {
  return (
    <BrowserRouter>
      <RootContent />
    </BrowserRouter>
  );
}
