import { useState, useEffect } from 'react';
import App from './App.tsx';
import AuthPage from './components/AuthPage.tsx';
import { getToken, getUser, clearSession, AuthUser } from './services/authService.ts';

export default function Root() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  // Check if this is a report-only tab
  const isReportTab = new URLSearchParams(window.location.search).get('report') === '1';

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
  }

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  if (!checked) return null;

  // Report tab — skip auth check, load App directly in report-only mode
  if (isReportTab) {
    const fakeUser: AuthUser = getUser() || { id: 0, name: 'User', email: '' };
    return <App user={fakeUser} onLogout={() => window.close()} reportTabMode={true} />;
  }

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return <App user={user} onLogout={handleLogout} />;
}
