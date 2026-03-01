import { useRef, useState } from "react";
import { PaginationControls } from "../../components/PaginationControls";
import { useAdmin } from "../../context/AdminContext";

export const WebhooksPage = () => {
  const { webhookEvents, webhookEventsPagination, setWebhookEventsPage, refreshAll } = useAdmin();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(420);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const selectedEvent = webhookEvents.find((event) => event.id === selectedEventId) || webhookEvents[0];
  const previewPayload = (payload: unknown) => {
    const text = JSON.stringify(payload);
    return text.length > 90 ? `${text.slice(0, 90)}...` : text;
  };

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
      className={`workspace split ${showDrawer && selectedEvent ? "has-drawer" : ""}`}
      style={showDrawer && selectedEvent ? { gridTemplateColumns: `minmax(0, 1fr) ${drawerWidth}px` } : undefined}
    >
      <div className="workspace-main">
        <header className="workspace-head">
          <div>
            <h2>Webhook Events</h2>
            <p className="subtle">Signed payload test examples are in backend README and Swagger docs.</p>
          </div>
        </header>
        <div className="workspace-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Signature</th>
                <th>Processed</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {webhookEvents.map((event) => (
                <tr
                  key={event.id}
                  className={`clickable-row ${selectedEvent?.id === event.id ? "is-active" : ""}`}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setShowDrawer(true);
                  }}
                >
                  <td>{event.eventType}</td>
                  <td>{event.isValid ? "Valid" : "Invalid"}</td>
                  <td>{event.processedAt ? "Yes" : "No"}</td>
                  <td><code>{previewPayload(event.payload)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          pagination={webhookEventsPagination}
          onPageChange={(nextPage) => {
            setWebhookEventsPage(nextPage);
            refreshAll(undefined, undefined, undefined, nextPage);
          }}
        />
      </div>

      <aside
        className={`detail-drawer ${showDrawer && selectedEvent ? "open" : ""}`}
        style={showDrawer && selectedEvent ? { maxWidth: `${drawerWidth}px` } : undefined}
      >
        {selectedEvent && (
          <div className="drawer-content">
            <div className="drawer-resize-handle" onMouseDown={startResize} />
            <div className="drawer-head">
              <h3>Selected Event</h3>
              <button className="ghost-btn" onClick={() => setShowDrawer(false)}>
                Dismiss
              </button>
            </div>
            <p className="subtle">
              {selectedEvent.eventType} · {selectedEvent.isValid ? "Valid Signature" : "Invalid Signature"}
            </p>
            <code>{JSON.stringify(selectedEvent.payload)}</code>
          </div>
        )}
      </aside>
    </section>
  );
};
