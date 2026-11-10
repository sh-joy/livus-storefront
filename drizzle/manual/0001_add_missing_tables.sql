-- Additive only: brings the live DB in line with src/db/schema.ts.
-- Creates missing tables/columns. Never drops or rewrites existing data. Safe to re-run.
-- Run it in the Neon dashboard → SQL Editor (paste & run).

CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "subscribed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "marquee_announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "message" text NOT NULL,
  "link_url" text,
  "bg_color" text DEFAULT '#050505' NOT NULL,
  "text_color" text DEFAULT '#ffffff' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "shipping_regions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "region_name" text NOT NULL UNIQUE,
  "cities" text NOT NULL,
  "delivery_charge_bdt" integer DEFAULT 100 NOT NULL
);

ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "min_cart_value" integer DEFAULT 0 NOT NULL;
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "usage_limit" integer;
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
