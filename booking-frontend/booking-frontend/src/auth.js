const API_BASE = 'http://localhost:8080/api/auth';

export async function register({ name, mobileNumber, password }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mobileNumber, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

export async function login({ mobileNumber, password }) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

export async function adminLogin({ mobileNumber, pin }) {
  const res = await fetch(`${API_BASE}/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber, pin }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Owner authentication failed');
  }
  return data;
}

export async function fetchProfile(token) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}
