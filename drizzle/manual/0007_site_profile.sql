-- 0007: Site Profile & Brand Settings in site_content table.
-- Additive and safe to run more than once.

CREATE TABLE IF NOT EXISTS site_content (
  key         text      PRIMARY KEY,
  value       text      NOT NULL,
  updated_at  timestamp NOT NULL DEFAULT now()
);

-- Seed default site_profile row if not already present
INSERT INTO site_content (key, value)
VALUES ('site_profile', '{}')
ON CONFLICT (key) DO NOTHING;
