-- Add the new user identity and lifecycle fields without breaking existing rows.
ALTER TABLE `User`
  ADD COLUMN `username` VARCHAR(191) NULL,
  CHANGE COLUMN `emailVerified` `emailVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

UPDATE `User`
SET `username` = CONCAT(SUBSTRING_INDEX(`email`, '@', 1), '_', LEFT(`id`, 8))
WHERE `username` IS NULL;

ALTER TABLE `User`
  MODIFY COLUMN `username` VARCHAR(191) NOT NULL,
  ADD UNIQUE INDEX `User_username_key`(`username`);

CREATE TABLE `Role` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Role_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserRole` (
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `UserRole_roleId_idx`(`roleId`),
  PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Profile` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `displayName` VARCHAR(191) NULL,
  `fullName` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `whatsapp` VARCHAR(191) NULL,
  `avatarPath` VARCHAR(191) NULL,
  `state` VARCHAR(191) NULL,
  `lga` VARCHAR(191) NULL,
  `bio` TEXT NULL,

  UNIQUE INDEX `Profile_userId_key`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve any names and avatars created by the initial Auth.js-compatible schema.
INSERT INTO `Profile` (`id`, `userId`, `displayName`, `fullName`, `avatarPath`)
SELECT CONCAT('profile_', `id`), `id`, `name`, `name`, `image` FROM `User`;

ALTER TABLE `User`
  DROP COLUMN `name`,
  DROP COLUMN `image`,
  DROP COLUMN `role`;

ALTER TABLE `UserRole`
  ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Profile`
  ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
