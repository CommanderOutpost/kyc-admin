import { useAdmin } from "../../context/AdminContext";

export const OverviewPage = () => {
  const { customers, customersPagination, webhookEvents, webhookEventsPagination, auditLogs, auditLogsPagination } = useAdmin();

  const approvedKyc = customers.filter((customer) => customer.kyc?.status === "APPROVED").length;
  const activeSubscriptions = customers.filter((customer) => customer.subscriptions?.[0]?.status === "ACTIVE").length;

  return (
    <section className="grid-two">
      <article className="panel metric-card">
        <p className="subtle">Total Customers</p>
        <h2>{customersPagination.total}</h2>
      </article>

      <article className="panel metric-card">
        <p className="subtle">Approved KYC</p>
        <h2>{approvedKyc}</h2>
      </article>

      <article className="panel metric-card">
        <p className="subtle">Active Subscriptions</p>
        <h2>{activeSubscriptions}</h2>
      </article>

      <article className="panel metric-card">
        <p className="subtle">Webhook Events</p>
        <h2>{webhookEventsPagination.total}</h2>
      </article>

      <article className="panel">
        <h3>Latest Audit Actions</h3>
        <div className="table-lite">
          {auditLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="row row-two">
              <span>{log.action}</span>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h3>Latest Webhook Events</h3>
        <div className="table-lite">
          {webhookEvents.slice(0, 8).map((event) => (
            <div key={event.id} className="row row-two">
              <span>{event.eventType}</span>
              <span>{event.isValid ? "valid" : "invalid"}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};
