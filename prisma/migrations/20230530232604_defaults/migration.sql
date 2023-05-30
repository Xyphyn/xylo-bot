-- AlterTable
ALTER TABLE `RoleSelector` MODIFY `unique` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Warning` MODIFY `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `RoleSelector_message_id_idx` ON `RoleSelector`(`message_id`);
