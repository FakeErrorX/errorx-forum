-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "userId" SERIAL NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsernameChangeAt" TIMESTAMP(3),
    "bio" TEXT,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB DEFAULT '{"theme": "system", "notifications": true, "emailUpdates": true}',
    "title" TEXT,
    "location" TEXT,
    "occupation" TEXT,
    "website" TEXT,
    "birthday" TIMESTAMP(3),
    "timezone" TEXT,
    "signature" TEXT,
    "aboutMe" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedUntil" TIMESTAMP(3),
    "bannedReason" TEXT,
    "bannedById" TEXT,
    "banCount" INTEGER NOT NULL DEFAULT 0,
    "warningPoints" INTEGER NOT NULL DEFAULT 0,
    "isEmailBouncing" BOOLEAN NOT NULL DEFAULT false,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "trophyPoints" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "privacySettings" JSONB DEFAULT '{"showOnline": true, "receiveMessages": true, "showEmail": false}',
    "emailNotifications" JSONB DEFAULT '{"replies": true, "mentions": true, "conversations": true}',
    "notificationPreferences" JSONB DEFAULT '{"mentions":{"email":true,"push":true,"realtime":true},"replies":{"email":true,"push":true,"realtime":true},"follows":{"email":false,"push":true,"realtime":true},"likes":{"email":false,"push":false,"realtime":true},"messages":{"email":true,"push":true,"realtime":true},"system":{"email":true,"push":true,"realtime":true},"emailDigest":"daily"}',
    "roleId" TEXT DEFAULT 'member',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "categoryId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" TEXT NOT NULL,
    "postId" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredAt" TIMESTAMP(3),
    "featuredById" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prefixId" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "commentId" SERIAL NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Like" (
    "id" TEXT NOT NULL,
    "likeId" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Poll" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "isMultiple" BOOLEAN NOT NULL DEFAULT false,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostTag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ThreadPrefix" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadPrefix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Watch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "reportId" SERIAL NOT NULL,
    "reporterId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "fromUserId" TEXT,
    "postId" TEXT,
    "commentId" TEXT,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordReset" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TypingIndicator" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypingIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ignore" (
    "id" TEXT NOT NULL,
    "ignorerId" TEXT NOT NULL,
    "ignoredId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ignore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Draft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "categoryId" TEXT,
    "postId" TEXT,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6b7280',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSecondaryRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserSecondaryRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserIpLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserIpLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Warning" (
    "id" TEXT NOT NULL,
    "warningId" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "givenById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Trophy" (
    "id" TEXT NOT NULL,
    "trophyId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" TEXT NOT NULL,
    "icon" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserTrophy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trophyId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfilePost" (
    "id" TEXT NOT NULL,
    "profilePostId" SERIAL NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfilePostComment" (
    "id" TEXT NOT NULL,
    "profilePostId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomField" (
    "id" TEXT NOT NULL,
    "fieldId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "fieldType" TEXT NOT NULL,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCustomField" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "UserCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserUpgrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserUpgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Node" (
    "id" TEXT NOT NULL,
    "nodeId" SERIAL NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NodePermission" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT,
    "permission" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT 'allow',

    CONSTRAINT "NodePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NodeModerator" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeModerator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EnhancedPost" (
    "id" TEXT NOT NULL,
    "postId" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentParsed" TEXT,
    "nodeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "threadType" TEXT NOT NULL DEFAULT 'discussion',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isSticky" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedReason" TEXT,
    "deletedById" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReplyAt" TIMESTAMP(3),
    "bumpedAt" TIMESTAMP(3),
    "prefixId" TEXT,

    CONSTRAINT "EnhancedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostReply" (
    "id" TEXT NOT NULL,
    "replyId" SERIAL NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentParsed" TEXT,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedReason" TEXT,
    "deletedById" TEXT,
    "rating" DOUBLE PRECISION,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "replyId" TEXT,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostAttachment" (
    "id" TEXT NOT NULL,
    "attachmentId" SERIAL NOT NULL,
    "postId" TEXT,
    "replyId" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostSimpleAttachment" (
    "id" TEXT NOT NULL,
    "attachmentId" SERIAL NOT NULL,
    "postId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSimpleAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostView" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BBCode" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "replacement" TEXT NOT NULL,
    "example" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasOption" BOOLEAN NOT NULL DEFAULT false,
    "parseContent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BBCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostTemplate" (
    "id" TEXT NOT NULL,
    "templateId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewsFeed" (
    "id" TEXT NOT NULL,
    "newsId" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Mention" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mentionerId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clickedResult" TEXT,
    "searchType" TEXT NOT NULL DEFAULT 'general',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrendingTopic" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "mentions" INTEGER NOT NULL DEFAULT 1,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category" TEXT,
    "timeframe" TEXT NOT NULL DEFAULT '24h',
    "lastMentioned" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendingTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchIndex" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "keywords" TEXT[],
    "metadata" JSONB,
    "searchVector" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchSuggestion" (
    "id" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 1,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "type" TEXT NOT NULL DEFAULT 'query',
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "isInteracted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleUpgrade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fromRoleId" TEXT NOT NULL,
    "toRoleId" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleUpgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "properties" JSONB,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "pathname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyMetrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "newPosts" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "newComments" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgSessionTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topPosts" JSONB,
    "topCategories" JSONB,
    "userGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserEngagement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "postsCreated" INTEGER NOT NULL DEFAULT 0,
    "commentsCreated" INTEGER NOT NULL DEFAULT 0,
    "likesGiven" INTEGER NOT NULL DEFAULT 0,
    "likesReceived" INTEGER NOT NULL DEFAULT 0,
    "messagesRead" INTEGER NOT NULL DEFAULT 0,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentMetrics" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "clickRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTimeSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrafficSource" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT,
    "campaign" TEXT,
    "referrer" TEXT,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSessionTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerformanceMetrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p95ResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uptime" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "dbQueryTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slowQueries" INTEGER NOT NULL DEFAULT 0,
    "cacheHitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memoryUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpuUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diskUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Experiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetMetric" TEXT NOT NULL,
    "variants" JSONB NOT NULL,
    "trafficSplit" JSONB NOT NULL,
    "results" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserExperiment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "UserExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_NodePrefixes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NodePrefixes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "public"."User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "username_ci_index" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "public"."User"("roleId");

-- CreateIndex
CREATE INDEX "User_isBanned_idx" ON "public"."User"("isBanned");

-- CreateIndex
CREATE INDEX "User_lastActivity_idx" ON "public"."User"("lastActivity");

-- CreateIndex
CREATE INDEX "User_warningPoints_idx" ON "public"."User"("warningPoints");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_categoryId_key" ON "public"."Category"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_postId_key" ON "public"."Post"("postId");

-- CreateIndex
CREATE INDEX "Post_isFeatured_featuredAt_idx" ON "public"."Post"("isFeatured", "featuredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_commentId_key" ON "public"."Comment"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_likeId_key" ON "public"."Like"("likeId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_postId_key" ON "public"."Like"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_commentId_key" ON "public"."Like"("userId", "commentId");

-- CreateIndex
CREATE INDEX "Reaction_postId_idx" ON "public"."Reaction"("postId");

-- CreateIndex
CREATE INDEX "Reaction_commentId_idx" ON "public"."Reaction"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_postId_type_key" ON "public"."Reaction"("userId", "postId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_commentId_type_key" ON "public"."Reaction"("userId", "commentId", "type");

-- CreateIndex
CREATE INDEX "Bookmark_userId_idx" ON "public"."Bookmark"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_postId_idx" ON "public"."Bookmark"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_postId_key" ON "public"."Bookmark"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_postId_key" ON "public"."Poll"("postId");

-- CreateIndex
CREATE INDEX "PollOption_pollId_idx" ON "public"."PollOption"("pollId");

-- CreateIndex
CREATE INDEX "PollVote_userId_idx" ON "public"."PollVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_pollId_userId_optionId_key" ON "public"."PollVote"("pollId", "userId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "PostTag_tagId_idx" ON "public"."PostTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "PostTag_postId_tagId_key" ON "public"."PostTag"("postId", "tagId");

-- CreateIndex
CREATE INDEX "ThreadPrefix_categoryId_idx" ON "public"."ThreadPrefix"("categoryId");

-- CreateIndex
CREATE INDEX "Watch_userId_idx" ON "public"."Watch"("userId");

-- CreateIndex
CREATE INDEX "Watch_postId_idx" ON "public"."Watch"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Watch_userId_postId_key" ON "public"."Watch"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reportId_key" ON "public"."Report"("reportId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_contentType_contentId_idx" ON "public"."Report"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "public"."Report"("reporterId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "public"."PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "public"."PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "public"."PasswordReset"("expiresAt");

-- CreateIndex
CREATE INDEX "Conversation_type_idx" ON "public"."Conversation"("type");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "public"."Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "public"."ConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "public"."ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_idx" ON "public"."ConversationMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationMessage_senderId_idx" ON "public"."ConversationMessage"("senderId");

-- CreateIndex
CREATE INDEX "ConversationMessage_status_idx" ON "public"."ConversationMessage"("status");

-- CreateIndex
CREATE INDEX "ConversationMessage_createdAt_idx" ON "public"."ConversationMessage"("createdAt");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "public"."MessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "public"."MessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_userId_idx" ON "public"."MessageReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "public"."MessageReaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "TypingIndicator_conversationId_idx" ON "public"."TypingIndicator"("conversationId");

-- CreateIndex
CREATE INDEX "TypingIndicator_expiresAt_idx" ON "public"."TypingIndicator"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TypingIndicator_conversationId_userId_key" ON "public"."TypingIndicator"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "public"."Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "public"."Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Ignore_ignoredId_idx" ON "public"."Ignore"("ignoredId");

-- CreateIndex
CREATE UNIQUE INDEX "Ignore_ignorerId_ignoredId_key" ON "public"."Ignore"("ignorerId", "ignoredId");

-- CreateIndex
CREATE INDEX "Draft_userId_idx" ON "public"."Draft"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "Role_name_idx" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "Role_isSystem_idx" ON "public"."Role"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_name_idx" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "public"."Permission"("category");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "public"."RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "public"."RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "public"."RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserSecondaryRole_userId_idx" ON "public"."UserSecondaryRole"("userId");

-- CreateIndex
CREATE INDEX "UserSecondaryRole_roleId_idx" ON "public"."UserSecondaryRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecondaryRole_userId_roleId_key" ON "public"."UserSecondaryRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "public"."UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "public"."UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_ipAddress_idx" ON "public"."UserSession"("ipAddress");

-- CreateIndex
CREATE INDEX "UserSession_isActive_idx" ON "public"."UserSession"("isActive");

-- CreateIndex
CREATE INDEX "UserIpLog_userId_idx" ON "public"."UserIpLog"("userId");

-- CreateIndex
CREATE INDEX "UserIpLog_ipAddress_idx" ON "public"."UserIpLog"("ipAddress");

-- CreateIndex
CREATE INDEX "UserIpLog_timestamp_idx" ON "public"."UserIpLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Warning_warningId_key" ON "public"."Warning"("warningId");

-- CreateIndex
CREATE INDEX "Warning_userId_idx" ON "public"."Warning"("userId");

-- CreateIndex
CREATE INDEX "Warning_isActive_idx" ON "public"."Warning"("isActive");

-- CreateIndex
CREATE INDEX "Warning_expiresAt_idx" ON "public"."Warning"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Trophy_trophyId_key" ON "public"."Trophy"("trophyId");

-- CreateIndex
CREATE INDEX "Trophy_isActive_idx" ON "public"."Trophy"("isActive");

-- CreateIndex
CREATE INDEX "Trophy_category_idx" ON "public"."Trophy"("category");

-- CreateIndex
CREATE INDEX "Trophy_rarity_idx" ON "public"."Trophy"("rarity");

-- CreateIndex
CREATE INDEX "UserTrophy_userId_idx" ON "public"."UserTrophy"("userId");

-- CreateIndex
CREATE INDEX "UserTrophy_earnedAt_idx" ON "public"."UserTrophy"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrophy_userId_trophyId_key" ON "public"."UserTrophy"("userId", "trophyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePost_profilePostId_key" ON "public"."ProfilePost"("profilePostId");

-- CreateIndex
CREATE INDEX "ProfilePost_targetUserId_idx" ON "public"."ProfilePost"("targetUserId");

-- CreateIndex
CREATE INDEX "ProfilePost_authorId_idx" ON "public"."ProfilePost"("authorId");

-- CreateIndex
CREATE INDEX "ProfilePost_createdAt_idx" ON "public"."ProfilePost"("createdAt");

-- CreateIndex
CREATE INDEX "ProfilePostComment_profilePostId_idx" ON "public"."ProfilePostComment"("profilePostId");

-- CreateIndex
CREATE INDEX "ProfilePostComment_authorId_idx" ON "public"."ProfilePostComment"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_fieldId_key" ON "public"."CustomField"("fieldId");

-- CreateIndex
CREATE INDEX "CustomField_isActive_idx" ON "public"."CustomField"("isActive");

-- CreateIndex
CREATE INDEX "CustomField_position_idx" ON "public"."CustomField"("position");

-- CreateIndex
CREATE INDEX "UserCustomField_userId_idx" ON "public"."UserCustomField"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCustomField_userId_fieldId_key" ON "public"."UserCustomField"("userId", "fieldId");

-- CreateIndex
CREATE INDEX "UserUpgrade_userId_idx" ON "public"."UserUpgrade"("userId");

-- CreateIndex
CREATE INDEX "UserUpgrade_isActive_idx" ON "public"."UserUpgrade"("isActive");

-- CreateIndex
CREATE INDEX "UserUpgrade_endDate_idx" ON "public"."UserUpgrade"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Node_nodeId_key" ON "public"."Node"("nodeId");

-- CreateIndex
CREATE INDEX "Node_nodeType_idx" ON "public"."Node"("nodeType");

-- CreateIndex
CREATE INDEX "Node_displayOrder_idx" ON "public"."Node"("displayOrder");

-- CreateIndex
CREATE INDEX "Node_parentId_idx" ON "public"."Node"("parentId");

-- CreateIndex
CREATE INDEX "Node_isActive_idx" ON "public"."Node"("isActive");

-- CreateIndex
CREATE INDEX "NodePermission_nodeId_idx" ON "public"."NodePermission"("nodeId");

-- CreateIndex
CREATE INDEX "NodePermission_userId_idx" ON "public"."NodePermission"("userId");

-- CreateIndex
CREATE INDEX "NodePermission_roleId_idx" ON "public"."NodePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "NodePermission_nodeId_userId_permission_key" ON "public"."NodePermission"("nodeId", "userId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "NodePermission_nodeId_roleId_permission_key" ON "public"."NodePermission"("nodeId", "roleId", "permission");

-- CreateIndex
CREATE INDEX "NodeModerator_nodeId_idx" ON "public"."NodeModerator"("nodeId");

-- CreateIndex
CREATE INDEX "NodeModerator_userId_idx" ON "public"."NodeModerator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NodeModerator_nodeId_userId_key" ON "public"."NodeModerator"("nodeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EnhancedPost_postId_key" ON "public"."EnhancedPost"("postId");

-- CreateIndex
CREATE INDEX "EnhancedPost_nodeId_idx" ON "public"."EnhancedPost"("nodeId");

-- CreateIndex
CREATE INDEX "EnhancedPost_authorId_idx" ON "public"."EnhancedPost"("authorId");

-- CreateIndex
CREATE INDEX "EnhancedPost_threadType_idx" ON "public"."EnhancedPost"("threadType");

-- CreateIndex
CREATE INDEX "EnhancedPost_isPinned_isSticky_idx" ON "public"."EnhancedPost"("isPinned", "isSticky");

-- CreateIndex
CREATE INDEX "EnhancedPost_lastReplyAt_idx" ON "public"."EnhancedPost"("lastReplyAt");

-- CreateIndex
CREATE INDEX "EnhancedPost_rating_idx" ON "public"."EnhancedPost"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "PostReply_replyId_key" ON "public"."PostReply"("replyId");

-- CreateIndex
CREATE INDEX "PostReply_postId_idx" ON "public"."PostReply"("postId");

-- CreateIndex
CREATE INDEX "PostReply_authorId_idx" ON "public"."PostReply"("authorId");

-- CreateIndex
CREATE INDEX "PostReply_parentId_idx" ON "public"."PostReply"("parentId");

-- CreateIndex
CREATE INDEX "PostReply_position_idx" ON "public"."PostReply"("position");

-- CreateIndex
CREATE INDEX "PostRating_postId_idx" ON "public"."PostRating"("postId");

-- CreateIndex
CREATE INDEX "PostRating_replyId_idx" ON "public"."PostRating"("replyId");

-- CreateIndex
CREATE UNIQUE INDEX "PostRating_userId_postId_key" ON "public"."PostRating"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostRating_userId_replyId_key" ON "public"."PostRating"("userId", "replyId");

-- CreateIndex
CREATE UNIQUE INDEX "PostAttachment_attachmentId_key" ON "public"."PostAttachment"("attachmentId");

-- CreateIndex
CREATE INDEX "PostAttachment_postId_idx" ON "public"."PostAttachment"("postId");

-- CreateIndex
CREATE INDEX "PostAttachment_replyId_idx" ON "public"."PostAttachment"("replyId");

-- CreateIndex
CREATE INDEX "PostAttachment_uploadedAt_idx" ON "public"."PostAttachment"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostSimpleAttachment_attachmentId_key" ON "public"."PostSimpleAttachment"("attachmentId");

-- CreateIndex
CREATE INDEX "PostSimpleAttachment_postId_idx" ON "public"."PostSimpleAttachment"("postId");

-- CreateIndex
CREATE INDEX "PostSimpleAttachment_uploadedAt_idx" ON "public"."PostSimpleAttachment"("uploadedAt");

-- CreateIndex
CREATE INDEX "PostView_postId_idx" ON "public"."PostView"("postId");

-- CreateIndex
CREATE INDEX "PostView_viewedAt_idx" ON "public"."PostView"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostView_postId_userId_key" ON "public"."PostView"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostView_postId_ipAddress_key" ON "public"."PostView"("postId", "ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "BBCode_tag_key" ON "public"."BBCode"("tag");

-- CreateIndex
CREATE INDEX "BBCode_isActive_idx" ON "public"."BBCode"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PostTemplate_templateId_key" ON "public"."PostTemplate"("templateId");

-- CreateIndex
CREATE INDEX "PostTemplate_isActive_idx" ON "public"."PostTemplate"("isActive");

-- CreateIndex
CREATE INDEX "PostTemplate_category_idx" ON "public"."PostTemplate"("category");

-- CreateIndex
CREATE UNIQUE INDEX "NewsFeed_newsId_key" ON "public"."NewsFeed"("newsId");

-- CreateIndex
CREATE INDEX "NewsFeed_isPublished_idx" ON "public"."NewsFeed"("isPublished");

-- CreateIndex
CREATE INDEX "NewsFeed_publishedAt_idx" ON "public"."NewsFeed"("publishedAt");

-- CreateIndex
CREATE INDEX "ActivityFeed_userId_createdAt_idx" ON "public"."ActivityFeed"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityFeed_actorId_idx" ON "public"."ActivityFeed"("actorId");

-- CreateIndex
CREATE INDEX "ActivityFeed_type_idx" ON "public"."ActivityFeed"("type");

-- CreateIndex
CREATE INDEX "ActivityFeed_isRead_idx" ON "public"."ActivityFeed"("isRead");

-- CreateIndex
CREATE INDEX "Mention_userId_isRead_idx" ON "public"."Mention"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Mention_mentionerId_idx" ON "public"."Mention"("mentionerId");

-- CreateIndex
CREATE INDEX "Mention_entityType_entityId_idx" ON "public"."Mention"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "public"."UserBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "public"."UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "SocialInteraction_userId_type_idx" ON "public"."SocialInteraction"("userId", "type");

-- CreateIndex
CREATE INDEX "SocialInteraction_targetUserId_idx" ON "public"."SocialInteraction"("targetUserId");

-- CreateIndex
CREATE INDEX "SocialInteraction_createdAt_idx" ON "public"."SocialInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_query_idx" ON "public"."SearchQuery"("query");

-- CreateIndex
CREATE INDEX "SearchQuery_userId_idx" ON "public"."SearchQuery"("userId");

-- CreateIndex
CREATE INDEX "SearchQuery_searchType_idx" ON "public"."SearchQuery"("searchType");

-- CreateIndex
CREATE INDEX "SearchQuery_createdAt_idx" ON "public"."SearchQuery"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrendingTopic_topic_key" ON "public"."TrendingTopic"("topic");

-- CreateIndex
CREATE INDEX "TrendingTopic_score_idx" ON "public"."TrendingTopic"("score");

-- CreateIndex
CREATE INDEX "TrendingTopic_timeframe_score_idx" ON "public"."TrendingTopic"("timeframe", "score");

-- CreateIndex
CREATE INDEX "TrendingTopic_lastMentioned_idx" ON "public"."TrendingTopic"("lastMentioned");

-- CreateIndex
CREATE INDEX "SearchIndex_contentType_idx" ON "public"."SearchIndex"("contentType");

-- CreateIndex
CREATE INDEX "SearchIndex_keywords_idx" ON "public"."SearchIndex"("keywords");

-- CreateIndex
CREATE UNIQUE INDEX "SearchIndex_contentType_contentId_key" ON "public"."SearchIndex"("contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchSuggestion_suggestion_key" ON "public"."SearchSuggestion"("suggestion");

-- CreateIndex
CREATE INDEX "SearchSuggestion_searchCount_idx" ON "public"."SearchSuggestion"("searchCount");

-- CreateIndex
CREATE INDEX "SearchSuggestion_suggestion_idx" ON "public"."SearchSuggestion"("suggestion");

-- CreateIndex
CREATE INDEX "SearchSuggestion_type_idx" ON "public"."SearchSuggestion"("type");

-- CreateIndex
CREATE INDEX "ContentRecommendation_userId_score_idx" ON "public"."ContentRecommendation"("userId", "score");

-- CreateIndex
CREATE INDEX "ContentRecommendation_contentType_contentId_idx" ON "public"."ContentRecommendation"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "ContentRecommendation_createdAt_idx" ON "public"."ContentRecommendation"("createdAt");

-- CreateIndex
CREATE INDEX "RoleUpgrade_isActive_idx" ON "public"."RoleUpgrade"("isActive");

-- CreateIndex
CREATE INDEX "RoleUpgrade_isAutomatic_idx" ON "public"."RoleUpgrade"("isAutomatic");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "public"."AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "public"."AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "public"."AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entityType_entityId_idx" ON "public"."AnalyticsEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "public"."AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_pathname_idx" ON "public"."AnalyticsEvent"("pathname");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetrics_date_key" ON "public"."DailyMetrics"("date");

-- CreateIndex
CREATE INDEX "DailyMetrics_date_idx" ON "public"."DailyMetrics"("date");

-- CreateIndex
CREATE INDEX "UserEngagement_date_idx" ON "public"."UserEngagement"("date");

-- CreateIndex
CREATE INDEX "UserEngagement_lastActivity_idx" ON "public"."UserEngagement"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "UserEngagement_userId_date_key" ON "public"."UserEngagement"("userId", "date");

-- CreateIndex
CREATE INDEX "ContentMetrics_contentType_idx" ON "public"."ContentMetrics"("contentType");

-- CreateIndex
CREATE INDEX "ContentMetrics_date_idx" ON "public"."ContentMetrics"("date");

-- CreateIndex
CREATE INDEX "ContentMetrics_views_idx" ON "public"."ContentMetrics"("views");

-- CreateIndex
CREATE INDEX "ContentMetrics_engagementRate_idx" ON "public"."ContentMetrics"("engagementRate");

-- CreateIndex
CREATE UNIQUE INDEX "ContentMetrics_contentType_contentId_date_key" ON "public"."ContentMetrics"("contentType", "contentId", "date");

-- CreateIndex
CREATE INDEX "TrafficSource_date_idx" ON "public"."TrafficSource"("date");

-- CreateIndex
CREATE INDEX "TrafficSource_source_idx" ON "public"."TrafficSource"("source");

-- CreateIndex
CREATE INDEX "TrafficSource_visitors_idx" ON "public"."TrafficSource"("visitors");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficSource_date_source_medium_campaign_referrer_key" ON "public"."TrafficSource"("date", "source", "medium", "campaign", "referrer");

-- CreateIndex
CREATE INDEX "PerformanceMetrics_date_idx" ON "public"."PerformanceMetrics"("date");

-- CreateIndex
CREATE INDEX "PerformanceMetrics_avgResponseTime_idx" ON "public"."PerformanceMetrics"("avgResponseTime");

-- CreateIndex
CREATE INDEX "PerformanceMetrics_errorRate_idx" ON "public"."PerformanceMetrics"("errorRate");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceMetrics_date_key" ON "public"."PerformanceMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_name_key" ON "public"."Experiment"("name");

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "public"."Experiment"("status");

-- CreateIndex
CREATE INDEX "Experiment_isActive_idx" ON "public"."Experiment"("isActive");

-- CreateIndex
CREATE INDEX "Experiment_startDate_idx" ON "public"."Experiment"("startDate");

-- CreateIndex
CREATE INDEX "UserExperiment_experimentId_idx" ON "public"."UserExperiment"("experimentId");

-- CreateIndex
CREATE INDEX "UserExperiment_variant_idx" ON "public"."UserExperiment"("variant");

-- CreateIndex
CREATE INDEX "UserExperiment_converted_idx" ON "public"."UserExperiment"("converted");

-- CreateIndex
CREATE UNIQUE INDEX "UserExperiment_userId_experimentId_key" ON "public"."UserExperiment"("userId", "experimentId");

-- CreateIndex
CREATE INDEX "_NodePrefixes_B_index" ON "public"."_NodePrefixes"("B");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_featuredById_fkey" FOREIGN KEY ("featuredById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_prefixId_fkey" FOREIGN KEY ("prefixId") REFERENCES "public"."ThreadPrefix"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bookmark" ADD CONSTRAINT "Bookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Poll" ADD CONSTRAINT "Poll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PollVote" ADD CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PollVote" ADD CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThreadPrefix" ADD CONSTRAINT "ThreadPrefix_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Watch" ADD CONSTRAINT "Watch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Watch" ADD CONSTRAINT "Watch_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationMessage" ADD CONSTRAINT "ConversationMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationMessage" ADD CONSTRAINT "ConversationMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."ConversationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."ConversationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."ConversationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TypingIndicator" ADD CONSTRAINT "TypingIndicator_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TypingIndicator" ADD CONSTRAINT "TypingIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ignore" ADD CONSTRAINT "Ignore_ignorerId_fkey" FOREIGN KEY ("ignorerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ignore" ADD CONSTRAINT "Ignore_ignoredId_fkey" FOREIGN KEY ("ignoredId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Draft" ADD CONSTRAINT "Draft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Draft" ADD CONSTRAINT "Draft_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Draft" ADD CONSTRAINT "Draft_nodeId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSecondaryRole" ADD CONSTRAINT "UserSecondaryRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSecondaryRole" ADD CONSTRAINT "UserSecondaryRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserIpLog" ADD CONSTRAINT "UserIpLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Warning" ADD CONSTRAINT "Warning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Warning" ADD CONSTRAINT "Warning_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTrophy" ADD CONSTRAINT "UserTrophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTrophy" ADD CONSTRAINT "UserTrophy_trophyId_fkey" FOREIGN KEY ("trophyId") REFERENCES "public"."Trophy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfilePost" ADD CONSTRAINT "ProfilePost_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfilePost" ADD CONSTRAINT "ProfilePost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfilePostComment" ADD CONSTRAINT "ProfilePostComment_profilePostId_fkey" FOREIGN KEY ("profilePostId") REFERENCES "public"."ProfilePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfilePostComment" ADD CONSTRAINT "ProfilePostComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCustomField" ADD CONSTRAINT "UserCustomField_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCustomField" ADD CONSTRAINT "UserCustomField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserUpgrade" ADD CONSTRAINT "UserUpgrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Node" ADD CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NodePermission" ADD CONSTRAINT "NodePermission_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NodePermission" ADD CONSTRAINT "NodePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NodePermission" ADD CONSTRAINT "NodePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NodeModerator" ADD CONSTRAINT "NodeModerator_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NodeModerator" ADD CONSTRAINT "NodeModerator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnhancedPost" ADD CONSTRAINT "EnhancedPost_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnhancedPost" ADD CONSTRAINT "EnhancedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnhancedPost" ADD CONSTRAINT "EnhancedPost_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnhancedPost" ADD CONSTRAINT "EnhancedPost_prefixId_fkey" FOREIGN KEY ("prefixId") REFERENCES "public"."ThreadPrefix"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReply" ADD CONSTRAINT "PostReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."EnhancedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReply" ADD CONSTRAINT "PostReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReply" ADD CONSTRAINT "PostReply_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReply" ADD CONSTRAINT "PostReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."PostReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostRating" ADD CONSTRAINT "PostRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostRating" ADD CONSTRAINT "PostRating_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."EnhancedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostRating" ADD CONSTRAINT "PostRating_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "public"."PostReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostAttachment" ADD CONSTRAINT "PostAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."EnhancedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostAttachment" ADD CONSTRAINT "PostAttachment_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "public"."PostReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostSimpleAttachment" ADD CONSTRAINT "PostSimpleAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostView" ADD CONSTRAINT "PostView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."EnhancedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostView" ADD CONSTRAINT "PostView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewsFeed" ADD CONSTRAINT "NewsFeed_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityFeed" ADD CONSTRAINT "ActivityFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityFeed" ADD CONSTRAINT "ActivityFeed_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Mention" ADD CONSTRAINT "Mention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Mention" ADD CONSTRAINT "Mention_mentionerId_fkey" FOREIGN KEY ("mentionerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialInteraction" ADD CONSTRAINT "SocialInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialInteraction" ADD CONSTRAINT "SocialInteraction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchQuery" ADD CONSTRAINT "SearchQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentRecommendation" ADD CONSTRAINT "ContentRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleUpgrade" ADD CONSTRAINT "RoleUpgrade_fromRoleId_fkey" FOREIGN KEY ("fromRoleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleUpgrade" ADD CONSTRAINT "RoleUpgrade_toRoleId_fkey" FOREIGN KEY ("toRoleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserEngagement" ADD CONSTRAINT "UserEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Experiment" ADD CONSTRAINT "Experiment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserExperiment" ADD CONSTRAINT "UserExperiment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserExperiment" ADD CONSTRAINT "UserExperiment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "public"."Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_NodePrefixes" ADD CONSTRAINT "_NodePrefixes_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_NodePrefixes" ADD CONSTRAINT "_NodePrefixes_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ThreadPrefix"("id") ON DELETE CASCADE ON UPDATE CASCADE;
