-- Run this AFTER your original schema.sql + seed.sql have already been applied.
-- mysql -u booking_user -p booking_db < add_more_seats.sql
--
-- Adds 9 more rows (B through J, 5 seats each = 45 seats) to the same venue
-- and the same event_instance (id 1). Row A is untouched, so your existing
-- bookings/holds on seats 1-5 are unaffected.
--
-- Assumes seat.id currently ends at 5 (i.e. only row A exists so far). If
-- you've added other seats/venues since the original seed.sql, check
-- `SELECT MAX(id) FROM seat;` first and adjust the seat_id values below.

INSERT INTO seat (venue_id, section, row_label, seat_number, seat_type) VALUES
    (1, 'A', 'B', '1', 'PREMIUM'),
    (1, 'A', 'B', '2', 'PREMIUM'),
    (1, 'A', 'B', '3', 'PREMIUM'),
    (1, 'A', 'B', '4', 'PREMIUM'),
    (1, 'A', 'B', '5', 'PREMIUM'),
    (1, 'A', 'C', '1', 'PREMIUM'),
    (1, 'A', 'C', '2', 'PREMIUM'),
    (1, 'A', 'C', '3', 'PREMIUM'),
    (1, 'A', 'C', '4', 'PREMIUM'),
    (1, 'A', 'C', '5', 'PREMIUM'),
    (1, 'A', 'D', '1', 'REGULAR'),
    (1, 'A', 'D', '2', 'REGULAR'),
    (1, 'A', 'D', '3', 'REGULAR'),
    (1, 'A', 'D', '4', 'REGULAR'),
    (1, 'A', 'D', '5', 'REGULAR'),
    (1, 'A', 'E', '1', 'REGULAR'),
    (1, 'A', 'E', '2', 'REGULAR'),
    (1, 'A', 'E', '3', 'REGULAR'),
    (1, 'A', 'E', '4', 'REGULAR'),
    (1, 'A', 'E', '5', 'REGULAR'),
    (1, 'A', 'F', '1', 'REGULAR'),
    (1, 'A', 'F', '2', 'REGULAR'),
    (1, 'A', 'F', '3', 'REGULAR'),
    (1, 'A', 'F', '4', 'REGULAR'),
    (1, 'A', 'F', '5', 'REGULAR'),
    (1, 'A', 'G', '1', 'REGULAR'),
    (1, 'A', 'G', '2', 'REGULAR'),
    (1, 'A', 'G', '3', 'REGULAR'),
    (1, 'A', 'G', '4', 'REGULAR'),
    (1, 'A', 'G', '5', 'REGULAR'),
    (1, 'A', 'H', '1', 'REGULAR'),
    (1, 'A', 'H', '2', 'REGULAR'),
    (1, 'A', 'H', '3', 'REGULAR'),
    (1, 'A', 'H', '4', 'REGULAR'),
    (1, 'A', 'H', '5', 'REGULAR'),
    (1, 'A', 'I', '1', 'REGULAR'),
    (1, 'A', 'I', '2', 'REGULAR'),
    (1, 'A', 'I', '3', 'REGULAR'),
    (1, 'A', 'I', '4', 'REGULAR'),
    (1, 'A', 'I', '5', 'REGULAR'),
    (1, 'A', 'J', '1', 'REGULAR'),
    (1, 'A', 'J', '2', 'REGULAR'),
    (1, 'A', 'J', '3', 'REGULAR'),
    (1, 'A', 'J', '4', 'REGULAR'),
    (1, 'A', 'J', '5', 'REGULAR');

-- seat_inventory rows for event_instance_id = 1, matching the seat ids
-- that were just auto-generated above (6 through 50, continuing from
-- the original seed's seats 1-5)
INSERT INTO seat_inventory (event_instance_id, seat_id, price_cents, status, version) VALUES
    (1, 6, 35000, 'AVAILABLE', 0),
    (1, 7, 35000, 'AVAILABLE', 0),
    (1, 8, 35000, 'AVAILABLE', 0),
    (1, 9, 35000, 'AVAILABLE', 0),
    (1, 10, 35000, 'AVAILABLE', 0),
    (1, 11, 35000, 'AVAILABLE', 0),
    (1, 12, 35000, 'AVAILABLE', 0),
    (1, 13, 35000, 'AVAILABLE', 0),
    (1, 14, 35000, 'AVAILABLE', 0),
    (1, 15, 35000, 'AVAILABLE', 0),
    (1, 16, 25000, 'AVAILABLE', 0),
    (1, 17, 25000, 'AVAILABLE', 0),
    (1, 18, 25000, 'AVAILABLE', 0),
    (1, 19, 25000, 'AVAILABLE', 0),
    (1, 20, 25000, 'AVAILABLE', 0),
    (1, 21, 25000, 'AVAILABLE', 0),
    (1, 22, 25000, 'AVAILABLE', 0),
    (1, 23, 25000, 'AVAILABLE', 0),
    (1, 24, 25000, 'AVAILABLE', 0),
    (1, 25, 25000, 'AVAILABLE', 0),
    (1, 26, 25000, 'AVAILABLE', 0),
    (1, 27, 25000, 'AVAILABLE', 0),
    (1, 28, 25000, 'AVAILABLE', 0),
    (1, 29, 25000, 'AVAILABLE', 0),
    (1, 30, 25000, 'AVAILABLE', 0),
    (1, 31, 25000, 'AVAILABLE', 0),
    (1, 32, 25000, 'AVAILABLE', 0),
    (1, 33, 25000, 'AVAILABLE', 0),
    (1, 34, 25000, 'AVAILABLE', 0),
    (1, 35, 25000, 'AVAILABLE', 0),
    (1, 36, 25000, 'AVAILABLE', 0),
    (1, 37, 25000, 'AVAILABLE', 0),
    (1, 38, 25000, 'AVAILABLE', 0),
    (1, 39, 25000, 'AVAILABLE', 0),
    (1, 40, 25000, 'AVAILABLE', 0),
    (1, 41, 25000, 'AVAILABLE', 0),
    (1, 42, 25000, 'AVAILABLE', 0),
    (1, 43, 25000, 'AVAILABLE', 0),
    (1, 44, 25000, 'AVAILABLE', 0),
    (1, 45, 25000, 'AVAILABLE', 0),
    (1, 46, 25000, 'AVAILABLE', 0),
    (1, 47, 25000, 'AVAILABLE', 0),
    (1, 48, 25000, 'AVAILABLE', 0),
    (1, 49, 25000, 'AVAILABLE', 0),
    (1, 50, 25000, 'AVAILABLE', 0);

-- sanity check - should return 50 rows total (5 original + 45 new)
SELECT COUNT(*) AS total_seats FROM seat_inventory WHERE event_instance_id = 1;
