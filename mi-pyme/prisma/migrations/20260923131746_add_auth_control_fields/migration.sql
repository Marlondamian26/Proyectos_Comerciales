-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "nombre" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'CLIENTE',
    "provincia" TEXT,
    "municipio" TEXT,
    "isGenericAdmin" BOOLEAN NOT NULL DEFAULT false,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "deletedReason" TEXT,
    "lastLoginAt" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "deletedAt", "deletedBy", "deletedReason", "email", "emailVerified", "id", "image", "isActive", "isGenericAdmin", "municipio", "mustChangePassword", "name", "nombre", "password", "provincia", "rol", "updatedAt", "username") SELECT "createdAt", "deletedAt", "deletedBy", "deletedReason", "email", "emailVerified", "id", "image", "isActive", "isGenericAdmin", "municipio", "mustChangePassword", "name", "nombre", "password", "provincia", "rol", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_rol_idx" ON "User"("rol");
CREATE INDEX "User_isGenericAdmin_idx" ON "User"("isGenericAdmin");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_lockedUntil_idx" ON "User"("lockedUntil");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
