CREATE TABLE `Order` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `reference` VARCHAR(32) NOT NULL,
  `subtotalKobo` BIGINT NOT NULL,
  `deliveryTotalKobo` BIGINT NOT NULL,
  `grandTotalKobo` BIGINT NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'NGN',
  `status` ENUM('PENDING_PAYMENT', 'PAID', 'PARTIALLY_FULFILLED', 'COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
  `paymentGateway` VARCHAR(32) NOT NULL,
  `gatewayReference` VARCHAR(191) NULL,
  `paidAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Order_reference_key`(`reference`),
  UNIQUE INDEX `Order_gatewayReference_key`(`gatewayReference`),
  INDEX `Order_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `Order_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SubOrder` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `sellerId` VARCHAR(191) NOT NULL,
  `subtotalKobo` BIGINT NOT NULL,
  `commissionPercentSnapshot` DECIMAL(5, 2) NOT NULL,
  `commissionAmountKobo` BIGINT NOT NULL,
  `sellerPayoutAmountKobo` BIGINT NOT NULL,
  `deliveryMethod` VARCHAR(64) NOT NULL DEFAULT 'PENDING_SELECTION',
  `deliveryFeeKobo` BIGINT NOT NULL DEFAULT 0,
  `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'DISPUTED', 'REFUNDED', 'SETTLED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `SubOrder_orderId_status_idx`(`orderId`, `status`),
  INDEX `SubOrder_sellerId_createdAt_idx`(`sellerId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OrderItem` (
  `id` VARCHAR(191) NOT NULL,
  `subOrderId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NULL,
  `variantId` VARCHAR(191) NULL,
  `productName` VARCHAR(191) NOT NULL,
  `variantLabel` VARCHAR(191) NULL,
  `sku` VARCHAR(191) NULL,
  `quantity` INTEGER NOT NULL,
  `unitPriceKobo` BIGINT NOT NULL,
  `lineTotalKobo` BIGINT NOT NULL,
  `productImagePath` VARCHAR(191) NULL,
  `inventoryAppliedAt` DATETIME(3) NULL,
  INDEX `OrderItem_subOrderId_idx`(`subOrderId`),
  INDEX `OrderItem_productId_idx`(`productId`),
  INDEX `OrderItem_variantId_idx`(`variantId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SubOrder` ADD CONSTRAINT `SubOrder_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SubOrder` ADD CONSTRAINT `SubOrder_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_subOrderId_fkey` FOREIGN KEY (`subOrderId`) REFERENCES `SubOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
