-- Update existing User table with new fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "occupation" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthday" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signature" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aboutMe" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "warningPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isEmailBouncing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "messageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trophyPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacySettings" JSONB DEFAULT '{"showOnline": true, "receiveMessages": true, "showEmail": false}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotifications" JSONB DEFAULT '{"replies": true, "mentions": true, "conversations": true}';

-- Create indexes for new User fields
CREATE INDEX IF NOT EXISTS "User_isBanned_idx" ON "User"("isBanned");
CREATE INDEX IF NOT EXISTS "User_lastActivity_idx" ON "User"("lastActivity");
CREATE INDEX IF NOT EXISTS "User_warningPoints_idx" ON "User"("warningPoints");

-- Add foreign key constraint for banned by
ALTER TABLE "User" ADD CONSTRAINT "User_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create new tables for enhanced features

-- User Secondary Roles
CREATE TABLE IF NOT EXISTS "UserSecondaryRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "UserSecondaryRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSecondaryRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSecondaryRole_userId_roleId_key" ON "UserSecondaryRole"("userId", "roleId");
CREATE INDEX IF NOT EXISTS "UserSecondaryRole_userId_idx" ON "UserSecondaryRole"("userId");
CREATE INDEX IF NOT EXISTS "UserSecondaryRole_roleId_idx" ON "UserSecondaryRole"("roleId");

-- User Sessions
CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL UNIQUE,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX IF NOT EXISTS "UserSession_ipAddress_idx" ON "UserSession"("ipAddress");
CREATE INDEX IF NOT EXISTS "UserSession_isActive_idx" ON "UserSession"("isActive");

-- User IP Logs
CREATE TABLE IF NOT EXISTS "UserIpLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserIpLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserIpLog_userId_idx" ON "UserIpLog"("userId");
CREATE INDEX IF NOT EXISTS "UserIpLog_ipAddress_idx" ON "UserIpLog"("ipAddress");
CREATE INDEX IF NOT EXISTS "UserIpLog_timestamp_idx" ON "UserIpLog"("timestamp");

-- Warning System
CREATE TABLE IF NOT EXISTS "Warning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warningId" SERIAL UNIQUE,
    "userId" TEXT NOT NULL,
    "givenById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Warning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Warning_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Warning_userId_idx" ON "Warning"("userId");
CREATE INDEX IF NOT EXISTS "Warning_isActive_idx" ON "Warning"("isActive");
CREATE INDEX IF NOT EXISTS "Warning_expiresAt_idx" ON "Warning"("expiresAt");

-- Trophy System
CREATE TABLE IF NOT EXISTS "Trophy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trophyId" SERIAL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" TEXT NOT NULL,
    "icon" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Trophy_isActive_idx" ON "Trophy"("isActive");
CREATE INDEX IF NOT EXISTS "Trophy_category_idx" ON "Trophy"("category");
CREATE INDEX IF NOT EXISTS "Trophy_rarity_idx" ON "Trophy"("rarity");

-- User Trophies
CREATE TABLE IF NOT EXISTS "UserTrophy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trophyId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTrophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTrophy_trophyId_fkey" FOREIGN KEY ("trophyId") REFERENCES "Trophy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserTrophy_userId_trophyId_key" ON "UserTrophy"("userId", "trophyId");
CREATE INDEX IF NOT EXISTS "UserTrophy_userId_idx" ON "UserTrophy"("userId");
CREATE INDEX IF NOT EXISTS "UserTrophy_earnedAt_idx" ON "UserTrophy"("earnedAt");

-- Nodes (Enhanced Categories)
CREATE TABLE IF NOT EXISTS "Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" SERIAL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "nodeType" TEXT NOT NULL DEFAULT 'category',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "style" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "requirePrefix" BOOLEAN NOT NULL DEFAULT false,
    "allowPolls" BOOLEAN NOT NULL DEFAULT true,
    "allowUploads" BOOLEAN NOT NULL DEFAULT true,
    "allowBBCode" BOOLEAN NOT NULL DEFAULT true,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "threadCount" INTEGER NOT NULL DEFAULT 0,
    "lastPostAt" TIMESTAMP(3),
    "lastPostId" TEXT,
    "lastPostTitle" TEXT,
    "lastPostAuthor" TEXT,
    "pageTitle" TEXT,
    "metaDescription" TEXT,
    "externalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Node" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Node_nodeType_idx" ON "Node"("nodeType");
CREATE INDEX IF NOT EXISTS "Node_displayOrder_idx" ON "Node"("displayOrder");
CREATE INDEX IF NOT EXISTS "Node_parentId_idx" ON "Node"("parentId");
CREATE INDEX IF NOT EXISTS "Node_isActive_idx" ON "Node"("isActive");

-- Node Permissions
CREATE TABLE IF NOT EXISTS "NodePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT,
    "permission" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT 'allow',
    CONSTRAINT "NodePermission_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NodePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NodePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "NodePermission_nodeId_userId_permission_key" ON "NodePermission"("nodeId", "userId", "permission");
CREATE UNIQUE INDEX IF NOT EXISTS "NodePermission_nodeId_roleId_permission_key" ON "NodePermission"("nodeId", "roleId", "permission");
CREATE INDEX IF NOT EXISTS "NodePermission_nodeId_idx" ON "NodePermission"("nodeId");
CREATE INDEX IF NOT EXISTS "NodePermission_userId_idx" ON "NodePermission"("userId");
CREATE INDEX IF NOT EXISTS "NodePermission_roleId_idx" ON "NodePermission"("roleId");