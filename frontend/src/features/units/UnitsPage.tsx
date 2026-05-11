import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  FileText,
  Loader2,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { SplitPanelSkeleton, TableSkeleton } from "../../components/ui/Skeletons";
import {
  archiveUnit,
  createUnit,
  deleteUnit,
  fetchUnitById,
  fetchUnits,
  type Unit,
  type UnitDetail,
  unarchiveUnit,
  updateUnit,
} from "../../api/unitApi";

export default function UnitsPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const { pushToast } = useToast();
  const role = (user?.role || "user").toUpperCase();
  const canManage = role === "ADMIN" || role === "EDITOR";
  const canDelete = role === "ADMIN";

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitDetail | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [createName, setCreateName] = useState("");
  const [editName, setEditName] = useState("");
  const [cascadeArchive, setCascadeArchive] = useState(false);

  async function loadUnits(preferredUnitId?: string | null) {
    setLoading(true);
    setError("");

    try {
      const response = await fetchUnits();
      const data = response.data || [];
      setUnits(data);

      const visibleUnits = data.filter((unit) => showArchived || !unit.is_archived);
      const nextUnitId =
        preferredUnitId && data.some((unit) => unit.id === preferredUnitId)
          ? preferredUnitId
          : visibleUnits[0]?.id || data[0]?.id || null;

      setSelectedUnitId(nextUnitId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load units";
      setError(message);
      pushToast({ message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnits(selectedUnitId);
  }, [showArchived]);

  useEffect(() => {
    if (!selectedUnitId) {
      setSelectedUnit(null);
      return;
    }

    setDetailLoading(true);
    setError("");

    fetchUnitById(selectedUnitId)
      .then((response) => {
        const unit = response.data || null;
        setSelectedUnit(unit);
        setEditName(unit?.name || "");
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load unit details";
        setError(message);
        pushToast({ message, tone: "error" });
      })
      .finally(() => setDetailLoading(false));
  }, [selectedUnitId]);

  const visibleUnits = useMemo(
    () => units.filter((unit) => showArchived || !unit.is_archived),
    [units, showArchived]
  );

  const selectedListUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId) || null,
    [units, selectedUnitId]
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createName.trim()) return;

    setSubmitting(true);

    try {
      const response = await createUnit({ name: createName.trim() });
      const newUnitId = response.data?.unit_id || null;
      setCreateName("");
      pushToast({ message: "Unit created.", tone: "success" });
      await loadUnits(newUnitId);
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to create unit",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnitId || !editName.trim()) return;

    setSubmitting(true);

    try {
      await updateUnit(selectedUnitId, { name: editName.trim() });
      pushToast({ message: "Unit updated.", tone: "success" });
      await loadUnits(selectedUnitId);
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to update unit",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!selectedUnitId) return;

    setActionLoading("archive");

    try {
      await archiveUnit(selectedUnitId, cascadeArchive);
      pushToast({
        message: cascadeArchive ? "Unit archived with cascade." : "Unit archived.",
        tone: "success",
      });
      setCascadeArchive(false);
      await loadUnits(selectedUnitId);
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to archive unit",
        tone: "error",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnarchive() {
    if (!selectedUnitId) return;

    setActionLoading("unarchive");

    try {
      await unarchiveUnit(selectedUnitId);
      pushToast({ message: "Unit restored.", tone: "success" });
      await loadUnits(selectedUnitId);
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to unarchive unit",
        tone: "error",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!selectedUnitId) return;

    const confirmed = await confirm({
      title: "Delete unit",
      description: "Delete this unit permanently? This can remove related data and cannot be undone.",
      confirmLabel: "Delete unit",
      tone: "danger",
    });
    if (!confirmed) return;

    setActionLoading("delete");

    try {
      await deleteUnit(selectedUnitId, true);
      pushToast({ message: "Unit deleted.", tone: "success" });
      setSelectedUnitId(null);
      setSelectedUnit(null);
      await loadUnits(null);
    } catch (err) {
      pushToast({
        message: err instanceof Error ? err.message : "Failed to delete unit",
        tone: "error",
      });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="units-page">
      <div className="units-header">
        <div>
          <h1>Units</h1>
          <p>
            Organize documents by operational unit, then archive or restore units as
            workflows change.
          </p>
        </div>
        <label className="units-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          <span>Show archived</span>
        </label>
      </div>

      {error && visibleUnits.length > 0 ? (
        <div className="page-inline-feedback">
          <span>{error}</span>
          <button className="pagination-btn" onClick={() => void loadUnits(selectedUnitId)}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <SplitPanelSkeleton />
      ) : error && visibleUnits.length === 0 ? (
        <div className="page-state-panel">
          <p>{error}</p>
          <button className="pagination-btn" onClick={() => void loadUnits(selectedUnitId)}>
            Retry
          </button>
        </div>
      ) : (
      <div className="units-layout">
        <section className="units-panel units-list-panel">
          <div className="units-panel-head">
            <h2>Company Units</h2>
            <span>{visibleUnits.length} visible</span>
          </div>

          {visibleUnits.length === 0 ? (
            <div className="units-empty">
              <Archive size={30} />
              <p>No units found for the current filter.</p>
            </div>
          ) : (
            <div className="units-list">
              {visibleUnits.map((unit) => (
                <button
                  key={unit.id}
                  className={`unit-list-item ${selectedUnitId === unit.id ? "active" : ""}`}
                  onClick={() => setSelectedUnitId(unit.id)}
                >
                  <div>
                    <strong>{unit.name}</strong>
                    <span>{unit.id.slice(0, 8)}</span>
                  </div>
                  <span className={`status ${unit.is_archived ? "archived" : "approved"}`}>
                    {unit.is_archived ? "ARCHIVED" : "ACTIVE"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="units-main">
          {canManage ? (
            <section className="units-panel">
              <div className="units-panel-head">
                <h2>Create Unit</h2>
              </div>

              <form className="units-form" onSubmit={handleCreate}>
                <label>
                  <span>Unit name</span>
                  <input
                    type="text"
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    placeholder="Human Resources"
                    minLength={2}
                    maxLength={50}
                    required
                  />
                </label>

                <button className="doc-detail-btn primary" type="submit" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                  Create unit
                </button>
              </form>
            </section>
          ) : null}

          <section className="units-panel">
            <div className="units-panel-head">
              <h2>Unit Details</h2>
            </div>

            {!selectedUnitId ? (
              <div className="units-empty">
                <FileText size={30} />
                <p>Select a unit to inspect its document grouping.</p>
              </div>
            ) : detailLoading ? (
              <TableSkeleton rows={4} />
            ) : (
              <>
                <div className="unit-detail-header">
                  <div>
                    <h3>{selectedUnit?.name || selectedListUnit?.name}</h3>
                    <p>{selectedUnitId}</p>
                  </div>
                  <span
                    className={`status ${selectedListUnit?.is_archived ? "archived" : "approved"}`}
                  >
                    {selectedListUnit?.is_archived ? "ARCHIVED" : "ACTIVE"}
                  </span>
                </div>

                {canManage && !selectedListUnit?.is_archived ? (
                  <form className="units-form" onSubmit={handleRename}>
                    <label>
                      <span>Rename unit</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        minLength={2}
                        maxLength={50}
                        required
                      />
                    </label>
                    <button
                      className="doc-detail-btn secondary"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                      Save name
                    </button>
                  </form>
                ) : null}

                {canManage ? (
                  <div className="unit-actions">
                    {!selectedListUnit?.is_archived ? (
                      <>
                        <label className="units-toggle inline">
                          <input
                            type="checkbox"
                            checked={cascadeArchive}
                            onChange={(event) => setCascadeArchive(event.target.checked)}
                          />
                          <span>Archive child documents too</span>
                        </label>

                        <button
                          className="doc-detail-btn danger"
                          onClick={handleArchive}
                          disabled={actionLoading === "archive"}
                        >
                          {actionLoading === "archive" ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <Archive size={16} />
                          )}
                          Archive unit
                        </button>
                      </>
                    ) : (
                      <button
                        className="doc-detail-btn secondary"
                        onClick={handleUnarchive}
                        disabled={actionLoading === "unarchive"}
                      >
                        {actionLoading === "unarchive" ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <RotateCcw size={16} />
                        )}
                        Unarchive unit
                      </button>
                    )}

                    {canDelete ? (
                      <button
                        className="doc-detail-btn danger"
                        onClick={handleDelete}
                        disabled={actionLoading === "delete"}
                      >
                        {actionLoading === "delete" ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete unit
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="unit-documents">
                  <div className="units-panel-head compact">
                    <h2>Documents in Unit</h2>
                    <span>{selectedUnit?.Documents.length || 0}</span>
                  </div>

                  {selectedUnit?.Documents.length ? (
                    <div className="unit-document-list">
                      {selectedUnit.Documents.map((document) => (
                        <div key={document.id} className="unit-document-row">
                          <div>
                            <strong>{document.title}</strong>
                            <span>{document.id.slice(0, 8)}</span>
                          </div>
                          <span className="status draft">{document.type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="units-empty compact">
                      <CheckCircle2 size={24} />
                      <p>No documents are currently linked to this unit.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      )}
    </div>
  );
}
