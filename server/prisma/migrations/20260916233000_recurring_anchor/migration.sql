ALTER TABLE `RecurringTransaction`
ADD COLUMN `anchor_day` INTEGER NULL;

UPDATE `RecurringTransaction`
SET `anchor_day` = DAY(`next_run_date`)
WHERE `anchor_day` IS NULL;
