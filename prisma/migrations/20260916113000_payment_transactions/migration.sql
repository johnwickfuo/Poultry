CREATE TABLE `PaymentTransaction` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(32) NOT NULL,
  `internalReference` VARCHAR(64) NOT NULL,
  `gatewayReference` VARCHAR(191) NULL,
  `amountKobo` BIGINT NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'NGN',
  `status` ENUM('PENDING', 'INITIALIZED', 'FAILED', 'VERIFIED') NOT NULL DEFAULT 'PENDING',
  `failureCode` VARCHAR(64) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `initializedAt` DATETIME(3) NULL,
  `verifiedAt` DATETIME(3) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `PaymentTransaction_internalReference_key`(`internalReference`),
  UNIQUE INDEX `PaymentTransaction_gatewayReference_key`(`gatewayReference`),
  INDEX `PaymentTransaction_orderId_createdAt_idx`(`orderId`, `createdAt`),
  INDEX `PaymentTransaction_provider_status_idx`(`provider`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
