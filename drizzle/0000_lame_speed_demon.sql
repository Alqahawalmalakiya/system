CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice` text NOT NULL,
	`customer` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`occasion` text NOT NULL,
	`date` text NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`place` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`paid` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text NOT NULL
);
