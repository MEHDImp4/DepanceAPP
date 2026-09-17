-- Preserve financial history when accounts are removed. Transactions and
-- recurring rules must be explicitly resolved before an account can disappear.
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_account_id_fkey`;
ALTER TABLE `Transaction`
    ADD CONSTRAINT `Transaction_account_id_fkey`
    FOREIGN KEY (`account_id`) REFERENCES `Account`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `RecurringTransaction` DROP FOREIGN KEY `RecurringTransaction_account_id_fkey`;
ALTER TABLE `RecurringTransaction`
    ADD CONSTRAINT `RecurringTransaction_account_id_fkey`
    FOREIGN KEY (`account_id`) REFERENCES `Account`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep rotated refresh-token records briefly so concurrent refreshes can be
-- distinguished from a later replay attack without revoking a valid session.
ALTER TABLE `RefreshToken`
    ADD COLUMN `rotatedAt` DATETIME(3) NULL,
    ADD COLUMN `replacedByTokenHash` VARCHAR(64) NULL;

CREATE INDEX `RefreshToken_rotatedAt_idx` ON `RefreshToken`(`rotatedAt`);

-- Recurring schedules preserve the user's wall-clock timezone across DST and
-- timezone offset changes.
ALTER TABLE `RecurringTransaction`
    ADD COLUMN `timezone` VARCHAR(100) NOT NULL DEFAULT 'UTC';

UPDATE `RecurringTransaction` r
JOIN `User` u ON u.`id` = r.`user_id`
SET r.`timezone` = u.`timezone`;

-- Optional per-transaction FX snapshots make historical reports stable when
-- exchange rates move later.
ALTER TABLE `Transaction`
    ADD COLUMN `fx_rates_snapshot` TEXT NULL;
