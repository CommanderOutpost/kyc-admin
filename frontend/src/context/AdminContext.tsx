import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError } from "../api/client";
import {
  AuditLog,
  CreateCustomerResponse,
  Customer,
  PaginationMeta,
  PaginatedResponse,
  Subscription,
  SubscriptionPlan,
  WebhookEvent
} from "../types";

type CustomerForm = { name: string; email: string; phone: string; address: string };
type KycForm = { documentType: string; documentNumber: string; notes: string; rejectReason: string };
type SubForm = { planId: string };
type SubscriptionPlanForm = { name: string; description: string; amount: string; currency: string; isActive: boolean };

type AdminContextValue = {
  customers: Customer[];
  customersPagination: PaginationMeta;
  customersPage: number;
  selectedCustomerId: string;
  selectedCustomer: Customer | null;
  selectedSubscription?: Subscription;
  webhookEvents: WebhookEvent[];
  webhookEventsPagination: PaginationMeta;
  webhookEventsPage: number;
  auditLogs: AuditLog[];
  auditLogsPagination: PaginationMeta;
  auditLogsPage: number;
  subscriptionPlans: SubscriptionPlan[];
  search: string;
  loading: boolean;
  actionLoading: boolean;
  error: string;
  customerForm: CustomerForm;
  kycForm: KycForm;
  subForm: SubForm;
  subscriptionPlanForm: SubscriptionPlanForm;
  setSearch: (value: string) => void;
  setCustomersPage: (value: number) => void;
  setWebhookEventsPage: (value: number) => void;
  setAuditLogsPage: (value: number) => void;
  setSelectedCustomerId: (value: string) => void;
  setCustomerForm: (value: CustomerForm) => void;
  setKycForm: (value: KycForm) => void;
  setSubForm: (value: SubForm) => void;
  setSubscriptionPlanForm: (value: SubscriptionPlanForm) => void;
  clearError: () => void;
  refreshAll: (
    customerId?: string,
    query?: string,
    customerPageOverride?: number,
    webhookPageOverride?: number,
    auditPageOverride?: number
  ) => Promise<void>;
  createCustomer: () => Promise<CreateCustomerResponse | null>;
  loadSubscriptionPlans: () => Promise<void>;
  createSubscriptionPlan: () => Promise<void>;
  updateSubscriptionPlan: (planId: string, input: SubscriptionPlanForm) => Promise<void>;
  deleteSubscriptionPlan: (planId: string) => Promise<void>;
  submitKyc: () => Promise<void>;
  decideKyc: (
    decision: "approve" | "reject" | "pending",
    rejectReasonOverride?: string,
    customerIdOverride?: string
  ) => Promise<void>;
  createSubscription: () => Promise<void>;
  cancelSubscription: (subscriptionId?: string) => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | undefined>(undefined);
const DEFAULT_PAGINATION: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersPagination, setCustomersPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [customersPage, setCustomersPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [webhookEventsPagination, setWebhookEventsPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [webhookEventsPage, setWebhookEventsPage] = useState(1);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogsPagination, setAuditLogsPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [customerForm, setCustomerForm] = useState<CustomerForm>({ name: "", email: "", phone: "", address: "" });
  const [kycForm, setKycForm] = useState<KycForm>({ documentType: "", documentNumber: "", notes: "", rejectReason: "" });
  const [subForm, setSubForm] = useState<SubForm>({ planId: "" });
  const [subscriptionPlanForm, setSubscriptionPlanForm] = useState<SubscriptionPlanForm>({
    name: "",
    description: "",
    amount: "",
    currency: "NGN",
    isActive: true
  });

  const selectedSubscription = useMemo<Subscription | undefined>(
    () => selectedCustomer?.subscriptions?.[0],
    [selectedCustomer]
  );

  const handleError = (err: unknown, fallback: string) => {
    setError(err instanceof ApiError ? err.message : fallback);
  };

  const loadCustomers = async (query = "", page = customersPage) => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    params.set("page", String(page));
    params.set("limit", "10");

    const response = await apiRequest<PaginatedResponse<Customer>>(`/customers?${params.toString()}`);
    setCustomers(response.data);
    setCustomersPagination(response.pagination);

    if (!selectedCustomerId && response.data.length > 0) {
      setSelectedCustomerId(response.data[0].id);
      return response.data[0].id;
    }

    return selectedCustomerId;
  };

  const loadCustomerDetails = async (customerId: string) => {
    const detail = await apiRequest<Customer>(`/customers/${customerId}`);
    setSelectedCustomer(detail);
  };

  const loadWebhookEvents = async (page = webhookEventsPage) => {
    const response = await apiRequest<PaginatedResponse<WebhookEvent>>(`/webhooks/events?page=${page}&limit=10`);
    setWebhookEvents(response.data);
    setWebhookEventsPagination(response.pagination);
  };

  const loadAuditLogs = async (page = auditLogsPage) => {
    const response = await apiRequest<PaginatedResponse<AuditLog>>(`/audit-logs?page=${page}&limit=10`);
    setAuditLogs(response.data);
    setAuditLogsPagination(response.pagination);
  };

  const loadSubscriptionPlans = async () => {
    const response = await apiRequest<SubscriptionPlan[]>("/subscription-plans");
    setSubscriptionPlans(response);
    setSubForm((current) => {
      const currentStillExists = response.some((plan) => plan.id === current.planId && plan.isActive);
      return {
        planId:
          (currentStillExists ? current.planId : "") ||
          response.find((plan) => plan.isActive)?.id ||
          response[0]?.id ||
          ""
      };
    });
  };

  const refreshAll = async (
    customerId?: string,
    query?: string,
    customerPageOverride?: number,
    webhookPageOverride?: number,
    auditPageOverride?: number
  ) => {
    setLoading(true);
    setError("");

    try {
      const nextQuery = query ?? search;
      const nextCustomerPage = customerPageOverride ?? customersPage;
      const nextWebhookPage = webhookPageOverride ?? webhookEventsPage;
      const nextAuditPage = auditPageOverride ?? auditLogsPage;

      const selectedId = await loadCustomers(nextQuery, nextCustomerPage);
      await Promise.all([loadWebhookEvents(nextWebhookPage), loadAuditLogs(nextAuditPage), loadSubscriptionPlans()]);

      const detailId = customerId || selectedId;
      if (detailId) {
        await loadCustomerDetails(detailId);
      }
    } catch (err) {
      handleError(err, "Failed loading admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;
    loadCustomerDetails(selectedCustomerId).catch((err) => handleError(err, "Failed to load customer details"));
  }, [selectedCustomerId]);

  const createCustomer = async (): Promise<CreateCustomerResponse | null> => {
    if (!customerForm.name || !customerForm.email || !customerForm.phone || !customerForm.address) {
      setError("All customer fields are required");
      return null;
    }

    setActionLoading(true);
    setError("");

    try {
      const created = await apiRequest<CreateCustomerResponse>("/customers", {
        method: "POST",
        body: JSON.stringify(customerForm)
      });
      setCustomerForm({ name: "", email: "", phone: "", address: "" });
      setCustomersPage(1);
      setSelectedCustomerId(created.customer.id);
      await refreshAll(created.customer.id, search, 1);
      return created;
    } catch (err) {
      handleError(err, "Failed to create customer");
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const createSubscriptionPlan = async () => {
    if (!subscriptionPlanForm.name.trim() || !subscriptionPlanForm.amount || !subscriptionPlanForm.currency.trim()) {
      setError("Plan name, amount, and currency are required");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await apiRequest("/subscription-plans", {
        method: "POST",
        body: JSON.stringify({
          name: subscriptionPlanForm.name.trim(),
          description: subscriptionPlanForm.description.trim() || undefined,
          amount: Number(subscriptionPlanForm.amount),
          currency: subscriptionPlanForm.currency.trim().toUpperCase(),
          isActive: subscriptionPlanForm.isActive
        })
      });
      setSubscriptionPlanForm({ name: "", description: "", amount: "", currency: "NGN", isActive: true });
      await loadSubscriptionPlans();
    } catch (err) {
      handleError(err, "Failed to create subscription plan");
    } finally {
      setActionLoading(false);
    }
  };

  const updateSubscriptionPlan = async (planId: string, input: SubscriptionPlanForm) => {
    setActionLoading(true);
    setError("");

    try {
      await apiRequest(`/subscription-plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: input.name.trim(),
          description: input.description.trim() || undefined,
          amount: Number(input.amount),
          currency: input.currency.trim().toUpperCase(),
          isActive: input.isActive
        })
      });
      await loadSubscriptionPlans();
      await refreshAll(selectedCustomerId || undefined, search, customersPage, webhookEventsPage, auditLogsPage);
    } catch (err) {
      handleError(err, "Failed to update subscription plan");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSubscriptionPlan = async (planId: string) => {
    setActionLoading(true);
    setError("");

    try {
      await apiRequest(`/subscription-plans/${planId}`, { method: "DELETE" });
      await loadSubscriptionPlans();
    } catch (err) {
      handleError(err, "Failed to delete subscription plan");
    } finally {
      setActionLoading(false);
    }
  };

  const submitKyc = async () => {
    if (!selectedCustomerId) return;
    if (!kycForm.documentType || !kycForm.documentNumber) {
      setError("KYC document type and number are required");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await apiRequest(`/customers/${selectedCustomerId}/kyc/submit`, {
        method: "POST",
        body: JSON.stringify({
          documentType: kycForm.documentType,
          documentNumber: kycForm.documentNumber,
          notes: kycForm.notes || undefined
        })
      });
      await refreshAll(selectedCustomerId, search, customersPage, webhookEventsPage, auditLogsPage);
    } catch (err) {
      handleError(err, "Failed to submit KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const decideKyc = async (
    decision: "approve" | "reject" | "pending",
    rejectReasonOverride?: string,
    customerIdOverride?: string
  ) => {
    const targetCustomerId = customerIdOverride ?? selectedCustomerId;
    if (!targetCustomerId) return;
    const reason = (rejectReasonOverride ?? kycForm.rejectReason).trim();
    if (decision === "reject" && !reason) {
      setError("Rejection reason is required");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      if (decision === "approve" || decision === "reject") {
        await apiRequest(`/customers/${targetCustomerId}/kyc/${decision}`, {
          method: "POST",
          body: decision === "reject" ? JSON.stringify({ reason }) : undefined
        });
      } else {
        await apiRequest(`/customers/${targetCustomerId}/kyc/status`, {
          method: "POST",
          body: JSON.stringify({ status: "PENDING" })
        });
      }
      await refreshAll(targetCustomerId, search, customersPage, webhookEventsPage, auditLogsPage);
    } catch (err) {
      handleError(err, decision === "pending" ? "Failed to reset KYC to pending" : `Failed to ${decision} KYC`);
    } finally {
      setActionLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!selectedCustomerId) return;
    if (!subForm.planId) {
      setError("Select a subscription plan");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await apiRequest(`/customers/${selectedCustomerId}/subscriptions`, {
        method: "POST",
        body: JSON.stringify({ planId: subForm.planId })
      });
      await refreshAll(selectedCustomerId, search, customersPage, webhookEventsPage, auditLogsPage);
    } catch (err) {
      handleError(err, "Failed to create subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId?: string) => {
    const targetSubscriptionId = subscriptionId ?? selectedSubscription?.id;
    if (!targetSubscriptionId) return;

    setActionLoading(true);
    setError("");

    try {
      await apiRequest(`/subscriptions/${targetSubscriptionId}/cancel`, { method: "POST" });
      await refreshAll(selectedCustomerId, search, customersPage, webhookEventsPage, auditLogsPage);
    } catch (err) {
      handleError(err, "Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      customers,
      customersPagination,
      customersPage,
      selectedCustomerId,
      selectedCustomer,
      selectedSubscription,
      webhookEvents,
      webhookEventsPagination,
      webhookEventsPage,
      auditLogs,
      auditLogsPagination,
      auditLogsPage,
      subscriptionPlans,
      search,
      loading,
      actionLoading,
      error,
      customerForm,
      kycForm,
      subForm,
      subscriptionPlanForm,
      setSearch,
      setCustomersPage,
      setWebhookEventsPage,
      setAuditLogsPage,
      setSelectedCustomerId,
      setCustomerForm,
      setKycForm,
      setSubForm,
      setSubscriptionPlanForm,
      clearError: () => setError(""),
      refreshAll,
      createCustomer,
      loadSubscriptionPlans,
      createSubscriptionPlan,
      updateSubscriptionPlan,
      deleteSubscriptionPlan,
      submitKyc,
      decideKyc,
      createSubscription,
      cancelSubscription
    }),
    [
      customers,
      customersPagination,
      customersPage,
      selectedCustomerId,
      selectedCustomer,
      selectedSubscription,
      webhookEvents,
      webhookEventsPagination,
      webhookEventsPage,
      auditLogs,
      auditLogsPagination,
      auditLogsPage,
      subscriptionPlans,
      search,
      loading,
      actionLoading,
      error,
      customerForm,
      kycForm,
      subForm,
      subscriptionPlanForm
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }

  return context;
};
