CREATE TABLE `game_device_backups` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL,
	`revision` integer NOT NULL
);
