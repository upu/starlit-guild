CREATE TABLE `game_save_backups` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL
);
