-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PDF', 'TEXT', 'MANUAL');

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "filePath" TEXT,
    "embedding" DOUBLE PRECISION[],
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);
