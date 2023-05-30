-- CreateTable
CREATE TABLE `Warning` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `guild_id` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildConfig` (
    `id` VARCHAR(191) NOT NULL,
    `config` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleSelector` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guild_id` VARCHAR(191) NOT NULL,
    `channel_id` VARCHAR(191) NOT NULL,
    `message_id` VARCHAR(191) NOT NULL,
    `unique` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleSelectorValues` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `emoji` VARCHAR(191) NULL,
    `roleSelectorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RoleSelectorValues` ADD CONSTRAINT `RoleSelectorValues_roleSelectorId_fkey` FOREIGN KEY (`roleSelectorId`) REFERENCES `RoleSelector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
