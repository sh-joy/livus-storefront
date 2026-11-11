-- 0006: Offer popup (Admin → Offer Popup) and Contact page messages (Admin → Messages).
-- Additive and safe to run more than once.
CREATE TABLE IF NOT EXISTS promo_popup (
  id                text PRIMARY KEY,
  is_enabled        boolean   NOT NULL DEFAULT false,
  image_url         text      NOT NULL DEFAULT '',
  headline          text      NOT NULL DEFAULT '',
  body              text      NOT NULL DEFAULT '',
  button_label      text      NOT NULL DEFAULT 'Join our newsletter',
  fine_print        text      NOT NULL DEFAULT '',
  delay_seconds     integer   NOT NULL DEFAULT 5,
  show_again_days   integer   NOT NULL DEFAULT 3,
  updated_at        timestamp NOT NULL DEFAULT now()
);

-- Starts switched OFF so nothing appears until the owner turns it on in Admin.
INSERT INTO promo_popup (id, headline, body, fine_print)
VALUES (
  'main',
  'Unlock early access to every drop',
  'Sign up to be the first to hear about new LIVUS arrivals, restocks and members-only offers.',
  'By providing your email address, you agree to our Terms & Privacy Policy.'
)
ON CONFLICT (id) DO NOTHING;

-- Messages from the Contact page (Admin → Messages).
CREATE TABLE IF NOT EXISTS contact_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text      NOT NULL,
  email         text      NOT NULL,
  phone         text      NOT NULL,
  order_number  text,
  topic         text      NOT NULL,
  message       text      NOT NULL,
  status        text      NOT NULL DEFAULT 'New',
  created_at    timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages (created_at DESC);
