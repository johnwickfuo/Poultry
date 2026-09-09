ALTER TABLE `User`
  ADD COLUMN `emailHardBouncedAt` DATETIME(3) NULL,
  ADD COLUMN `emailSuppressedAt` DATETIME(3) NULL,
  ADD COLUMN `emailSuppressionReason` VARCHAR(500) NULL;

CREATE TABLE `EmailDelivery` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `recipient` VARCHAR(320) NOT NULL,
  `template` VARCHAR(64) NOT NULL,
  `provider` VARCHAR(32) NOT NULL,
  `providerMessageId` VARCHAR(191) NULL,
  `status` ENUM('QUEUED', 'SENT', 'FAILED', 'SUPPRESSED') NOT NULL DEFAULT 'QUEUED',
  `subject` VARCHAR(255) NOT NULL,
  `failureReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sentAt` DATETIME(3) NULL,

  UNIQUE INDEX `EmailDelivery_provider_providerMessageId_key` (`provider`, `providerMessageId`),
  INDEX `EmailDelivery_userId_createdAt_idx` (`userId`, `createdAt`),
  INDEX `EmailDelivery_recipient_createdAt_idx` (`recipient`, `createdAt`),
  INDEX `EmailDelivery_status_createdAt_idx` (`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EmailDelivery`
  ADD CONSTRAINT `EmailDelivery_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
