-- DropIndex
DROP INDEX `Budget_category_id_key` ON `Budget`;

-- CreateTable
CREATE TABLE `RecurringOccurrence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recurring_rule_id` INTEGER NOT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RecurringOccurrence_recurring_rule_id_scheduled_at_key`(`recurring_rule_id`, `scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IdempotencyKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `key` VARCHAR(128) NOT NULL,
    `operation` VARCHAR(64) NOT NULL,
    `response_body` TEXT NULL,
    `status_code` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `IdempotencyKey_expires_at_idx`(`expires_at`),
    UNIQUE INDEX `IdempotencyKey_user_id_operation_key_key`(`user_id`, `operation`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Budget_user_id_category_id_key` ON `Budget`(`user_id`, `category_id`);

-- AddForeignKey
ALTER TABLE `RecurringOccurrence` ADD CONSTRAINT `RecurringOccurrence_recurring_rule_id_fkey` FOREIGN KEY (`recurring_rule_id`) REFERENCES `RecurringTransaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IdempotencyKey` ADD CONSTRAINT `IdempotencyKey_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
