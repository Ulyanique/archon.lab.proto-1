export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="loading-index">ARCHON / DATABASE</span>
      <span className="loading-label">Открываем запись<span className="loading-dots">...</span></span>
      <span className="loading-track" aria-hidden="true"><span /></span>
    </div>
  );
}
