-- User-local reporting timezone. Existing users keep deterministic UTC semantics
-- until they select another timezone from settings.
ALTER TABLE `User`
    ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC';

-- Refresh-token families allow replay detection to revoke a whole browser session.
ALTER TABLE `RefreshToken`
    ADD COLUMN `sessionId` VARCHAR(36) NULL;

UPDATE `RefreshToken`
SET `sessionId` = UUID()
WHERE `sessionId` IS NULL;

ALTER TABLE `RefreshToken`
    MODIFY `sessionId` VARCHAR(36) NOT NULL;

CREATE INDEX `RefreshToken_userId_sessionId_idx`
ON `RefreshToken`(`userId`, `sessionId`);

-- Bind idempotency keys to the request payload, not only to a caller-chosen key.
ALTER TABLE `IdempotencyKey`
    ADD COLUMN `request_hash` VARCHAR(64) NULL;

-- MySQL permits multiple NULL values in a UNIQUE composite index. Remove any
-- duplicate global budgets that may already exist, then replace the nullable
-- category uniqueness with a deterministic non-null scope key.
DELETE newer
FROM `Budget` newer
JOIN `Budget` older
  ON newer.`user_id` = older.`user_id`
 AND newer.`category_id` IS NULL
 AND older.`category_id` IS NULL
 AND newer.`id` > older.`id`;

ALTER TABLE `Budget` DROP FOREIGN KEY `Budget_category_id_fkey`;
DROP INDEX `Budget_user_id_category_id_key` ON `Budget`;

ALTER TABLE `Budget`
    ADD COLUMN `scope_key` VARCHAR(191) NOT NULL DEFAULT 'global';

UPDATE `Budget`
SET `scope_key` = CASE
    WHEN `category_id` IS NULL THEN 'global'
    ELSE CONCAT('category:', `category_id`)
END;

CREATE UNIQUE INDEX `Budget_user_id_scope_key_key`
ON `Budget`(`user_id`, `scope_key`);

CREATE INDEX `Budget_category_id_idx`
ON `Budget`(`category_id`);

ALTER TABLE `Budget`
    ADD CONSTRAINT `Budget_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
