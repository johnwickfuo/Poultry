ALTER TABLE `SellerProfile`
  ADD COLUMN `buyerPickupEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `pickupState` VARCHAR(191) NULL,
  ADD COLUMN `pickupLga` VARCHAR(191) NULL,
  ADD COLUMN `pickupAddress` VARCHAR(191) NULL,
  ADD COLUMN `pickupInstructions` TEXT NULL;

CREATE TABLE `SellerDeliveryRate` (
  `id` VARCHAR(191) NOT NULL,
  `sellerId` VARCHAR(191) NOT NULL,
  `state` VARCHAR(191) NOT NULL,
  `feeKobo` BIGINT NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `SellerDeliveryRate_sellerId_state_key`(`sellerId`, `state`),
  INDEX `SellerDeliveryRate_sellerId_isActive_idx`(`sellerId`, `isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE `SubOrder`
SET `deliveryMethod` = 'QUOTE_REQUIRED'
WHERE `deliveryMethod` = 'PENDING_SELECTION';

ALTER TABLE `SubOrder`
  MODIFY `deliveryMethod` ENUM('SELLER_ARRANGED', 'BUYER_PICKUP', 'QUOTE_REQUIRED') NOT NULL,
  ADD COLUMN `deliveryState` VARCHAR(191) NULL,
  ADD COLUMN `pickupAddressSnapshot` TEXT NULL,
  ADD COLUMN `pickupInstructionsSnapshot` TEXT NULL;

CREATE TABLE `DeliveryQuoteRequest` (
  `id` VARCHAR(191) NOT NULL,
  `subOrderId` VARCHAR(191) NOT NULL,
  `status` ENUM('REQUESTED', 'QUOTED', 'ACCEPTED', 'EXPIRED', 'CANCELLED', 'TOP_UP_PAID') NOT NULL DEFAULT 'REQUESTED',
  `sellerAmountKobo` BIGINT NULL,
  `sellerNote` TEXT NULL,
  `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `quotedAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  `acceptedAt` DATETIME(3) NULL,
  `topUpPaymentGateway` VARCHAR(32) NULL,
  `topUpGatewayReference` VARCHAR(191) NULL,
  `topUpPaidAt` DATETIME(3) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `DeliveryQuoteRequest_subOrderId_key`(`subOrderId`),
  UNIQUE INDEX `DeliveryQuoteRequest_topUpGatewayReference_key`(`topUpGatewayReference`),
  INDEX `DeliveryQuoteRequest_status_expiresAt_idx`(`status`, `expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SellerDeliveryRate` ADD CONSTRAINT `SellerDeliveryRate_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DeliveryQuoteRequest` ADD CONSTRAINT `DeliveryQuoteRequest_subOrderId_fkey` FOREIGN KEY (`subOrderId`) REFERENCES `SubOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
