-- auth_migration.sql
-- Run BEFORE restarting the backend after adding the auth code.
-- mysql -u booking_user -p booking_db < auth_migration.sql

-- Step 1: Make email optional (login uses mobile number instead)
ALTER TABLE app_user MODIFY COLUMN email VARCHAR(255) NULL;

-- Step 2: Add new auth columns (nullable first, so existing rows don't break)
ALTER TABLE app_user ADD COLUMN mobile_number VARCHAR(15) NULL;
ALTER TABLE app_user ADD COLUMN password_hash VARCHAR(255) NULL;

-- Step 3: Give existing test users default credentials so NOT NULL can be enforced.
-- Default password for both: password123
-- (This BCrypt hash was generated with cost factor 10)
UPDATE app_user SET mobile_number = '9999999001',
  password_hash = '$2a$10$dXJ3SW6G7P50lGmMQJy0fuOPXk7LFG3bGmR6.JbKQo4xnHFOhNe3m'
  WHERE id = 1;
UPDATE app_user SET mobile_number = '9999999002',
  password_hash = '$2a$10$dXJ3SW6G7P50lGmMQJy0fuOPXk7LFG3bGmR6.JbKQo4xnHFOhNe3m'
  WHERE id = 2;

-- Step 4: Now enforce NOT NULL + UNIQUE on mobile_number
ALTER TABLE app_user MODIFY COLUMN mobile_number VARCHAR(15) NOT NULL;
ALTER TABLE app_user ADD UNIQUE INDEX uq_mobile (mobile_number);

ALTER TABLE app_user MODIFY COLUMN password_hash VARCHAR(255) NOT NULL;

-- Verify
SELECT id, email, name, mobile_number, LEFT(password_hash, 20) AS hash_preview FROM app_user;
