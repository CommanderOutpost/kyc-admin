import crypto from "crypto";

type KycStatus = "PENDING" | "APPROVED" | "REJECTED";
type SubscriptionStatus = "INACTIVE" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export const computeWebhookSignature = (rawBody: Buffer, secret: string) =>
  crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

export const isValidWebhookSignature = (rawBody: Buffer, secret: string, signature: string) => {
  const expected = computeWebhookSignature(rawBody, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

export const canActivateSubscription = (kycStatus: KycStatus | undefined) => kycStatus === "APPROVED";

export const resolveSubscriptionStatus = (
  eventType: string,
  currentStatus: SubscriptionStatus
): SubscriptionStatus => {
  if (eventType === "payment.success") {
    return "ACTIVE";
  }

  if (eventType === "payment.failed") {
    return "PAST_DUE";
  }

  if (eventType === "subscription.canceled") {
    return "CANCELED";
  }

  return currentStatus;
};
