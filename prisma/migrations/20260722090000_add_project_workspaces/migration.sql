-- CreateTable
CREATE TABLE "ProjectWorkspace" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMessage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWorkspace_projectId_key" ON "ProjectWorkspace"("projectId");

-- CreateIndex
CREATE INDEX "ProjectWorkspace_userId_idx" ON "ProjectWorkspace"("userId");

-- CreateIndex
CREATE INDEX "WorkspaceMessage_workspaceId_createdAt_idx" ON "WorkspaceMessage"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProjectWorkspace" ADD CONSTRAINT "ProjectWorkspace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkspace" ADD CONSTRAINT "ProjectWorkspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMessage" ADD CONSTRAINT "WorkspaceMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ProjectWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
