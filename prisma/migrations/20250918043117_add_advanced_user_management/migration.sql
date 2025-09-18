-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."VerificationType" AS ENUM ('EMAIL', 'PHONE', 'IDENTITY', 'EXPERT', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "public"."UserActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'POST_CREATED', 'COMMENT_CREATED', 'PROFILE_UPDATED', 'PASSWORD_CHANGED', 'EMAIL_CHANGED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'SUSPENSION', 'BAN', 'WARNING_ISSUED', 'REPUTATION_CHANGED');

-- CreateEnum
CREATE TYPE "public"."BanType" AS ENUM ('TEMPORARY', 'PERMANENT', 'IP_BAN', 'SHADOW_BAN');

-- CreateEnum
CREATE TYPE "public"."WarningType" AS ENUM ('MINOR', 'MAJOR', 'SEVERE', 'FINAL');

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "metadata" JSONB DEFAULT '{}',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "public"."UserVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."VerificationType" NOT NULL,
    "status" "public"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationCode" TEXT,
    "verificationToken" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedById" TEXT NOT NULL,
    "type" "public"."BanType" NOT NULL,
    "reason" TEXT NOT NULL,
    "publicReason" TEXT,
    "duration" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BanAppeal" (
    "id" TEXT NOT NULL,
    "banId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."AppealStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BanAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserWarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "type" "public"."WarningType" NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."UserActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "phoneNumber" TEXT,
    "address" JSONB,
    "socialLinks" JSONB DEFAULT '{}',
    "interests" TEXT[],
    "skills" TEXT[],
    "education" JSONB,
    "experience" JSONB,
    "certifications" JSONB,
    "languages" TEXT[],
    "timezone" TEXT,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "profileScore" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "showOnline" BOOLEAN NOT NULL DEFAULT true,
    "allowMessages" BOOLEAN NOT NULL DEFAULT true,
    "allowFollows" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "emailNotifications" JSONB DEFAULT '{"replies":true,"mentions":true,"messages":true,"digest":"weekly"}',
    "pushNotifications" JSONB DEFAULT '{"replies":true,"mentions":true,"messages":true}',
    "privacySettings" JSONB DEFAULT '{"showEmail":false,"showPhone":false,"showOnline":true}',
    "contentSettings" JSONB DEFAULT '{"autoplayVideos":true,"showImages":true,"nsfwContent":false}',
    "moderationSettings" JSONB DEFAULT '{"hideWarned":false,"hideDownvoted":false}',
    "customSettings" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "isSuccessful" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "userId" TEXT,
    "location" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserReputationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "previousValue" INTEGER NOT NULL,
    "newValue" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceType" TEXT,
    "awardedById" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReputationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBadge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "category" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "points" INTEGER NOT NULL DEFAULT 0,
    "requirements" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBadgeEarned" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardedById" TEXT,
    "reason" TEXT,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "UserBadgeEarned_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserVerification_status_idx" ON "public"."UserVerification"("status");

-- CreateIndex
CREATE INDEX "UserVerification_type_idx" ON "public"."UserVerification"("type");

-- CreateIndex
CREATE UNIQUE INDEX "UserVerification_userId_type_key" ON "public"."UserVerification"("userId", "type");

-- CreateIndex
CREATE INDEX "UserBan_userId_idx" ON "public"."UserBan"("userId");

-- CreateIndex
CREATE INDEX "UserBan_isActive_idx" ON "public"."UserBan"("isActive");

-- CreateIndex
CREATE INDEX "UserBan_expiresAt_idx" ON "public"."UserBan"("expiresAt");

-- CreateIndex
CREATE INDEX "BanAppeal_status_idx" ON "public"."BanAppeal"("status");

-- CreateIndex
CREATE INDEX "BanAppeal_userId_idx" ON "public"."BanAppeal"("userId");

-- CreateIndex
CREATE INDEX "UserWarning_userId_idx" ON "public"."UserWarning"("userId");

-- CreateIndex
CREATE INDEX "UserWarning_isActive_idx" ON "public"."UserWarning"("isActive");

-- CreateIndex
CREATE INDEX "UserWarning_expiresAt_idx" ON "public"."UserWarning"("expiresAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "public"."UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_type_idx" ON "public"."UserActivity"("type");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "public"."UserActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "public"."UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_profileScore_idx" ON "public"."UserProfile"("profileScore");

-- CreateIndex
CREATE INDEX "UserProfile_isPublic_idx" ON "public"."UserProfile"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "public"."UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserLoginAttempt_email_idx" ON "public"."UserLoginAttempt"("email");

-- CreateIndex
CREATE INDEX "UserLoginAttempt_ipAddress_idx" ON "public"."UserLoginAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX "UserLoginAttempt_isSuccessful_idx" ON "public"."UserLoginAttempt"("isSuccessful");

-- CreateIndex
CREATE INDEX "UserLoginAttempt_createdAt_idx" ON "public"."UserLoginAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "UserReputationHistory_userId_idx" ON "public"."UserReputationHistory"("userId");

-- CreateIndex
CREATE INDEX "UserReputationHistory_createdAt_idx" ON "public"."UserReputationHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_name_key" ON "public"."UserBadge"("name");

-- CreateIndex
CREATE INDEX "UserBadge_category_idx" ON "public"."UserBadge"("category");

-- CreateIndex
CREATE INDEX "UserBadge_rarity_idx" ON "public"."UserBadge"("rarity");

-- CreateIndex
CREATE INDEX "UserBadge_isActive_idx" ON "public"."UserBadge"("isActive");

-- CreateIndex
CREATE INDEX "UserBadgeEarned_earnedAt_idx" ON "public"."UserBadgeEarned"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadgeEarned_userId_badgeId_key" ON "public"."UserBadgeEarned"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "public"."Post"("status");

-- AddForeignKey
ALTER TABLE "public"."UserVerification" ADD CONSTRAINT "UserVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserVerification" ADD CONSTRAINT "UserVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBan" ADD CONSTRAINT "UserBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBan" ADD CONSTRAINT "UserBan_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BanAppeal" ADD CONSTRAINT "BanAppeal_banId_fkey" FOREIGN KEY ("banId") REFERENCES "public"."UserBan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BanAppeal" ADD CONSTRAINT "BanAppeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BanAppeal" ADD CONSTRAINT "BanAppeal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWarning" ADD CONSTRAINT "UserWarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWarning" ADD CONSTRAINT "UserWarning_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLoginAttempt" ADD CONSTRAINT "UserLoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserReputationHistory" ADD CONSTRAINT "UserReputationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserReputationHistory" ADD CONSTRAINT "UserReputationHistory_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadgeEarned" ADD CONSTRAINT "UserBadgeEarned_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadgeEarned" ADD CONSTRAINT "UserBadgeEarned_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."UserBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadgeEarned" ADD CONSTRAINT "UserBadgeEarned_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
