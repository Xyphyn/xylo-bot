-- AlterTable
ALTER TABLE `RatherGame` MODIFY `option1` VARCHAR(600) NOT NULL,
    MODIFY `option2` VARCHAR(600) NOT NULL;

-- AlterTable
ALTER TABLE `RoleSelectorValues` MODIFY `label` TINYTEXT NOT NULL,
    MODIFY `description` TINYTEXT NULL;

-- AlterTable
ALTER TABLE `Warning` MODIFY `reason` TEXT NOT NULL;
