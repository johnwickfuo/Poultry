ALTER TABLE `User`
  ADD COLUMN `sessionVersion` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `EmailVerificationToken` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `EmailVerificationToken_tokenHash_key`(`tokenHash`),
  INDEX `EmailVerificationToken_userId_idx`(`userId`),
  INDEX `EmailVerificationToken_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PasswordResetToken` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `PasswordResetToken_tokenHash_key`(`tokenHash`),
  INDEX `PasswordResetToken_userId_idx`(`userId`),
  INDEX `PasswordResetToken_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RateLimit` (
  `key` VARCHAR(64) NOT NULL,
  `count` INTEGER NOT NULL DEFAULT 0,
  `resetAt` DATETIME(3) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `RateLimit_resetAt_idx`(`resetAt`),
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EmailVerificationToken`
  ADD CONSTRAINT `EmailVerificationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PasswordResetToken`
  ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
