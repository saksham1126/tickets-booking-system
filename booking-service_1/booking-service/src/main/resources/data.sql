-- data.sql: Production Seed Data for Tickets Booking System
-- Uses INSERT IGNORE so it is safe to run multiple times without duplicate errors.

-- 1. Venue
INSERT IGNORE INTO venue (id, name, city) VALUES
    (1, 'Tickets Cinema: Indore', 'Indore');

-- 2. Owner & Test Users
-- Saksham Pathak (Admin) with default password 'password123' (bcrypt)
INSERT IGNORE INTO app_user (id, email, name, mobile_number, password_hash, role) VALUES
    (1, 'saksham@tickets.com', 'Saksham Pathak', '8602891120', '$2a$10$dXJ3SW6G7P50lGmMQJy0fuOPXk7LFG3bGmR6.JbKQo4xnHFOhNe3m', 'ADMIN'),
    (2, 'user@tickets.com', 'Demo User', '9999999001', '$2a$10$dXJ3SW6G7P50lGmMQJy0fuOPXk7LFG3bGmR6.JbKQo4xnHFOhNe3m', 'USER');

-- 3. Event Instance (id: 1)
INSERT IGNORE INTO event_instance (id, venue_id, title, starts_at, ends_at, status) VALUES
    (1, 1, 'Interstellar · 7:00 PM Show', NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY + INTERVAL 3 HOUR, 'ON_SALE');

-- 4. All 50 Seats (Rows A through J, 5 seats per row)
-- Rows A & B: PRIME
INSERT IGNORE INTO seat (id, venue_id, section, row_label, seat_number, seat_type) VALUES
    (1, 1, 'A', 'A', '1', 'PRIME'),
    (2, 1, 'A', 'A', '2', 'PRIME'),
    (3, 1, 'A', 'A', '3', 'PRIME'),
    (4, 1, 'A', 'A', '4', 'PRIME'),
    (5, 1, 'A', 'A', '5', 'PRIME'),
    (6, 1, 'A', 'B', '1', 'PRIME'),
    (7, 1, 'A', 'B', '2', 'PRIME'),
    (8, 1, 'A', 'B', '3', 'PRIME'),
    (9, 1, 'A', 'B', '4', 'PRIME'),
    (10, 1, 'A', 'B', '5', 'PRIME'),

-- Rows C, D, E: CLASSIC
    (11, 1, 'A', 'C', '1', 'CLASSIC'),
    (12, 1, 'A', 'C', '2', 'CLASSIC'),
    (13, 1, 'A', 'C', '3', 'CLASSIC'),
    (14, 1, 'A', 'C', '4', 'CLASSIC'),
    (15, 1, 'A', 'C', '5', 'CLASSIC'),
    (16, 1, 'A', 'D', '1', 'CLASSIC'),
    (17, 1, 'A', 'D', '2', 'CLASSIC'),
    (18, 1, 'A', 'D', '3', 'CLASSIC'),
    (19, 1, 'A', 'D', '4', 'CLASSIC'),
    (20, 1, 'A', 'D', '5', 'CLASSIC'),
    (21, 1, 'A', 'E', '1', 'CLASSIC'),
    (22, 1, 'A', 'E', '2', 'CLASSIC'),
    (23, 1, 'A', 'E', '3', 'CLASSIC'),
    (24, 1, 'A', 'E', '4', 'CLASSIC'),
    (25, 1, 'A', 'E', '5', 'CLASSIC'),

-- Rows F, G, H: CLASSIC PLUS
    (26, 1, 'A', 'F', '1', 'CLASSIC PLUS'),
    (27, 1, 'A', 'F', '2', 'CLASSIC PLUS'),
    (28, 1, 'A', 'F', '3', 'CLASSIC PLUS'),
    (29, 1, 'A', 'F', '4', 'CLASSIC PLUS'),
    (30, 1, 'A', 'F', '5', 'CLASSIC PLUS'),
    (31, 1, 'A', 'G', '1', 'CLASSIC PLUS'),
    (32, 1, 'A', 'G', '2', 'CLASSIC PLUS'),
    (33, 1, 'A', 'G', '3', 'CLASSIC PLUS'),
    (34, 1, 'A', 'G', '4', 'CLASSIC PLUS'),
    (35, 1, 'A', 'G', '5', 'CLASSIC PLUS'),
    (36, 1, 'A', 'H', '1', 'CLASSIC PLUS'),
    (37, 1, 'A', 'H', '2', 'CLASSIC PLUS'),
    (38, 1, 'A', 'H', '3', 'CLASSIC PLUS'),
    (39, 1, 'A', 'H', '4', 'CLASSIC PLUS'),
    (40, 1, 'A', 'H', '5', 'CLASSIC PLUS'),

