-- CreateTable
CREATE TABLE "Warning" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildConfig" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "GuildConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSelector" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,

    CONSTRAINT "RoleSelector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSelectorValues" (
    "id" SERIAL NOT NULL,
    "role_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "emoji" TEXT,
    "roleSelectorId" INTEGER,

    CONSTRAINT "RoleSelectorValues_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoleSelectorValues" ADD CONSTRAINT "RoleSelectorValues_roleSelectorId_fkey" FOREIGN KEY ("roleSelectorId") REFERENCES "RoleSelector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
