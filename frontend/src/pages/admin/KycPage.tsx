import { useEffect, useRef, useState } from "react";
import { PaginationControls } from "../../components/PaginationControls";
import { useAdmin } from "../../context/AdminContext";

export const KycPage = () => {
  const {
    customers,
    customersPagination,
    selectedCustomer,
    selectedCustomerId,
    kycForm,
    search,
    setSearch,
    setCustomersPage,
    setSelectedCustomerId,
    setKycForm,
    decideKyc,
    refreshAll,
    actionLoading
  } = useAdmin();
  const [rejectingCustomerId, setRejectingCustomerId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(420);
  const workspaceRef = useRef<HTMLElement | null>(null);

  const onApprove = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    await decideKyc("approve", undefined, customerId);
  };

  const onMoveToPending = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    await decideKyc("pending", undefined, customerId);
  };

  const onConfirmReject = async () => {
    if (!rejectingCustomerId) return;
    setSelectedCustomerId(rejectingCustomerId);
    await decideKyc("reject", rejectReason, rejectingCustomerId);
    setRejectingCustomerId("");
    setRejectReason("");
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
            <h2>KYC Reviews</h2>
            <p className="subtle">Review customer-submitted KYC and take approval actions.</p>
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

        <div className="workspace-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Document Type</th>
                <th>Document Number</th>
                <th>Status</th>
                <th>Notes</th>
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
                  <td>
                    <strong>{customer.name}</strong>
                    <div className="subtle">{customer.email}</div>
                  </td>
                  <td>{customer.kyc?.documentType || "-"}</td>
                  <td>{customer.kyc?.documentNumber || "-"}</td>
                  <td>{customer.kyc?.status || "NOT_SUBMITTED"}</td>
                  <td>{customer.kyc?.notes || "-"}</td>
                  <td>
                    <div className="row-actions">
                      {customer.kyc && customer.kyc.status !== "APPROVED" && (
                        <button
                          disabled={actionLoading}
                          onClick={(event) => {
                            event.stopPropagation();
                            onApprove(customer.id);
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {customer.kyc && customer.kyc.status !== "REJECTED" && (
                        <button
                          className="ghost-btn"
                          disabled={actionLoading}
                          onClick={(event) => {
                            event.stopPropagation();
                            setRejectingCustomerId(customer.id);
                            setSelectedCustomerId(customer.id);
                          }}
                        >
                          Reject
                        </button>
                      )}
                      {customer.kyc && customer.kyc.status !== "PENDING" && (
                        <button
                          className="ghost-btn"
                          disabled={actionLoading}
                          onClick={(event) => {
                            event.stopPropagation();
                            onMoveToPending(customer.id);
                          }}
                        >
                          Move To Pending
                        </button>
                      )}
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
              <h3>Selected Submission</h3>
              <button className="ghost-btn" onClick={() => setShowDrawer(false)}>
                Dismiss
              </button>
            </div>
            <div className="detail-grid">
              <p><strong>{selectedCustomer.name}</strong></p>
              <p className="subtle">Status: {selectedCustomer.kyc?.status || "NOT_SUBMITTED"}</p>
              <p className="subtle">Document: {selectedCustomer.kyc?.documentType || "-"}</p>
              <p className="subtle">Doc No: {selectedCustomer.kyc?.documentNumber || "-"}</p>
              <p className="subtle">Notes: {selectedCustomer.kyc?.notes || "-"}</p>
            </div>
          </div>
        )}
      </aside>

      {rejectingCustomerId && (
        <div className="modal-backdrop" onClick={() => setRejectingCustomerId("")}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Reject KYC</h3>
              <button className="ghost-btn" onClick={() => setRejectingCustomerId("")}>
                Close
              </button>
            </div>
            <div className="form-stack">
              <input
                placeholder="Rejection reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <button disabled={actionLoading || !rejectReason.trim()} onClick={onConfirmReject}>
                {actionLoading ? "Processing..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
