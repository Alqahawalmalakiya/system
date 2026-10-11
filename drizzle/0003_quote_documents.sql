ALTER TABLE bookings ADD document_type text NOT NULL DEFAULT 'invoice';
ALTER TABLE bookings ADD quote_number text NOT NULL DEFAULT '';
CREATE TABLE quote_numbers (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  booking_id text NOT NULL UNIQUE
);
