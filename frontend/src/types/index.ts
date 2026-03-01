export type UserRole = "ADMIN" | "USER";
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SubscriptionStatus = "INACTIVE" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Kyc {
  id: string;
  customerId: string;
  status: KycStatus;
  documentType: string;
  documentNumber: string;
  notes?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedById?: string;
  dateSubmitted: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  plan: string;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  startDate?: string;
  renewalDate?: string;
  canceledAt?: string;
  createdAt: string;
  subscriptionPlan?: SubscriptionPlan;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  customerId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  signature: string;
  isValid: boolean;
  payload: unknown;
  processedAt?: string;
  subscriptionId?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  userId?: string;
  createdAt: string;
  kyc?: Kyc;
  subscriptions?: Subscription[];
  auditLogs?: AuditLog[];
}

export interface GeneratedCredentials {
  email: string;
  password: string;
}

export interface MeResponse extends User {
  customer?: Customer & {
    kyc?: Kyc;
    subscriptions?: Subscription[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface CreateCustomerResponse {
  customer: Customer;
  generatedCredentials: GeneratedCredentials | null;
}
