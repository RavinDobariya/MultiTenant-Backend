type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div className={`skeleton-block ${className}`.trim()} />;
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard">
      <div className="skeleton-panel dashboard-skeleton-hero">
        <SkeletonBlock className="skeleton-title" />
        <SkeletonBlock className="skeleton-line short" />
      </div>
      <div className="dash-metrics">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="dash-metric-card skeleton-card">
            <SkeletonBlock className="skeleton-icon" />
            <div className="metric-info">
              <SkeletonBlock className="skeleton-line short" />
              <SkeletonBlock className="skeleton-line" />
            </div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="dash-panel skeleton-panel">
          <SkeletonBlock className="skeleton-line short" />
          <div className="skeleton-grid-two">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="skeleton-card-tall" />
            ))}
          </div>
        </div>
        <div className="dash-panel skeleton-panel">
          <SkeletonBlock className="skeleton-line short" />
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="skeleton-row" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-table">
      <SkeletonBlock className="skeleton-row" />
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonBlock key={index} className="skeleton-row" />
      ))}
    </div>
  );
}

export function SplitPanelSkeleton() {
  return (
    <div className="units-layout">
      <section className="units-panel skeleton-panel">
        <SkeletonBlock className="skeleton-line short" />
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="skeleton-row" />
        ))}
      </section>
      <div className="units-main">
        <section className="units-panel skeleton-panel">
          <SkeletonBlock className="skeleton-line short" />
          <SkeletonBlock className="skeleton-card-tall" />
        </section>
        <section className="units-panel skeleton-panel">
          <SkeletonBlock className="skeleton-title" />
          <SkeletonBlock className="skeleton-line" />
          <SkeletonBlock className="skeleton-line short" />
          <SkeletonBlock className="skeleton-card-tall" />
        </section>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="doc-detail-page">
      <div className="skeleton-panel">
        <SkeletonBlock className="skeleton-line short" />
        <SkeletonBlock className="skeleton-title" />
        <SkeletonBlock className="skeleton-line" />
      </div>
      <div className="doc-detail-grid">
        <section className="doc-detail-panel skeleton-panel">
          <SkeletonBlock className="skeleton-line short" />
          <div className="doc-overview-stats">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="skeleton-card-tall" />
            ))}
          </div>
          <SkeletonBlock className="skeleton-card-tall" />
        </section>
        <section className="doc-detail-panel skeleton-panel">
          <SkeletonBlock className="skeleton-line short" />
          <SkeletonBlock className="skeleton-card-tall" />
        </section>
      </div>
    </div>
  );
}
