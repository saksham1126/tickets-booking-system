-- reset_all_seats.sql
-- Resets all seats to AVAILABLE and cleans up test bookings

DELETE FROM booking_seat;
DELETE FROM booking;
UPDATE seat_inventory SET status = 'AVAILABLE', held_by_session = NULL, hold_expires_at = NULL;

-- Verification
SELECT status, COUNT(*) AS seat_count FROM seat_inventory GROUP BY status;
