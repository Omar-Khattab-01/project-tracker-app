CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`start_date` text NOT NULL,
	`target_end_date` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_projects_archived` ON `projects` (`archived`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'Task' NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`start_date` text,
	`due_date` text,
	`percent_complete` integer DEFAULT 0 NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`manual_status_override` text,
	`notes` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`predecessor` integer,
	`created_at` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_project_sort` ON `tasks` (`project_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_tasks_due_date` ON `tasks` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_archived` ON `tasks` (`archived`);--> statement-breakpoint
PRAGMA optimize;
