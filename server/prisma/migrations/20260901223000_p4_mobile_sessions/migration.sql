ALTER TABLE `RefreshToken`
    ADD COLUMN `clientType` VARCHAR(16) NOT NULL DEFAULT 'web',
    ADD COLUMN `deviceId` VARCHAR(128) NULL,
    ADD COLUMN `deviceName` VARCHAR(128) NULL,
    ADD COLUMN `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX `RefreshToken_userId_deviceId_idx` ON `RefreshToken`(`userId`, `deviceId`);
