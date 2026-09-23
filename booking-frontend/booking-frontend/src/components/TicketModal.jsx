import { useNavigate } from 'react-router-dom';
import './TicketModal.css';

export default function TicketModal({
  isOpen,
  onClose,
  bookingData,
  orderDetails,
  user,
}) {
  const navigate = useNavigate();

  if (!isOpen || !bookingData) return null;

  const seatNames = orderDetails.selectedSeats
    .map((s) => `${s.row}${s.seatNumber}`)
    .join(', ');

  const totalRupees = (bookingData.totalAmountCents / 100).toFixed(2);

  function handleDone() {
    onClose();
    navigate('/');
  }

  return (
    <div className="ticket-modal-backdrop">
      <div className="ticket-modal">
        {/* Success Banner */}
        <div className="ticket-success-banner">
          <span className="ticket-check-icon">✓</span>
          <span>Booking & Payment Confirmed!</span>
        </div>

        {/* Ticket Body */}
        <div className="ticket-card">
          <div className="ticket-header">
            <div className="ticket-brand">TICKETS · E-TICKET</div>
            <h2 className="ticket-movie-title">{orderDetails.movieName}</h2>
            <div className="ticket-cinema-line">
              {orderDetails.cinema} · {orderDetails.screen} ({orderDetails.format})
            </div>
          </div>

          <div className="ticket-grid">
            <div className="ticket-attr">
              <span className="ticket-attr-label">Showtime</span>
              <span className="ticket-attr-val">{orderDetails.showTime}</span>
            </div>

            <div className="ticket-attr">
              <span className="ticket-attr-label">Booking ID</span>
              <span className="ticket-attr-val">#{bookingData.bookingId}</span>
            </div>

            <div className="ticket-attr">
              <span className="ticket-attr-label">Seats</span>
              <span className="ticket-attr-val seats">{seatNames}</span>
            </div>

            <div className="ticket-attr">
              <span className="ticket-attr-label">Total Paid</span>
              <span className="ticket-attr-val">₹{totalRupees}</span>
            </div>

            <div className="ticket-attr">
              <span className="ticket-attr-label">Booked By</span>
              <span className="ticket-attr-val">{user?.name || 'Guest'}</span>
            </div>

            <div className="ticket-attr">
              <span className="ticket-attr-label">Payment Ref</span>
              <span className="ticket-attr-val">
                {bookingData.paymentId ? bookingData.paymentId.slice(0, 14) : 'PAID'}
              </span>
            </div>
          </div>

          {/* Notched perforated ticket divider */}
          <div className="ticket-divider" aria-hidden="true">
            <div className="ticket-divider-line" />
          </div>

          {/* Barcode Stub */}
          <div className="ticket-barcode-wrap">
            <div className="ticket-barcode">||| | |||| | |||||| || |</div>
            <div className="ticket-id">Scan at cinema entry counter</div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="ticket-actions">
          <button className="ticket-btn-primary" onClick={handleDone}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
