const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const API_BASE = `${BACKEND_URL}/api`;

// Helper: build headers with optional auth token
function authHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function fetchSeatMap(eventInstanceId) {
  const res = await fetch(`${API_BASE}/events/${eventInstanceId}/seatmap`);
  if (!res.ok) throw new Error('Failed to load seat map');
  return res.json();
}

export async function placeHold(eventInstanceId, seatIds, sessionId, token) {
  const res = await fetch(`${API_BASE}/holds`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ eventInstanceId, seatIds, sessionId }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Could not hold seat');
    err.code = data.error;
    throw err;
  }
  return data;
}

export async function releaseHold(eventInstanceId, seatId, sessionId, token) {
  const params = new URLSearchParams({ eventInstanceId, seatId, sessionId });
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  await fetch(`${API_BASE}/holds?${params}`, { method: 'DELETE', headers });
}

export async function confirmBooking({ userId, eventInstanceId, seatInventoryIds, sessionId, paymentMethodToken }, token) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ userId, eventInstanceId, seatInventoryIds, sessionId, paymentMethodToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Could not confirm booking');
    err.code = data.error;
    throw err;
  }
  return data;
}

export async function createPaymentOrder(amountCents, token) {
  const res = await fetch(`${API_BASE}/payment/create-order`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ amountCents, currency: 'INR' }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to initiate payment');
  }
  return data;
}

export async function verifyPaymentSignature(verificationData, token) {
  const res = await fetch(`${API_BASE}/payment/verify`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(verificationData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Payment verification failed');
  }
  return data;
}

// OWNER ONLY: Resets all seats to AVAILABLE and cleans demo bookings
export async function resetSeats(eventInstanceId = 1, token, ownerPin = '2005') {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (ownerPin) headers['X-Owner-PIN'] = ownerPin;

  const res = await fetch(`${API_BASE}/events/${eventInstanceId}/reset`, {
    method: 'POST',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Please restart the backend service (mvn spring-boot:run) to activate the new reset endpoint.');
    }
    throw new Error(data.message || 'Unauthorized: Owner access required');
  }
  return data;
}
