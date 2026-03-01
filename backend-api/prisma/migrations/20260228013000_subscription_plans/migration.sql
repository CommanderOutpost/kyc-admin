-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- Seed default plans
INSERT INTO "SubscriptionPlan" ("id", "name", "description", "amount", "currency", "isActive", "createdAt", "updatedAt")
VALUES
  ('plan_basic', 'BASIC', 'Entry plan', 500000, 'NGN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_pro', 'PRO', 'Professional plan', 1500000, 'NGN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_business', 'BUSINESS', 'Business plan', 3000000, 'NGN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "planId" TEXT;
ALTER TABLE "Subscription" ALTER COLUMN "plan" TYPE TEXT USING "plan"::text;

-- Backfill existing subscriptions
UPDATE "Subscription" s
SET "planId" = sp."id"
FROM "SubscriptionPlan" sp
WHERE sp."name" = s."plan";

ALTER TABLE "Subscription" ALTER COLUMN "planId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
