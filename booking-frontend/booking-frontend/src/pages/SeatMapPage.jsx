import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchSeatMap, placeHold, releaseHold, confirmBooking, resetSeats } from '../api';
import { useSeatMapSocket } from '../useSeatMapSocket';
import { useAuth } from '../AuthContext';
import PaymentModal from '../components/PaymentModal';
import TicketModal from '../components/TicketModal';
import './SeatMapPage.css';

const EVENT_INSTANCE_ID = 1;
// one random session id per browser tab, mirrors what a real login/session would provide
const SESSION_ID = `session-${Math.random().toString(36).slice(2, 10)}`;

export default function SeatMapPage() {
  const [searchParams] = useSearchParams();
  const movieName = searchParams.get('movie') || 'Interstellar';
  const showTime = searchParams.get('time') || '7:00 PM';
  const format = searchParams.get('format') || '2D';
  const cinema = searchParams.get('cinema') || 'Tickets Cinema: Indore';
  const screen = searchParams.get('screen') || 'CLASSIC';

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [heldByMe, setHeldByMe] = useState(new Set());
  const [banner, setBanner] = useState(null); // { type: 'error'|'success', text }
  const [confirming, setConfirming] = useState(false);
  const [lastBooking, setLastBooking] = useState(null);
  const [bookedSeatsList, setBookedSeatsList] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // Owner state
  const [resetting, setResetting] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const { user, isLoggedIn, token, isOwner, unlockOwner } = useAuth();
  const navigate = useNavigate();

  // merge a live WebSocket update into the seat grid without a full re-fetch
  const handleUpdate = useCallback((update) => {
    setSeats((prev) =>
      prev.map((s) =>
        s.seatInventoryId === update.seatInventoryId ? { ...s, status: update.status } : s
      )
    );
  }, []);

  const connected = useSeatMapSocket(EVENT_INSTANCE_ID, handleUpdate);

  useEffect(() => {
    fetchSeatMap(EVENT_INSTANCE_ID)
      .then(setSeats)
      .catch(() => setBanner({ type: 'error', text: 'Could not reach the booking service. Is it running on :8080?' }))
      .finally(() => setLoading(false));
  }, []);

  const selectedSeats = useMemo(
    () => seats.filter((s) => selected.has(s.seatInventoryId)),
    [seats, selected]
  );
  const totalCents = selectedSeats.reduce((sum, s) => sum + s.priceCents, 0);

  async function toggleSeat(seat) {
    setBanner(null);

    // Require login to select seats
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (selected.has(seat.seatInventoryId)) {
      // deselect: release the hold we placed
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(seat.seatInventoryId);
        return next;
      });
      setHeldByMe((prev) => {
        const next = new Set(prev);
        next.delete(seat.seatInventoryId);
        return next;
      });
      await releaseHold(EVENT_INSTANCE_ID, seatIdFromInventory(seats, seat.seatInventoryId), SESSION_ID, token);
      return;
    }

    if (seat.status !== 'AVAILABLE') return; // HELD by someone else or already BOOKED

    try {
      await placeHold(EVENT_INSTANCE_ID, [seatIdFromInventory(seats, seat.seatInventoryId)], SESSION_ID, token);
      setSelected((prev) => new Set(prev).add(seat.seatInventoryId));
      setHeldByMe((prev) => new Set(prev).add(seat.seatInventoryId));
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    }
  }

  function handleOpenPayment() {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (selected.size === 0) return;
    setPaymentModalOpen(true);
  }

  async function handlePaymentSuccess(paymentData) {
    setConfirming(true);
    setBanner(null);
    try {
      const currentSelectedSeats = [...selectedSeats];
      const result = await confirmBooking({
        userId: user.id,
        eventInstanceId: EVENT_INSTANCE_ID,
        seatInventoryIds: Array.from(selected),
        sessionId: SESSION_ID,
        paymentMethodToken: paymentData.paymentId || 'tok_razorpay',
      }, token);

      setBookedSeatsList(currentSelectedSeats);
      setLastBooking({
        ...result,
        paymentId: paymentData.paymentId,
        paymentMethod: paymentData.method,
      });
      setPaymentModalOpen(false);
      setTicketModalOpen(true);
      setSelected(new Set());
      setHeldByMe(new Set());
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
      throw err;
    } finally {
      setConfirming(false);
    }
  }

  async function handleOwnerReset() {
    if (!isOwner) return;
    setResetting(true);
    setBanner(null);
    try {
      await resetSeats(EVENT_INSTANCE_ID, token, '2005');
      setBanner({ type: 'success', text: '👑 Owner Action: All 50 seats successfully reset to AVAILABLE!' });
      setSelected(new Set());
      setHeldByMe(new Set());
      const freshSeats = await fetchSeatMap(EVENT_INSTANCE_ID);
      setSeats(freshSeats);
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to reset seats' });
    } finally {
      setResetting(false);
    }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    if (unlockOwner(enteredPin)) {
      setPinModalOpen(false);
      setEnteredPin('');
      setPinError('');
      setBanner({ type: 'success', text: '👑 Owner Mode Unlocked for Saksham Pathak' });
    } else {
      setPinError('Incorrect PIN. Please enter your 4-digit Owner PIN.');
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <button onClick={() => navigate(-1)} className="back-link" aria-label="Back">←</button>
          <Link to="/" className="brand-mark">Tickets</Link>
        </div>
        <div className="topbar-right">
          {/* OWNER ONLY: Completely hidden from regular users */}
          {isOwner && (
            <div className="owner-badge-wrap">
              <span className="owner-crown-tag">👑 Saksham (Owner)</span>
              <button
                className="owner-reset-btn"
                onClick={handleOwnerReset}
                disabled={resetting}
                title="Reset all 50 seats back to AVAILABLE"
              >
                {resetting ? 'Resetting…' : '↺ Reset All Seats'}
              </button>
            </div>
          )}

          <div className={`conn-badge ${connected ? 'is-live' : 'is-off'}`}>
            <span className="conn-dot" />
            {connected ? 'Live' : 'Connecting…'}
          </div>
        </div>
      </header>

      <main className="stage">
        <div className="show-header">
          <h1 className="showtitle">
            {movieName} <span className="showtime">· {showTime} ({format})</span>
          </h1>
          <p className="showcinema">{cinema} · {screen}</p>
        </div>

        <div className="screen-wrap" aria-hidden="true">
          <div className="screen-glow" />
          <div className="screen-arc" />
          <span className="screen-label">SCREEN THIS WAY</span>
        </div>

        {loading ? (
          <p className="statusline">Loading seat map…</p>
        ) : (
          <div className="categories">
            {groupByCategory(seats).map(([category, categorySeats]) => (
              <div className="category-block" key={category}>
                <div className="category-header">
                  <span className="category-name">{category}</span>
                  <span className="category-price">
                    ₹{(categorySeats[0].priceCents / 100).toFixed(0)} onwards
                  </span>
                </div>
                <div className="grid">
                  {groupByRow(categorySeats).map(([rowLabel, rowSeats]) => (
                    <div className="row" key={rowLabel}>
                      <span className="row-label">{rowLabel}</span>
                      <div className="row-seats">
                        {rowSeats.map((seat) => (
                          <SeatButton
                            key={seat.seatInventoryId}
                            seat={seat}
                            isSelected={selected.has(seat.seatInventoryId)}
                            onClick={() => toggleSeat(seat)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="legend">
          <LegendItem swatch="available" label="Available" />
          <LegendItem swatch="held" label="Held by another user" />
          <LegendItem swatch="booked" label="Booked" />
          <LegendItem swatch="selected" label="Your selection" />
        </div>
      </main>

      {banner && (
        <div className={`banner banner-${banner.type}`} role="status">
          {banner.text}
        </div>
      )}

      {selected.size > 0 && (
        <div className="tray">
          <div className="tray-info">
            <strong>{selected.size}</strong> seat{selected.size > 1 ? 's' : ''} selected
            <span className="tray-price">₹{(totalCents / 100).toFixed(2)}</span>
          </div>
          <button className="confirm-btn" onClick={handleOpenPayment} disabled={confirming}>
            {confirming ? 'Securing…' : `Proceed to Pay ₹${((totalCents / 100) + 35.40).toFixed(2)}`}
          </button>
        </div>
      )}

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        orderDetails={{
          movieName,
          cinema,
          screen,
          showTime,
          format,
          selectedSeats,
          totalCents,
        }}
        user={user}
        token={token}
      />

      {/* Digital Ticket Modal */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        bookingData={lastBooking}
        orderDetails={{
          movieName,
          cinema,
          screen,
          showTime,
          format,
          selectedSeats: bookedSeatsList,
        }}
        user={user}
      />

      {/* Discreet Owner Unlock Trigger (only shown when not unlocked) */}
      {!isOwner && (
        <button
          className="owner-discreet-trigger"
          onClick={() => { setPinModalOpen(true); setPinError(''); setEnteredPin(''); }}
          title="Owner access"
          aria-label="Owner access"
        >
          🔒
        </button>
      )}

      {/* Owner PIN Authentication Modal */}
      {pinModalOpen && (
        <div className="owner-pin-backdrop" onClick={() => setPinModalOpen(false)}>
          <div className="owner-pin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="owner-pin-header">
              <span className="owner-crown-icon">👑</span>
              <h3>Owner Verification</h3>
              <p>Enter your 4-digit PIN to unlock administrative controls.</p>
            </div>

            <form onSubmit={handlePinSubmit} className="owner-pin-form">
              {pinError && <div className="owner-pin-error">{pinError}</div>}

              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                className="owner-pin-input"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
              />

              <div className="owner-pin-actions">
                <button
                  type="button"
                  className="owner-pin-cancel"
                  onClick={() => setPinModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="owner-pin-submit"
                  disabled={enteredPin.length !== 4}
                >
                  Unlock Controls
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SeatButton({ seat, isSelected, onClick }) {
  const stateClass = isSelected ? 'selected' : seat.status.toLowerCase();
  const disabled = seat.status === 'BOOKED' || (seat.status === 'HELD' && !isSelected);
  return (
    <button
      className={`seat seat-${stateClass}`}
      disabled={disabled}
      onClick={onClick}
      title={`Seat ${seat.row}${seat.seatNumber} · ₹${(seat.priceCents / 100).toFixed(0)}`}
    >
      {seat.seatNumber}
    </button>
  );
}

function LegendItem({ swatch, label }) {
  return (
    <div className="legend-item">
      <span className={`legend-swatch legend-${swatch}`} />
      {label}
    </div>
  );
}

// Fixed front-to-back order so category blocks always render in the same
// sequence regardless of what order the API happens to return rows in -
// matches physical proximity to the screen, closest first.
const CATEGORY_ORDER = ['PRIME', 'CLASSIC', 'CLASSIC PLUS', 'EXECUTIVE'];

function groupByCategory(seats) {
  const map = new Map();
  for (const seat of seats) {
    const cat = seat.category || 'STANDARD';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(seat);
  }
  return Array.from(map.entries()).sort(
    ([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );
}

function groupByRow(seats) {
  const map = new Map();
  for (const seat of seats) {
    if (!map.has(seat.row)) map.set(seat.row, []);
    map.get(seat.row).push(seat);
  }
  for (const list of map.values()) {
    list.sort((a, b) => Number(a.seatNumber) - Number(b.seatNumber));
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function seatIdFromInventory(seats, seatInventoryId) {
  const found = seats.find((s) => s.seatInventoryId === seatInventoryId);
  return found ? seatInventoryId : seatInventoryId;
}
