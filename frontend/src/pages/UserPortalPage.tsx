import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, ApiError } from "../api/client";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { MeResponse, SubscriptionPlan } from "../types";

export const UserPortalPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [kycForm, setKycForm] = useState({ documentType: "", documentNumber: "", notes: "" });
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);

  const loadMe = async () => {
    const data = await apiRequest<MeResponse>("/auth/me");
    setMe(data);
  };

  const loadSubscriptionPlans = async () => {
    const data = await apiRequest<SubscriptionPlan[]>("/subscription-plans");
    setSubscriptionPlans(data.filter((plan) => plan.isActive));
  };

  useEffect(() => {
    Promise.all([loadMe(), loadSubscriptionPlans()])
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const subscriptions = me?.customer?.subscriptions || [];
  const visibleSubscriptions = subscriptions.filter((subscription) => subscription.status !== "CANCELED");
  const latestSubscription = visibleSubscriptions[0];
  const customerId = me?.customer?.id;
  const kycStatus = me?.customer?.kyc?.status || "PENDING";
  const subscriptionStatus = latestSubscription?.status || "INACTIVE";
  const canManageSubscriptions = kycStatus === "APPROVED";

  const showSuccess = (message: string) => {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((current) => (current === message ? "" : current));
    }, 4000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const onSubmitKyc = async (event: FormEvent) => {
    event.preventDefault();
    if (!customerId) return;
    if (!kycForm.documentType || !kycForm.documentNumber) {
      setError("Document type and number are required");
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/customers/${customerId}/kyc/submit`, {
        method: "POST",
        body: JSON.stringify({
          documentType: kycForm.documentType,
          documentNumber: kycForm.documentNumber,
          notes: kycForm.notes || undefined
        })
      });
      await loadMe();
      showSuccess(me?.customer?.kyc ? "KYC resubmitted successfully." : "KYC submitted successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const onCancelSubscription = async (subscriptionId: string) => {
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/subscriptions/${subscriptionId}/cancel`, { method: "POST" });
      await loadMe();
      showSuccess("Subscription canceled successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const onStartSubscription = async (subscriptionId: string) => {
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/subscriptions/${subscriptionId}/start`, { method: "POST" });
      await loadMe();
      showSuccess("Subscription started and is now awaiting payment confirmation.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const onChoosePlan = async (planId: string) => {
    if (!customerId) return;
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/customers/${customerId}/subscriptions`, {
        method: "POST",
        body: JSON.stringify({ planId })
      });
      await loadMe();
      showSuccess("Subscription created and is now awaiting payment confirmation.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to choose subscription plan");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="app-shell portal-shell">
      <TopBar
        title="Customer Workspace"
        subtitle="Monitor KYC and manage your subscriptions."
        actions={
          <button className="ghost-btn" onClick={handleLogout}>
            Logout
          </button>
        }
      />
      {loading && <p className="subtle">Loading your profile...</p>}
      {error && <p className="error-note">{error}</p>}
      {notice && <p className="success-note">{notice}</p>}

      {me?.customer && (
        <>
          <section className="portal-hero">
            <div>
              <p className="eyebrow">Customer Profile</p>
              <h2>{me.customer.name}</h2>
            </div>
            <div className="portal-meta">
              <span className={`status-pill ${kycStatus.toLowerCase()}`}>KYC {kycStatus}</span>
              <span className={`status-pill ${subscriptionStatus.toLowerCase().replace("_", "-")}`}>
                Subscription {subscriptionStatus}
              </span>
            </div>
          </section>

          <section className="portal-stats">
            <article className="metric-card panel">
              <p className="eyebrow">Email</p>
              <h3>{me.customer.email}</h3>
              <p className="subtle">Login identity and notification address.</p>
            </article>
            <article className="metric-card panel">
              <p className="eyebrow">Phone</p>
              <h3>{me.customer.phone}</h3>
              <p className="subtle">Used for profile verification and support.</p>
            </article>
            <article className="metric-card panel">
              <p className="eyebrow">Address</p>
              <h3>{me.customer.address}</h3>
              <p className="subtle">Current residential or business address on file.</p>
            </article>
          </section>

          <section className="portal-grid">
            <article className="panel portal-section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Identity Review</p>
                  <h2>KYC Submission</h2>
                </div>
                <span className={`status-pill ${kycStatus.toLowerCase()}`}>{kycStatus}</span>
              </div>

              <div className="info-strip">
                <p>
                  {kycStatus === "APPROVED" && "Your KYC is approved. You can resubmit only if your details have changed."}
                  {kycStatus === "REJECTED" && "Your last KYC review was rejected. Update the details below and resubmit."}
                  {kycStatus === "PENDING" && "Submit your KYC details for review. Admin approval is required before activation."}
                </p>
              </div>

              {me.customer.kyc && (
                <div className="detail-list">
                  <div>
                    <p className="eyebrow">Document Type</p>
                    <p>{me.customer.kyc.documentType}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Document Number</p>
                    <p>{me.customer.kyc.documentNumber}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Submitted</p>
                    <p>{new Date(me.customer.kyc.dateSubmitted).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {me.customer.kyc?.rejectionReason && (
                <p className="error-note">Rejection reason: {me.customer.kyc.rejectionReason}</p>
              )}

              <form className="form-stack mt" onSubmit={onSubmitKyc}>
                <input
                  placeholder="Document type"
                  value={kycForm.documentType}
                  onChange={(e) => setKycForm({ ...kycForm, documentType: e.target.value })}
                />
                <input
                  placeholder="Document number"
                  value={kycForm.documentNumber}
                  onChange={(e) => setKycForm({ ...kycForm, documentNumber: e.target.value })}
                />
                <input
                  placeholder="Notes (optional)"
                  value={kycForm.notes}
                  onChange={(e) => setKycForm({ ...kycForm, notes: e.target.value })}
                />
                <button disabled={actionLoading}>{actionLoading ? "Submitting..." : "Submit / Resubmit KYC"}</button>
              </form>
            </article>

            <article className="panel portal-section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Billing</p>
                  <h2>Current Subscription</h2>
                </div>
                <span className={`status-pill ${subscriptionStatus.toLowerCase().replace("_", "-")}`}>
                  {subscriptionStatus}
                </span>
              </div>

              {latestSubscription ? (
                <article className="current-subscription-card">
                  <div className="subscription-card-head">
                    <div>
                      <p className="eyebrow">Plan</p>
                      <h3>{latestSubscription.plan}</h3>
                    </div>
                    <span className={`status-pill ${latestSubscription.status.toLowerCase().replace("_", "-")}`}>
                      {latestSubscription.status}
                    </span>
                  </div>

                  <div className="subscription-card-meta">
                    <div>
                      <p className="eyebrow">Amount</p>
                      <p>
                        {latestSubscription.amount} {latestSubscription.currency}
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow">Renewal</p>
                      <p>
                        {latestSubscription.renewalDate
                          ? new Date(latestSubscription.renewalDate).toLocaleString()
                          : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="subscription-card-actions">
                    {latestSubscription.status !== "ACTIVE" && (
                      <button
                        disabled={actionLoading || !canManageSubscriptions}
                        onClick={() => onStartSubscription(latestSubscription.id)}
                      >
                        {actionLoading ? "Processing..." : "Start"}
                      </button>
                    )}
                    <button
                      className="ghost-btn"
                      disabled={actionLoading || !canManageSubscriptions}
                      onClick={() => onCancelSubscription(latestSubscription.id)}
                    >
                      {actionLoading ? "Processing..." : "Cancel"}
                    </button>
                  </div>
                </article>
              ) : (
                <div className="empty-panel">
                  <p className="subtle">No current subscription selected yet.</p>
                </div>
              )}

              <div className="plans-section">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Available Plans</p>
                    <h3>Choose A Plan</h3>
                  </div>
                </div>

                {!canManageSubscriptions && (
                  <p className="info-strip">
                    Subscription actions unlock only after your KYC has been approved.
                  </p>
                )}

                <div className="plan-picker-grid">
                  {subscriptionPlans.map((plan) => (
                    <article className="plan-picker-card" key={plan.id}>
                      <div className="subscription-card-head">
                        <div>
                          <p className="eyebrow">Plan</p>
                          <h3>{plan.name}</h3>
                        </div>
                        <p className="subscription-price">
                          {plan.amount} {plan.currency}
                        </p>
                      </div>
                      <p className="subtle">{plan.description || "No description set."}</p>
                      <div className="subscription-card-actions">
                        <button
                          disabled={actionLoading || !canManageSubscriptions}
                          onClick={() => onChoosePlan(plan.id)}
                        >
                          {actionLoading ? "Processing..." : "Choose Plan"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          </section>
        </>
      )}

      {!loading && !me?.customer && (
        <section className="panel empty-panel">
          <h2>No linked customer profile</h2>
          <p className="subtle">Your login exists, but no customer profile is attached to it yet.</p>
        </section>
      )}
    </main>
  );
};
