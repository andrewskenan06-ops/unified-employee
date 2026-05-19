-- Add branding columns to tenants (idempotent)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS accent_color  TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url      TEXT;
