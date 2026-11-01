-- CreateEnum
CREATE TYPE "AnimeType" AS ENUM ('TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnimeStatus" AS ENUM ('FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnimeLanguage" AS ENUM ('JAPANESE_SUB', 'LATINO', 'CASTILIAN', 'MULTIPLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'MATCHED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "Anime" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEs" TEXT,
    "titleEn" TEXT,
    "titleRomaji" TEXT,
    "titleNative" TEXT,
    "normalizedTitle" TEXT NOT NULL,
    "anilistId" INTEGER,
    "description" TEXT,
    "posterUrl" TEXT,
    "bannerUrl" TEXT,
    "year" INTEGER,
    "episodes" INTEGER,
    "type" "AnimeType" NOT NULL DEFAULT 'UNKNOWN',
    "status" "AnimeStatus" NOT NULL DEFAULT 'UNKNOWN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeAlias" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimeAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AniListCache" (
    "id" TEXT NOT NULL,
    "anilistId" INTEGER NOT NULL,
    "searchAliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responseData" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AniListCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeGenre" (
    "animeId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "AnimeGenre_pkey" PRIMARY KEY ("animeId","genreId")
);

-- CreateTable
CREATE TABLE "TelegramChannel" (
    "id" TEXT NOT NULL,
    "telegramChatId" BIGINT,
    "username" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT,
    "type" "ChannelType" NOT NULL DEFAULT 'PUBLIC',
    "publicUrl" TEXT,
    "inviteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeChannel" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "telegramChannelId" TEXT NOT NULL,
    "language" "AnimeLanguage" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimeChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSource" (
    "id" TEXT NOT NULL,
    "telegramChatId" BIGINT,
    "username" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastImportedMessageId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSourcePost" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "messageId" INTEGER NOT NULL,
    "text" TEXT,
    "rawData" JSONB,
    "parsedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSourcePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeImport" (
    "id" TEXT NOT NULL,
    "sourcePostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "channelUrl" TEXT NOT NULL,
    "language" "AnimeLanguage" NOT NULL DEFAULT 'UNKNOWN',
    "anilistId" INTEGER,
    "anilistData" JSONB,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "animeId" TEXT,
    "telegramChannelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimeImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramPost" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" INTEGER NOT NULL,
    "caption" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentLink" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "seasonId" TEXT,
    "episodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotUser" (
    "id" TEXT NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "BotUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimeFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "animeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Anime_anilistId_key" ON "Anime"("anilistId");

-- CreateIndex
CREATE INDEX "Anime_title_idx" ON "Anime"("title");

-- CreateIndex
CREATE INDEX "Anime_normalizedTitle_idx" ON "Anime"("normalizedTitle");

-- CreateIndex
CREATE INDEX "Anime_year_idx" ON "Anime"("year");

-- CreateIndex
CREATE INDEX "Anime_isActive_idx" ON "Anime"("isActive");

-- CreateIndex
CREATE INDEX "AnimeAlias_normalized_idx" ON "AnimeAlias"("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeAlias_animeId_normalized_key" ON "AnimeAlias"("animeId", "normalized");

-- CreateIndex
CREATE UNIQUE INDEX "AniListCache_anilistId_key" ON "AniListCache"("anilistId");

-- CreateIndex
CREATE INDEX "AniListCache_fetchedAt_idx" ON "AniListCache"("fetchedAt");

-- CreateIndex
CREATE INDEX "Season_animeId_idx" ON "Season"("animeId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_animeId_number_key" ON "Season"("animeId", "number");

-- CreateIndex
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_number_key" ON "Episode"("seasonId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "Genre_name_idx" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "AnimeGenre_genreId_idx" ON "AnimeGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChannel_telegramChatId_key" ON "TelegramChannel"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChannel_username_key" ON "TelegramChannel"("username");

-- CreateIndex
CREATE INDEX "TelegramChannel_title_idx" ON "TelegramChannel"("title");

-- CreateIndex
CREATE INDEX "TelegramChannel_isActive_idx" ON "TelegramChannel"("isActive");

-- CreateIndex
CREATE INDEX "AnimeChannel_animeId_idx" ON "AnimeChannel"("animeId");

-- CreateIndex
CREATE INDEX "AnimeChannel_telegramChannelId_idx" ON "AnimeChannel"("telegramChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeChannel_animeId_telegramChannelId_language_key" ON "AnimeChannel"("animeId", "telegramChannelId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSource_telegramChatId_key" ON "TelegramSource"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSource_username_key" ON "TelegramSource"("username");

-- CreateIndex
CREATE INDEX "TelegramSourcePost_sourceId_idx" ON "TelegramSourcePost"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSourcePost_sourceId_messageId_key" ON "TelegramSourcePost"("sourceId", "messageId");

-- CreateIndex
CREATE INDEX "AnimeImport_status_idx" ON "AnimeImport"("status");

-- CreateIndex
CREATE INDEX "AnimeImport_normalizedTitle_idx" ON "AnimeImport"("normalizedTitle");

-- CreateIndex
CREATE INDEX "AnimeImport_anilistId_idx" ON "AnimeImport"("anilistId");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeImport_sourcePostId_normalizedTitle_channelUrl_key" ON "AnimeImport"("sourcePostId", "normalizedTitle", "channelUrl");

-- CreateIndex
CREATE INDEX "TelegramPost_status_idx" ON "TelegramPost"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramPost_channelId_messageId_key" ON "TelegramPost"("channelId", "messageId");

-- CreateIndex
CREATE INDEX "ContentLink_animeId_idx" ON "ContentLink"("animeId");

-- CreateIndex
CREATE INDEX "ContentLink_postId_idx" ON "ContentLink"("postId");

-- CreateIndex
CREATE INDEX "ContentLink_seasonId_idx" ON "ContentLink"("seasonId");

-- CreateIndex
CREATE INDEX "ContentLink_episodeId_idx" ON "ContentLink"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BotUser_telegramUserId_key" ON "BotUser"("telegramUserId");

-- CreateIndex
CREATE INDEX "BotUser_role_idx" ON "BotUser"("role");

-- CreateIndex
CREATE INDEX "AnimeFavorite_userId_createdAt_idx" ON "AnimeFavorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeFavorite_userId_animeId_key" ON "AnimeFavorite"("userId", "animeId");

-- CreateIndex
CREATE INDEX "AnimeRequest_status_idx" ON "AnimeRequest"("status");

-- CreateIndex
CREATE INDEX "AnimeRequest_userId_idx" ON "AnimeRequest"("userId");

-- CreateIndex
CREATE INDEX "SearchLog_normalized_idx" ON "SearchLog"("normalized");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "SearchLog_userId_idx" ON "SearchLog"("userId");

-- AddForeignKey
ALTER TABLE "AnimeAlias" ADD CONSTRAINT "AnimeAlias_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeGenre" ADD CONSTRAINT "AnimeGenre_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeGenre" ADD CONSTRAINT "AnimeGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeChannel" ADD CONSTRAINT "AnimeChannel_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeChannel" ADD CONSTRAINT "AnimeChannel_telegramChannelId_fkey" FOREIGN KEY ("telegramChannelId") REFERENCES "TelegramChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramSourcePost" ADD CONSTRAINT "TelegramSourcePost_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "TelegramSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeImport" ADD CONSTRAINT "AnimeImport_sourcePostId_fkey" FOREIGN KEY ("sourcePostId") REFERENCES "TelegramSourcePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeImport" ADD CONSTRAINT "AnimeImport_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeImport" ADD CONSTRAINT "AnimeImport_telegramChannelId_fkey" FOREIGN KEY ("telegramChannelId") REFERENCES "TelegramChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramPost" ADD CONSTRAINT "TelegramPost_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TelegramChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentLink" ADD CONSTRAINT "ContentLink_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentLink" ADD CONSTRAINT "ContentLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TelegramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentLink" ADD CONSTRAINT "ContentLink_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentLink" ADD CONSTRAINT "ContentLink_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeFavorite" ADD CONSTRAINT "AnimeFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BotUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeFavorite" ADD CONSTRAINT "AnimeFavorite_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeRequest" ADD CONSTRAINT "AnimeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BotUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeRequest" ADD CONSTRAINT "AnimeRequest_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchLog" ADD CONSTRAINT "SearchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BotUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
