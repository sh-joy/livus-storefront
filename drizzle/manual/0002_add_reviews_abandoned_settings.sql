-- Additive migration: product_reviews, abandoned_checkouts, store_settings
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "customer_name" text NOT NULL,
  "customer_email" text,
  "rating" integer NOT NULL,
  "headline" text,
  "comment" text NOT NULL,
  "status" text DEFAULT 'Pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "abandoned_checkouts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_name" text,
  "phone" text,
  "email" text,
  "items_json" text NOT NULL,
  "subtotal_bdt" integer DEFAULT 0 NOT NULL,
  "is_recovered" boolean DEFAULT false NOT NULL,
  "recovered_at" timestamp,
  "recovery_email_sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "store_settings" (
  "id" text PRIMARY KEY,
  "store_name" text DEFAULT 'LIVUS' NOT NULL,
  "support_email" text DEFAULT 'support@livus.com.bd' NOT NULL,
  "support_phone" text DEFAULT '+880 1711 000000' NOT NULL,
  "currency" text DEFAULT 'BDT' NOT NULL,
  "vat_percent" integer DEFAULT 10 NOT NULL,
  "free_shipping_threshold_bdt" integer DEFAULT 2500 NOT NULL,
  "default_delivery_charge_bdt" integer DEFAULT 150 NOT NULL,
  "bkash_merchant_number" text DEFAULT '01711000000' NOT NULL,
  "nagad_merchant_number" text DEFAULT '01811000000' NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
