import { PaginationMeta } from "../types";

export const PaginationControls = ({
  pagination,
  onPageChange
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}) => {
  const { page, totalPages, total } = pagination;

  return (
    <div className="pagination-bar">
      <p className="subtle">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="pagination-actions">
        <button className="ghost-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button className="ghost-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};
