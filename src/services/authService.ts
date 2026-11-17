const API = '/api/auth';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  mobile?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  message: string;
}

export async function registerUser(name: string, email: string, password: string, mobile?: string): Promise<AuthResponse> {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, mobile }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getUser(): AuthUser | null {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('graphia_active_report');
  localStorage.removeItem('graphia_draft_studentName');
  localStorage.removeItem('graphia_draft_schoolName');
  localStorage.removeItem('graphia_draft_cityName');
  localStorage.removeItem('graphia_draft_countryName');
  localStorage.removeItem('graphia_draft_uploadedBy');
  localStorage.removeItem('graphia_draft_contactEmail');
  localStorage.removeItem('graphia_draft_contactPhone');
  localStorage.removeItem('graphia_draft_interventionTried');
  localStorage.removeItem('graphia_draft_interventionImproved');
  localStorage.removeItem('graphia_draft_interventionDetails');
  localStorage.removeItem('graphia_draft_grade');
  localStorage.removeItem('graphia_draft_timeTaken');
  localStorage.removeItem('graphia_draft_dob');
  localStorage.removeItem('graphia_draft_context');
}
