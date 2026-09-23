-- add_role_column.sql
-- Adds role column to app_user table and assigns ADMIN role to Saksham Pathak (8602891120)

ALTER TABLE app_user ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Set Admin role for owner
UPDATE app_user SET role = 'ADMIN', name = 'Saksham Pathak' WHERE mobile_number = '8602891120';

-- Also set id = 1 as fallback admin
UPDATE app_user SET role = 'ADMIN' WHERE id = 1;

-- Verify
SELECT id, name, mobile_number, role FROM app_user;
