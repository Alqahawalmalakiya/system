ALTER TABLE bookings ADD end_time text NOT NULL DEFAULT '';
ALTER TABLE bookings ADD discount_rate integer NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD base_price integer;
ALTER TABLE bookings ADD invoice_group text NOT NULL DEFAULT '';
UPDATE bookings SET base_price = price;
CREATE INDEX bookings_invoice_group_idx ON bookings(invoice_group);
