import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PaginationControls } from "../../components/PaginationControls";
import { useAdmin } from "../../context/AdminContext";
import { SubscriptionPlan } from "../../types";

export const SubscriptionsPage = () => {
  const {
    subscriptionPlans,
    customers,
    customersPagination,
    selectedCustomer,
    selectedCustomerId,
    subscriptionPlanForm,
    search,
    setSearch,
    setCustomersPage,
    setSelectedCustomerId,
    setSubForm,
    setSubscriptionPlanForm,
    subForm,
    refreshAll,
    actionLoading,
    createSubscription,
    cancelSubscription,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan
  } = useAdmin();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [drawerWidth, setDrawerWidth] = useState(420);
  const workspaceRef = useRef<HTMLElement | null>(null);

  const selectedPlan = useMemo(
    () => subscriptionPlans.find((plan) => plan.id === subForm.planId) || null,
    [subscriptionPlans, subForm.planId]
  );

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setSubscriptionPlanForm({ name: "", description: "", amount: "", currency: "NGN", isActive: true });
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setSubscriptionPlanForm({
      name: plan.name,
      description: plan.description || "",
      amount: String(plan.amount),
      currency: plan.currency,
      isActive: plan.isActive
    });
    setShowPlanModal(true);
  };

  const onSubmitPlan = async (event: FormEvent) => {
    event.preventDefault();
    if (editingPlan) {
      await updateSubscriptionPlan(editingPlan.id, subscriptionPlanForm);
    } else {
      await createSubscriptionPlan();
    }
    setShowPlanModal(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomersPage(1);
      refreshAll(undefined, search, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!workspaceRef.current) return;
      const bounds = workspaceRef.current.getBoundingClientRect();
      const nextWidth = Math.min(760, Math.max(340, bounds.right - moveEvent.clientX));
      setDrawerWidth(nextWidth);
    };

    const stopResize = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);
  };

  return (
    <section
      ref={workspaceRef}
      className={`workspace split ${showDrawer && selectedCustomer ? "has-drawer" : ""}`}
      style={showDrawer && selectedCustomer ? { gridTemplateColumns: `minmax(0, 1fr) ${drawerWidth}px` } : undefined}
    >
      <div className="workspace-main">
        <header className="workspace-head">
          <div>
            <h2>Subscriptions</h2>
            <p className="subtle">Manage subscription plans and assign subscriptions to customers.</p>
          </div>
          <div className="inline-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name/email"
            />
            <button onClick={() => refreshAll(undefined, search)}>Search</button>
          </div>
        </header>

        <section className="workspace-detail">
          <div className="section-head">
            <div>
              <p className="eyebrow">Plan Catalog</p>
              <h3>Available Subscription Plans</h3>
            </div>
            <button onClick={openCreatePlanModal}>+ New Plan</button>
          </div>
          <div className="plan-grid">
            {subscriptionPlans.map((plan) => (
              <article className="plan-card" key={plan.id}>
                <div className="subscription-card-head">
                  <div>
                    <p className="eyebrow">Plan</p>
                    <h3>{plan.name}</h3>
                  </div>
                  <span className={`status-pill ${plan.isActive ? "active" : "canceled"}`}>
                    {plan.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <p className="subtle">{plan.description || "No description set."}</p>
                <div className="subscription-card-meta">
                  <div>
                    <p className="eyebrow">Amount</p>
                    <p>
                      {plan.amount} {plan.currency}
                    </p>
                  </div>
                </div>
                <div className="subscription-card-actions">
                  <button className="ghost-btn" onClick={() => openEditPlanModal(plan)}>
                    Edit
                  </button>
                  <button className="ghost-btn" disabled={actionLoading} onClick={() => deleteSubscriptionPlan(plan.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="workspace-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Latest ID</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Renewal</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const latest = customer.subscriptions?.[0];
                return (
                  <tr
                    key={customer.id}
                    className={`clickable-row ${selectedCustomerId === customer.id ? "is-active" : ""}`}
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setShowDrawer(true);
                    }}
                  >
                    <td>
                      <strong>{customer.name}</strong>
                      <div className="subtle">{customer.email}</div>
                    </td>
                    <td>{latest?.id ? <code>{latest.id}</code> : "-"}</td>
                    <td>{latest?.plan || "-"}</td>
                    <td>{latest?.status || "NONE"}</td>
                    <td>{latest ? `${latest.amount} ${latest.currency}` : "-"}</td>
                    <td>{latest?.renewalDate ? new Date(latest.renewalDate).toLocaleDateString() : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationControls
          pagination={customersPagination}
          onPageChange={(nextPage) => {
            setCustomersPage(nextPage);
            refreshAll(undefined, search, nextPage);
          }}
        />
      </div>

      <aside
        className={`detail-drawer ${showDrawer && selectedCustomer ? "open" : ""}`}
        style={showDrawer && selectedCustomer ? { maxWidth: `${drawerWidth}px` } : undefined}
      >
        {selectedCustomer && (
          <div className="drawer-content">
            <div className="drawer-resize-handle" onMouseDown={startResize} />
            <div className="drawer-head">
              <h3>Subscription History</h3>
              <button className="ghost-btn" onClick={() => setShowDrawer(false)}>
                Dismiss
              </button>
            </div>
            <p className="subtle">
              {selectedCustomer ? `Showing ${selectedCustomer.name}` : "Select a customer row to view history."}
              {actionLoading ? " Refreshing..." : ""}
            </p>
            <p className="subtle">
              Customer ID: <code>{selectedCustomer.id}</code>
            </p>
            <div className="drawer-section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Assign Plan</p>
                  <h3>Create Subscription</h3>
                </div>
              </div>
              <div className="form-stack">
                <select
                  value={subForm.planId}
                  onChange={(event) => setSubForm({ planId: event.target.value })}
                >
                  {subscriptionPlans.filter((plan) => plan.isActive).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · {plan.amount} {plan.currency}
                    </option>
                  ))}
                </select>
                {selectedPlan && <p className="subtle">{selectedPlan.description || "No description set."}</p>}
                <button disabled={actionLoading} onClick={() => createSubscription()}>
                  {actionLoading ? "Creating..." : "Create Subscription"}
                </button>
              </div>
            </div>
            {selectedCustomer.subscriptions?.length ? (
              <div className="workspace-table-wrap compact">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Started</th>
                      <th>Renewal</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomer.subscriptions.map((subscription) => (
                      <tr key={subscription.id}>
                        <td><code>{subscription.id}</code></td>
                        <td>{subscription.plan}</td>
                        <td>{subscription.status}</td>
                        <td>{subscription.amount} {subscription.currency}</td>
                        <td>{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : "-"}</td>
                        <td>{subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : "-"}</td>
                        <td>
                          {subscription.status !== "CANCELED" ? (
                            <button
                              className="ghost-btn"
                              disabled={actionLoading}
                              onClick={() => cancelSubscription(subscription.id)}
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="subtle">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="subtle">No subscriptions for selected customer.</p>
            )}
          </div>
        )}
      </aside>

      {showPlanModal && (
        <div className="modal-backdrop" onClick={() => setShowPlanModal(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}</h3>
              <button className="ghost-btn" onClick={() => setShowPlanModal(false)}>
                Close
              </button>
            </div>
            <form className="form-grid" onSubmit={onSubmitPlan}>
              <input
                placeholder="Plan name"
                value={subscriptionPlanForm.name}
                onChange={(event) =>
                  setSubscriptionPlanForm({ ...subscriptionPlanForm, name: event.target.value })
                }
              />
              <input
                placeholder="Currency"
                value={subscriptionPlanForm.currency}
                onChange={(event) =>
                  setSubscriptionPlanForm({ ...subscriptionPlanForm, currency: event.target.value.toUpperCase() })
                }
              />
              <input
                placeholder="Amount in kobo"
                type="number"
                value={subscriptionPlanForm.amount}
                onChange={(event) =>
                  setSubscriptionPlanForm({ ...subscriptionPlanForm, amount: event.target.value })
                }
              />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={subscriptionPlanForm.isActive}
                  onChange={(event) =>
                    setSubscriptionPlanForm({ ...subscriptionPlanForm, isActive: event.target.checked })
                  }
                />
                Active plan
              </label>
              <input
                className="span-two"
                placeholder="Description"
                value={subscriptionPlanForm.description}
                onChange={(event) =>
                  setSubscriptionPlanForm({ ...subscriptionPlanForm, description: event.target.value })
                }
              />
              <button className="span-two" disabled={actionLoading}>
                {actionLoading ? "Saving..." : editingPlan ? "Save Changes" : "Create Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