-- Rows I & J: EXECUTIVE
    (41, 1, 'A', 'I', '1', 'EXECUTIVE'),
    (42, 1, 'A', 'I', '2', 'EXECUTIVE'),
    (43, 1, 'A', 'I', '3', 'EXECUTIVE'),
    (44, 1, 'A', 'I', '4', 'EXECUTIVE'),
    (45, 1, 'A', 'I', '5', 'EXECUTIVE'),
    (46, 1, 'A', 'J', '1', 'EXECUTIVE'),
    (47, 1, 'A', 'J', '2', 'EXECUTIVE'),
    (48, 1, 'A', 'J', '3', 'EXECUTIVE'),
    (49, 1, 'A', 'J', '4', 'EXECUTIVE'),
    (50, 1, 'A', 'J', '5', 'EXECUTIVE');

-- 5. Seat Inventory for Event 1 (50 seats)
-- Rows A & B (PRIME: Rs 150 -> 15000 paise)
INSERT IGNORE INTO seat_inventory (id, event_instance_id, seat_id, price_cents, status, version) VALUES
    (1, 1, 1, 15000, 'AVAILABLE', 0),
    (2, 1, 2, 15000, 'AVAILABLE', 0),
    (3, 1, 3, 15000, 'AVAILABLE', 0),
    (4, 1, 4, 15000, 'AVAILABLE', 0),
    (5, 1, 5, 15000, 'AVAILABLE', 0),
    (6, 1, 6, 15000, 'AVAILABLE', 0),
    (7, 1, 7, 15000, 'AVAILABLE', 0),
    (8, 1, 8, 15000, 'AVAILABLE', 0),
    (9, 1, 9, 15000, 'AVAILABLE', 0),
    (10, 1, 10, 15000, 'AVAILABLE', 0),

-- Rows C, D, E (CLASSIC: Rs 200 -> 20000 paise)
    (11, 1, 11, 20000, 'AVAILABLE', 0),
    (12, 1, 12, 20000, 'AVAILABLE', 0),
    (13, 1, 13, 20000, 'AVAILABLE', 0),
    (14, 1, 14, 20000, 'AVAILABLE', 0),
    (15, 1, 15, 20000, 'AVAILABLE', 0),
    (16, 1, 16, 20000, 'AVAILABLE', 0),
    (17, 1, 17, 20000, 'AVAILABLE', 0),
    (18, 1, 18, 20000, 'AVAILABLE', 0),
    (19, 1, 19, 20000, 'AVAILABLE', 0),
    (20, 1, 20, 20000, 'AVAILABLE', 0),
    (21, 1, 21, 20000, 'AVAILABLE', 0),
    (22, 1, 22, 20000, 'AVAILABLE', 0),
    (23, 1, 23, 20000, 'AVAILABLE', 0),
    (24, 1, 24, 20000, 'AVAILABLE', 0),
    (25, 1, 25, 20000, 'AVAILABLE', 0),

-- Rows F, G, H (CLASSIC PLUS: Rs 250 -> 25000 paise)
    (26, 1, 26, 25000, 'AVAILABLE', 0),
    (27, 1, 27, 25000, 'AVAILABLE', 0),
    (28, 1, 28, 25000, 'AVAILABLE', 0),
    (29, 1, 29, 25000, 'AVAILABLE', 0),
    (30, 1, 30, 25000, 'AVAILABLE', 0),
    (31, 1, 31, 25000, 'AVAILABLE', 0),
    (32, 1, 32, 25000, 'AVAILABLE', 0),
    (33, 1, 33, 25000, 'AVAILABLE', 0),
    (34, 1, 34, 25000, 'AVAILABLE', 0),
    (35, 1, 35, 25000, 'AVAILABLE', 0),
    (36, 1, 36, 25000, 'AVAILABLE', 0),
    (37, 1, 37, 25000, 'AVAILABLE', 0),
    (38, 1, 38, 25000, 'AVAILABLE', 0),
    (39, 1, 39, 25000, 'AVAILABLE', 0),
    (40, 1, 40, 25000, 'AVAILABLE', 0),

-- Rows I & J (EXECUTIVE: Rs 350 -> 35000 paise)
    (41, 1, 41, 35000, 'AVAILABLE', 0),
    (42, 1, 42, 35000, 'AVAILABLE', 0),
    (43, 1, 43, 35000, 'AVAILABLE', 0),
    (44, 1, 44, 35000, 'AVAILABLE', 0),
    (45, 1, 45, 35000, 'AVAILABLE', 0),
    (46, 1, 46, 35000, 'AVAILABLE', 0),
    (47, 1, 47, 35000, 'AVAILABLE', 0),
    (48, 1, 48, 35000, 'AVAILABLE', 0),
    (49, 1, 49, 35000, 'AVAILABLE', 0),
    (50, 1, 50, 35000, 'AVAILABLE', 0);
