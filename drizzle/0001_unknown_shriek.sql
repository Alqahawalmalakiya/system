ALTER TABLE `bookings` ADD `items` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `tax_rate` integer DEFAULT 0 NOT NULL;