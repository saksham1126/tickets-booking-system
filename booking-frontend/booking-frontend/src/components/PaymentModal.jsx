import { useState } from 'react';
import { createPaymentOrder, verifyPaymentSignature } from '../api';
import './PaymentModal.css';

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  orderDetails,
  user,
  token,
}) {
  const [activeTab, setActiveTab] = useState('razorpay'); // 'razorpay' | 'upi' | 'card'
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPay');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Calculate pricing (amounts in rupees)
  const basePrice = (orderDetails.totalCents / 100);
  const convenienceFee = 30.0;
  const gst = +(convenienceFee * 0.18).toFixed(2);
  const totalAmount = +(basePrice + convenienceFee + gst).toFixed(2);
  const totalPaise = Math.round(totalAmount * 100);

  // Formatter helpers
  const formatCardNumber = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  // 1. Pay with Razorpay Standard Checkout
  async function handleRazorpayPay() {
    setProcessing(true);
    setError('');
    try {
      // Step A: Create order on backend
      const order = await createPaymentOrder(totalPaise, token);

      // Step B: Check Razorpay SDK is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Step C: Open Razorpay modal
      const options = {
        key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TfZIMGmHkbsDiy',
        amount: order.amountCents,
        currency: order.currency || 'INR',
        name: 'Tickets',
        description: `${orderDetails.movieName} · ${orderDetails.cinema}`,
        order_id: order.orderId.startsWith('order_mock_') ? undefined : order.orderId,
        handler: async function (response) {
          try {
            // Verify signature
            if (response.razorpay_signature) {
              await verifyPaymentSignature({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }, token);
            }

            await onPaymentSuccess({
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              orderId: response.razorpay_order_id || order.orderId,
              method: 'Razorpay',
              totalPaid: totalAmount,
            });
          } catch (err) {
            setError(err.message || 'Payment confirmation failed');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          contact: user?.mobileNumber ? `+91${user.mobileNumber}` : '',
        },
        theme: {
          color: '#0a0a0a',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Could not initiate Razorpay payment');
      setProcessing(false);
    }
  }

  // 2. Pay with In-App UPI
  async function handleUpiPay(e) {
    e.preventDefault();
    setProcessing(true);
    setError('');

    // Simulate instant secure UPI processing
    setTimeout(async () => {
      try {
        const dummyPaymentId = `pay_upi_${Date.now().toString(36)}`;
        await onPaymentSuccess({
          paymentId: dummyPaymentId,
          orderId: `ord_upi_${Date.now().toString(36)}`,
          method: `UPI (${selectedUpiApp})`,
          totalPaid: totalAmount,
        });
      } catch (err) {
        setError(err.message || 'Failed to confirm booking after UPI payment');
      } finally {
        setProcessing(false);
      }
    }, 1200);
  }

  // 3. Pay with In-App Card
  async function handleCardPay(e) {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid 16-digit card number');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setError('Please enter a valid expiration MM/YY');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      setError('Please enter a valid 3-digit CVV');
      return;
    }

    setProcessing(true);
    setError('');

    // Simulate card network processing
    setTimeout(async () => {
      try {
        const dummyPaymentId = `pay_card_${Date.now().toString(36)}`;
        await onPaymentSuccess({
          paymentId: dummyPaymentId,
          orderId: `ord_card_${Date.now().toString(36)}`,
          method: 'Credit / Debit Card',
          totalPaid: totalAmount,
        });
      } catch (err) {
        setError(err.message || 'Failed to confirm booking after card payment');
      } finally {
        setProcessing(false);
      }
    }, 1200);
  }

  return (
    <div className="payment-modal-backdrop" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-header">
          <div className="payment-title-wrap">
            <span className="payment-brand-badge">Tickets</span>
            <h2>Secure Checkout</h2>
          </div>
          <button className="payment-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Order Summary */}
        <div className="payment-summary">
          <div className="summary-movie">
            <div>
              <div className="summary-title">{orderDetails.movieName}</div>
              <div className="summary-details">
                <span>{orderDetails.cinema} · {orderDetails.screen}</span>
                <span>{orderDetails.showTime} ({orderDetails.format})</span>
              </div>
            </div>
            <div className="summary-badge">
              {orderDetails.selectedSeats.map((s) => `${s.row}${s.seatNumber}`).join(', ')}
            </div>
          </div>

          <div className="summary-lines">
            <div className="summary-line">
              <span>Tickets ({orderDetails.selectedSeats.length} seats)</span>
              <span>₹{basePrice.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Convenience Fee</span>
              <span>₹{convenienceFee.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Integrated GST (18%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="summary-line summary-total">
              <span>Total Payable</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="payment-tabs">
          <button
            className={`payment-tab ${activeTab === 'razorpay' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('razorpay'); setError(''); }}
          >
            Razorpay
          </button>
          <button
            className={`payment-tab ${activeTab === 'upi' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('upi'); setError(''); }}
          >
            Quick UPI
          </button>
          <button
            className={`payment-tab ${activeTab === 'card' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('card'); setError(''); }}
          >
            Cards
          </button>
        </div>

        {/* Payment Body */}
        <div className="payment-body">
          {error && <div className="payment-error">{error}</div>}

          {/* TAB 1: Razorpay */}
          {activeTab === 'razorpay' && (
            <div className="razorpay-panel">
              <div className="razorpay-logo-badge">
                <span className="badge-dot"></span>
                <span>Secured by Razorpay</span>
              </div>
              <p className="razorpay-desc">
                Fast, seamless, and bank-grade encrypted checkout. Pay securely using UPI, Credit &amp; Debit Cards, NetBanking, or Wallets.
              </p>
              <div className="razorpay-supported">
                <span className="supported-tag">UPI &amp; QR</span>
                <span className="supported-tag">Cards</span>
                <span className="supported-tag">NetBanking</span>
                <span className="supported-tag">Wallets</span>
              </div>
              <button
                className="razorpay-btn"
                onClick={handleRazorpayPay}
                disabled={processing}
              >
                {processing ? 'Connecting to Gateway…' : `Pay ₹${totalAmount.toFixed(2)}`}
              </button>
            </div>
          )}

          {/* TAB 2: Quick UPI */}
          {activeTab === 'upi' && (
            <form className="upi-panel" onSubmit={handleUpiPay}>
              <div className="upi-apps-row">
                {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                  <button
                    key={app}
                    type="button"
                    className={`upi-app-btn ${selectedUpiApp === app ? 'is-selected' : ''}`}
                    onClick={() => setSelectedUpiApp(app)}
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div className="upi-input-wrap">
                <label className="upi-label">UPI ID / VPA</label>
                <input
                  className="upi-field"
                  type="text"
                  placeholder="e.g. mobile@upi or name@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="payment-submit-btn"
                disabled={processing}
              >
                {processing ? 'Processing Payment…' : `Pay ₹${totalAmount.toFixed(2)} via UPI`}
              </button>
            </form>
          )}

          {/* TAB 3: Credit / Debit Card */}
          {activeTab === 'card' && (
            <form className="card-panel" onSubmit={handleCardPay}>
              <label className="card-label">
                Card Number
                <input
                  className="card-input"
                  type="text"
                  placeholder="4532 •••• •••• 8910"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </label>

              <div className="card-row-2">
                <label className="card-label">
                  Expiry
                  <input
                    className="card-input"
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                  />
                </label>
                <label className="card-label">
                  CVV
                  <input
                    className="card-input"
                    type="password"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                </label>
              </div>

              <label className="card-label">
                Cardholder Name
                <input
                  className="card-input"
                  type="text"
                  placeholder="Name on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="payment-submit-btn"
                disabled={processing}
              >
                {processing ? 'Authorizing Card…' : `Pay ₹${totalAmount.toFixed(2)}`}
              </button>
            </form>
          )}

          <div className="payment-secure-badge">
            <span>🔒 256-bit SSL Encrypted & Bank-Grade Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
