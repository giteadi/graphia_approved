import { useState, useEffect } from 'react';
import App from './App.tsx';
import AuthPage from './components/AuthPage.tsx';
import { getToken, getUser, clearSession, AuthUser } from './services/authService.ts';

export default function Root() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Restore session from localStorage on page load
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

  if (!checked) return null; // avoid flash

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return <App user={user} onLogout={handleLogout} />;
}
