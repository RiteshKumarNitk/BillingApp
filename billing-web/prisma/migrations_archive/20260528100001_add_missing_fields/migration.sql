-- CreateTable: Role
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_name_key" ON "Role"("tenantId", "name");

-- AddForeignKey for Role
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Add business details columns to Tenant
ALTER TABLE "Tenant" ADD COLUMN "contactPerson" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "email" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "phone" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "address" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "gstin" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE';

-- AlterTable: Add new columns to User
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "tenantRoleId" TEXT;

-- AddForeignKey for User -> Role
ALTER TABLE "User" ADD CONSTRAINT "User_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add unit column to Product
ALTER TABLE "Product" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'PIECE';

-- AlterTable: Make barcode nullable (was NOT NULL)
ALTER TABLE "Product" ALTER COLUMN "barcode" DROP NOT NULL;
