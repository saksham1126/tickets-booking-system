-- Run this AFTER schema.sql, before starting the app.
-- mysql -u booking_user -p booking_db < seed.sql

INSERT INTO app_user (email, name) VALUES
    ('saksham@test.com', 'Saksham'),
    ('rival@test.com', 'Rival Bot');

INSERT INTO venue (name, city) VALUES
    ('PVR Metro', 'Indore');

-- 5 seats in one row, id 1-5
INSERT INTO seat (venue_id, section, row_label, seat_number, seat_type) VALUES
    (1, 'A', 'A', '1', 'REGULAR'),
    (1, 'A', 'A', '2', 'REGULAR'),
    (1, 'A', 'A', '3', 'PREMIUM'),
    (1, 'A', 'A', '4', 'PREMIUM'),
    (1, 'A', 'A', '5', 'REGULAR');

INSERT INTO event_instance (venue_id, title, starts_at, ends_at, status) VALUES
    (1, 'Interstellar 7:00 PM Show',
     NOW() + INTERVAL 1 DAY,
     NOW() + INTERVAL 1 DAY + INTERVAL 3 HOUR,
     'ON_SALE');

-- one seat_inventory row per seat for event_instance_id = 1
INSERT INTO seat_inventory (event_instance_id, seat_id, price_cents, status, version) VALUES
    (1, 1, 25000, 'AVAILABLE', 0),
    (1, 2, 25000, 'AVAILABLE', 0),
    (1, 3, 35000, 'AVAILABLE', 0),
    (1, 4, 35000, 'AVAILABLE', 0),
    (1, 5, 25000, 'AVAILABLE', 0);

-- sanity check
SELECT si.id AS seat_inventory_id, s.row_label, s.seat_number, si.status, si.price_cents
FROM seat_inventory si JOIN seat s ON s.id = si.seat_id
WHERE si.event_instance_id = 1;
