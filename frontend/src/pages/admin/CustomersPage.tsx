import { FormEvent, useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { PaginationControls } from "../../components/PaginationControls";
import { useAdmin } from "../../context/AdminContext";
import { GeneratedCredentials } from "../../types";

export const CustomersPage = () => {
  const navigate = useNavigate();
  const {
    customers,
    customersPagination,
    customersPage,
    selectedCustomer,
    selectedCustomerId,
    customerForm,
    actionLoading,
    search,
    setSearch,
    setCustomersPage,
    setSelectedCustomerId,
    setCustomerForm,
    createCustomer,
    refreshAll
  } = useAdmin();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(420);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await createCustomer();
    if (!result) return;
    setShowCreateModal(false);
    setGeneratedCredentials(result.generatedCredentials);
  };

  const copyCredential = async (field: "email" | "password", value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => {
      setCopiedField((current) => (current === field ? null : current));
    }, 3000);
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
            <h2>Customer Directory</h2>
            <p className="subtle">Operations view of onboarded customers.</p>
          </div>
          <div className="workspace-controls">
            <div className="inline-row">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name/email" />
              <button onClick={() => refreshAll(undefined, search)}>Search</button>
            </div>
            <button className="icon-btn" onClick={() => setShowCreateModal(true)}>
              + New Customer
            </button>
          </div>
        </header>

        <div className="workspace-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>KYC</th>
                <th>Subscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className={`clickable-row ${selectedCustomerId === customer.id ? "is-active" : ""}`}
                  onClick={() => {
                    setSelectedCustomerId(customer.id);
                    setShowDrawer(true);
                  }}
                >
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.kyc?.status || "NONE"}</td>
                  <td>{customer.subscriptions?.[0]?.status || "NONE"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="ghost-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedCustomerId(customer.id);
                          navigate("/admin/kyc");
                        }}
                      >
                        KYC
                      </button>
                      <button
                        className="ghost-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedCustomerId(customer.id);
                          navigate("/admin/subscriptions");
                        }}
                      >
                        Subscriptions
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <h3>Selected Customer</h3>
              <button className="ghost-btn" onClick={() => setShowDrawer(false)}>
                Dismiss
              </button>
            </div>
            <div className="detail-grid">
              <p><strong>{selectedCustomer.name}</strong></p>
              <p className="subtle">{selectedCustomer.email}</p>
              <p className="subtle">{selectedCustomer.phone}</p>
              <p className="subtle">{selectedCustomer.address}</p>
              <p className="subtle">
                Customer ID: <code>{selectedCustomer.id}</code>
              </p>
              <p className="subtle">KYC: {selectedCustomer.kyc?.status || "NONE"}</p>
              {selectedCustomer.subscriptions?.[0] && (
                <p className="subtle">
                  Latest Subscription ID: <code>{selectedCustomer.subscriptions[0].id}</code>
                </p>
              )}
            </div>
          </div>
        )}
      </aside>

      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Create New Customer</h3>
              <button className="ghost-btn" onClick={() => setShowCreateModal(false)}>
                Close
              </button>
            </div>
            <form className="form-grid" onSubmit={onSubmit}>
              <input
                placeholder="Full name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              />
              <input
                placeholder="Email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              />
              <input
                placeholder="Phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
              <input
                placeholder="Address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              />
              <button className="span-two" disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Create Customer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {generatedCredentials && (
        <div className="modal-backdrop" onClick={() => setGeneratedCredentials(null)}>
          <div className="modal-panel credentials-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>Login Credentials</h3>
                <p className="subtle">Share these with the customer. The password is only shown once.</p>
              </div>
              <button className="ghost-btn" onClick={() => setGeneratedCredentials(null)}>
                Close
              </button>
            </div>

            <div className="credentials-stack">
              <div className="credential-row">
                <div>
                  <p className="eyebrow">Email</p>
                  <code>{generatedCredentials.email}</code>
                </div>
                <button
                  type="button"
                  className={`copy-icon-btn ${copiedField === "email" ? "copied" : ""}`}
                  onClick={() => copyCredential("email", generatedCredentials.email)}
                  aria-label="Copy email"
                >
                  {copiedField === "email" ? <FiCheck /> : <FiCopy />}
                </button>
              </div>

              <div className="credential-row">
                <div>
                  <p className="eyebrow">Temporary Password</p>
                  <code>{generatedCredentials.password}</code>
                </div>
                <button
                  type="button"
                  className={`copy-icon-btn ${copiedField === "password" ? "copied" : ""}`}
                  onClick={() => copyCredential("password", generatedCredentials.password)}
                  aria-label="Copy password"
                >
                  {copiedField === "password" ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
