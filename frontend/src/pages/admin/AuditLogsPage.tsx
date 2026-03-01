import { PaginationControls } from "../../components/PaginationControls";
import { useAdmin } from "../../context/AdminContext";

export const AuditLogsPage = () => {
  const { auditLogs, auditLogsPagination, setAuditLogsPage, refreshAll } = useAdmin();

  return (
    <section className="workspace">
      <header className="workspace-head">
        <div>
          <h2>Audit Trail</h2>
          <p className="subtle">Immutable record of admin/system actions.</p>
        </div>
      </header>
      <div className="workspace-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.action}</td>
                <td>{log.actor?.email || "system"}</td>
                <td>{log.entityType}</td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls
        pagination={auditLogsPagination}
        onPageChange={(nextPage) => {
          setAuditLogsPage(nextPage);
          refreshAll(undefined, undefined, undefined, undefined, nextPage);
        }}
      />
    </section>
  );
};
