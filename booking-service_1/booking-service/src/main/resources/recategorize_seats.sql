-- Run this AFTER add_more_seats.sql (so all 10 rows, A-J, already exist).
-- mysql -u booking_user -p booking_db < recategorize_seats.sql
--
-- Relabels seat_type into real cinema-style category names and re-prices
-- by row, front-to-back: PRIME (cheapest, closest to screen) up through
-- EXECUTIVE (priciest, furthest back - best view/most legroom), the way
-- real multiplexes tier their pricing. This only changes seat.seat_type
-- and seat_inventory.price_cents - it does NOT touch status/holds, and
-- does not affect any already-completed bookings (booking_seat stores its
-- own price_cents snapshot from the moment of purchase).

UPDATE seat s
JOIN seat_inventory si ON si.seat_id = s.id AND si.event_instance_id = 1
SET
  s.seat_type = CASE
    WHEN s.row_label IN ('A','B') THEN 'PRIME'
    WHEN s.row_label IN ('C','D','E') THEN 'CLASSIC'
    WHEN s.row_label IN ('F','G','H') THEN 'CLASSIC PLUS'
    WHEN s.row_label IN ('I','J') THEN 'EXECUTIVE'
  END,
  si.price_cents = CASE
    WHEN s.row_label IN ('A','B') THEN 15000
    WHEN s.row_label IN ('C','D','E') THEN 20000
    WHEN s.row_label IN ('F','G','H') THEN 25000
    WHEN s.row_label IN ('I','J') THEN 35000
  END
WHERE s.venue_id = 1;

-- sanity check - one row per category with row range and price
SELECT seat_type, MIN(row_label) AS from_row, MAX(row_label) AS to_row,
       price_cents, COUNT(*) AS seat_count
FROM seat s JOIN seat_inventory si ON si.seat_id = s.id AND si.event_instance_id = 1
GROUP BY seat_type, price_cents
ORDER BY price_cents;
