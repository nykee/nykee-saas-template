CREATE TABLE `blog_post` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`author_user_id` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_post_locale_slug_unique` ON `blog_post` (`locale`,`slug`);--> statement-breakpoint
CREATE INDEX `blog_post_locale_status_idx` ON `blog_post` (`locale`,`status`);--> statement-breakpoint
CREATE INDEX `blog_post_published_at_idx` ON `blog_post` (`published_at`);--> statement-breakpoint
-- Better Auth 1.7 requires issuer on every account, including existing rows.
-- Rebuild the child table so SQLite can enforce NOT NULL without inventing a
-- default issuer for future inserts. No table references account, so foreign
-- key enforcement can remain enabled throughout this migration on D1.
CREATE TABLE `__new_account` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Google OAuth and One Tap both use this exact canonical issuer. This
-- template has only enabled Google login. An unrecognized provider produces
-- NULL and fails the NOT NULL constraint before the original table is dropped;
-- customized projects must supply their verified issuer mapping explicitly.
INSERT INTO `__new_account` (
	`id`, `issuer`, `account_id`, `provider_id`, `user_id`, `access_token`,
	`refresh_token`, `id_token`, `access_token_expires_at`,
	`refresh_token_expires_at`, `scope`, `password`, `created_at`, `updated_at`
)
SELECT
	`id`, CASE `provider_id` WHEN 'google' THEN 'https://accounts.google.com' END,
	`account_id`, `provider_id`, `user_id`, `access_token`, `refresh_token`,
	`id_token`, `access_token_expires_at`, `refresh_token_expires_at`, `scope`,
	`password`, `created_at`, `updated_at`
FROM `account`;
--> statement-breakpoint
DROP TABLE `account`;
--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_issuer_account_unique` ON `account` (`issuer`,`account_id`);
