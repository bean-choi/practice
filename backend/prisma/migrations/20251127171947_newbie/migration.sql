/*
  Warnings:

  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Photo` DROP FOREIGN KEY `Photo_userId_fkey`;

-- DropTable
DROP TABLE `Photo`;

-- CreateTable
CREATE TABLE `Friendship` (
    `id` VARCHAR(191) NOT NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'FRIEND', 'CLOSE_FRIEND', 'BLOCKED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `friend_unique_pair`(`requesterId`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Place` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `xCoord` INTEGER NOT NULL,
    `yCoord` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feed` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `placeId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `imageKey` VARCHAR(191) NULL,
    `status` ENUM('PUBLIC', 'FRIEND', 'CLOSE_FRIEND') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feeds_place_created_idx`(`placeId`, `createdAt`),
    INDEX `feeds_author_created_idx`(`authorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `feedId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeedLike` (
    `userId` VARCHAR(191) NOT NULL,
    `feedId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `feedId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feed` ADD CONSTRAINT `Feed_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feed` ADD CONSTRAINT `Feed_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_feedId_fkey` FOREIGN KEY (`feedId`) REFERENCES `Feed`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedLike` ADD CONSTRAINT `FeedLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedLike` ADD CONSTRAINT `FeedLike_feedId_fkey` FOREIGN KEY (`feedId`) REFERENCES `Feed`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
