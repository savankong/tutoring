ALTER TABLE users
  ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  ADD COLUMN google_id TEXT UNIQUE,
  ALTER COLUMN password_hash DROP NOT NULL;

UPDATE users SET role = 'admin' WHERE email = 'savankong@gmail.com';
