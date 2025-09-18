-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('POST', 'COMMENT', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."ModerationRuleType" AS ENUM ('KEYWORD_FILTER', 'SPAM_DETECTION', 'TOXICITY_FILTER', 'LINK_VALIDATION', 'IMAGE_MODERATION', 'USER_BEHAVIOR', 'CONTENT_LENGTH', 'RATE_LIMITING');

-- CreateEnum
CREATE TYPE "public"."ModerationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ModerationAction" AS ENUM ('FLAG', 'HIDE', 'DELETE', 'SHADOW_BAN', 'TEMP_BAN', 'PERM_BAN', 'REQUIRE_APPROVAL', 'ADD_WARNING');

-- CreateEnum
CREATE TYPE "public"."AppealStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES');

-- CreateEnum
CREATE TYPE "public"."FlagType" AS ENUM ('SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'MISINFORMATION', 'COPYRIGHT', 'OFF_TOPIC', 'DUPLICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."FlagStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateTable
CREATE TABLE "public"."ScheduledPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "postId" TEXT,
    "tags" TEXT[],
    "prefixId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "changeReason" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ModerationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ruleType" "public"."ModerationRuleType" NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "severity" "public"."ModerationSeverity" NOT NULL DEFAULT 'MEDIUM',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ModerationLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "contentId" TEXT NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "action" "public"."ModerationAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "automated" BOOLEAN NOT NULL DEFAULT false,
    "moderatorId" TEXT,
    "appealed" BOOLEAN NOT NULL DEFAULT false,
    "appealedAt" TIMESTAMP(3),
    "appealReason" TEXT,
    "appealStatus" "public"."AppealStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "categoryId" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentApproval" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "submittedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ContentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentFlag" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "flagType" "public"."FlagType" NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "flaggedBy" TEXT NOT NULL,
    "status" "public"."FlagStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ContentFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPost_postId_key" ON "public"."ScheduledPost"("postId");

-- CreateIndex
CREATE INDEX "ScheduledPost_scheduledFor_idx" ON "public"."ScheduledPost"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledPost_published_idx" ON "public"."ScheduledPost"("published");

-- CreateIndex
CREATE INDEX "ScheduledPost_authorId_idx" ON "public"."ScheduledPost"("authorId");

-- CreateIndex
CREATE INDEX "ContentVersion_contentId_idx" ON "public"."ContentVersion"("contentId");

-- CreateIndex
CREATE INDEX "ContentVersion_contentType_idx" ON "public"."ContentVersion"("contentType");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_contentId_version_key" ON "public"."ContentVersion"("contentId", "version");

-- CreateIndex
CREATE INDEX "ModerationRule_enabled_idx" ON "public"."ModerationRule"("enabled");

-- CreateIndex
CREATE INDEX "ModerationRule_ruleType_idx" ON "public"."ModerationRule"("ruleType");

-- CreateIndex
CREATE INDEX "ModerationLog_contentId_idx" ON "public"."ModerationLog"("contentId");

-- CreateIndex
CREATE INDEX "ModerationLog_contentType_idx" ON "public"."ModerationLog"("contentType");

-- CreateIndex
CREATE INDEX "ModerationLog_automated_idx" ON "public"."ModerationLog"("automated");

-- CreateIndex
CREATE INDEX "ModerationLog_appealStatus_idx" ON "public"."ModerationLog"("appealStatus");

-- CreateIndex
CREATE INDEX "ContentTemplate_isPublic_idx" ON "public"."ContentTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "ContentTemplate_createdBy_idx" ON "public"."ContentTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "ContentApproval_status_idx" ON "public"."ContentApproval"("status");

-- CreateIndex
CREATE INDEX "ContentApproval_submittedBy_idx" ON "public"."ContentApproval"("submittedBy");

-- CreateIndex
CREATE UNIQUE INDEX "ContentApproval_contentId_contentType_key" ON "public"."ContentApproval"("contentId", "contentType");

-- CreateIndex
CREATE INDEX "ContentFlag_contentId_idx" ON "public"."ContentFlag"("contentId");

-- CreateIndex
CREATE INDEX "ContentFlag_contentType_idx" ON "public"."ContentFlag"("contentType");

-- CreateIndex
CREATE INDEX "ContentFlag_status_idx" ON "public"."ContentFlag"("status");

-- CreateIndex
CREATE INDEX "ContentFlag_flagType_idx" ON "public"."ContentFlag"("flagType");

-- AddForeignKey
ALTER TABLE "public"."ScheduledPost" ADD CONSTRAINT "ScheduledPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPost" ADD CONSTRAINT "ScheduledPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPost" ADD CONSTRAINT "ScheduledPost_prefixId_fkey" FOREIGN KEY ("prefixId") REFERENCES "public"."ThreadPrefix"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPost" ADD CONSTRAINT "ScheduledPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentVersion" ADD CONSTRAINT "ContentVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationRule" ADD CONSTRAINT "ModerationRule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationLog" ADD CONSTRAINT "ModerationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."ModerationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationLog" ADD CONSTRAINT "ModerationLog_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentTemplate" ADD CONSTRAINT "ContentTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentTemplate" ADD CONSTRAINT "ContentTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentApproval" ADD CONSTRAINT "ContentApproval_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentApproval" ADD CONSTRAINT "ContentApproval_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentFlag" ADD CONSTRAINT "ContentFlag_flaggedBy_fkey" FOREIGN KEY ("flaggedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentFlag" ADD CONSTRAINT "ContentFlag_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
