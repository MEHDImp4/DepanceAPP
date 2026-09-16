-- Keep existing Goal API values stable while switching Goal storage to cents.
UPDATE `Goal`
SET `targetAmount` = `targetAmount` * 100,
    `currentAmount` = `currentAmount` * 100;

-- Prevent duplicate user categories under concurrent requests.
CREATE UNIQUE INDEX `Category_user_id_name_type_key`
ON `Category`(`user_id`, `name`, `type`);

-- Make transfer cancellation and lookup efficient.
CREATE INDEX `Transaction_transfer_id_idx`
ON `Transaction`(`transfer_id`);
