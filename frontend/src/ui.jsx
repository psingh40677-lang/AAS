// Shared UI primitives for AAS — calm, accessible, reusable.

export function SectionHeading({ eyebrow, title, copy, action }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {copy && <p className="heading-copy">{copy}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className = '', children, ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>{children}</section>
  );
}

export function CardTopline({ icon, label, action }) {
  return (
    <div className="card-topline">
      <span className="status-label">{icon}{label}</span>
      {action}
    </div>
  );
}

export function TextButton({ children, onClick, tone = 'blue' }) {
  return (
    <button className="text-button" onClick={onClick} style={tone === 'white' ? { color: '#fff' } : undefined}>
      {children}
    </button>
  );
}

export function Loading({ label = 'Loading…', compact = false }) {
  return (
    <div className={compact ? 'loading compact' : 'loading'} role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({ icon: Icon, title, copy, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-icon"><Icon size={24} /></span>}
      <strong>{title}</strong>
      {copy && <p>{copy}</p>}
      {action}
    </div>
  );
}

export function PageState({ loading, error, onRetry, empty, icon: Icon, loadingLabel, emptyTitle, emptyCopy, children }) {
  if (loading) return <Loading label={loadingLabel || 'Loading your information…'} />;
  if (error) return (
    <div className="error-state">
      <span className="error-icon">!</span>
      <strong>Something went wrong.</strong>
      <p>{error}</p>
      <button className="secondary-button" onClick={onRetry}>Try again</button>
    </div>
  );
  if (empty) return <Empty icon={Icon} title={emptyTitle} copy={emptyCopy} />;
  return children;
}
