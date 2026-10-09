CREATE TABLE `foods` (
	`name` text PRIMARY KEY NOT NULL,
	`price` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_numbers_booking_id_unique` ON `invoice_numbers` (`booking_id`);--> statement-breakpoint
ALTER TABLE `bookings` ADD `mode` text DEFAULT 'hospitality' NOT NULL;