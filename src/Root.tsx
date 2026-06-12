import { useState, useEffect } from 'react';
import App from './App.tsx';
import AuthPage from './components/AuthPage.tsx';
import HomePage from './components/HomePage.tsx';
import AboutPage from './components/AboutPage.tsx';
import TermsPage from './components/TermsPage.tsx';
import PrivacyPage from './components/PrivacyPage.tsx';
import RefundPage from './components/RefundPage.tsx';
import { getToken, getUser, clearSession, AuthUser } from './services/authService.ts';

type Page = 'home' | 'about' | 'terms' | 'privacy' | 'refund' | 'auth' | 'app';

export default function Root() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Check if this is a report-only tab
  const isReportTab = new URLSearchParams(window.location.search).get('report') === '1';
  
  // Check if direct page access via URL parameter
  const urlPage = new URLSearchParams(window.location.search).get('page');

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (token && savedUser) {
      setUser(savedUser);
      setCurrentPage('app');
    } else if (urlPage && ['terms', 'privacy', 'refund', 'about'].includes(urlPage)) {
      setCurrentPage(urlPage as Page);
    }
    setChecked(true);
  }, []);

  function handleAuth(authUser: AuthUser, _token: string) {
    setUser(authUser);
    setCurrentPage('app');
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setCurrentPage('home');
  }

  if (!checked) return null;

  // Report tab — skip auth check, load App directly in report-only mode
  if (isReportTab) {
    const fakeUser: AuthUser = getUser() || { id: 0, name: 'User', email: '' };
    return <App user={fakeUser} onLogout={() => window.close()} reportTabMode={true} />;
  }

  // Home page
  if (currentPage === 'home') {
    return (
      <HomePage 
        onGetStarted={() => setCurrentPage('auth')} 
        onAbout={() => setCurrentPage('about')}
        onTerms={() => setCurrentPage('terms')}
        onPrivacy={() => setCurrentPage('privacy')}
        onRefund={() => setCurrentPage('refund')}
      />
    );
  }

  // About page
  if (currentPage === 'about') {
    return (
      <AboutPage 
        onBack={() => setCurrentPage('home')}
        onTerms={() => setCurrentPage('terms')}
        onPrivacy={() => setCurrentPage('privacy')}
        onRefund={() => setCurrentPage('refund')}
      />
    );
  }

  // Terms & Conditions page
  if (currentPage === 'terms') {
    return <TermsPage onBack={() => setCurrentPage('home')} />;
  }

  // Privacy Policy page
  if (currentPage === 'privacy') {
    return <PrivacyPage onBack={() => setCurrentPage('home')} />;
  }

  // Refund & Cancellation Policy page
  if (currentPage === 'refund') {
    return <RefundPage onBack={() => setCurrentPage('home')} />;
  }

  // Auth page
  if (currentPage === 'auth' && !user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // Main app
  if (user) {
    return <App user={user} onLogout={handleLogout} />;
  }

  // Fallback to home
  return (
    <HomePage 
      onGetStarted={() => setCurrentPage('auth')} 
      onAbout={() => setCurrentPage('about')}
    />
  );
}
