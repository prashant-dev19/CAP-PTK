import { useEffect, useState } from "react";
import { Check, X, Loader2, Inbox } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { fmtDate, padNo } from "@/components/NoticesList";

const RESOURCE_LABEL = { content: "Homepage", popup: "Pop-up", squad: "Squad", announcement: "Notice" };

function payloadDetail(p = {}) {
  if (p.title && p.body) return p.body;
  if (p.title) return p.title;
  if (Array.isArray(p.players)) return `Group photo: ${p.group_photo || "—"} · ${p.players.length} player(s) listed`;
  return "";
}

export default function ApprovalsTab({ onChanged }) {
  const [items, setItems] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/admin/pending")
      .then(({ data }) => setItems(data))
      .catch((e) => setError(formatApiError(e)));

  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    setBusyId(`${id}-${action}`);
    setError("");
    try {
      await api.post(`/admin/pending/${id}/${action}`);
      await load();
      onChanged?.();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusyId("");
    }
  };

  if (items === null) {
    return (
      <div className="flex items-center gap-3 text-ivory/50 text-sm py-16 justify-center">
        <Loader2 size={18} className="animate-spin text-gold" /> Loading pending changes…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="border border-dashed border-gold/25 rounded-xl py-20 text-center" data-testid="approvals-empty">
        <Inbox size={22} className="text-gold/50 mx-auto mb-4" />
        <p className="font-display text-2xl text-ivory/70">No pending changes.</p>
        <p className="text-sm text-ivory/40 mt-2">
          When an editor submits a change, it will appear here for your approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="approvals-list">
      {error && <p className="text-sm text-red-300" data-testid="approvals-error">{error}</p>}
      {items.map((c) => (
        <div
          key={c.id}
          className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6"
          data-testid={`pending-item-${c.id}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[0.55rem] tracking-[0.22em] uppercase text-gold border border-gold/30 rounded-full px-2.5 py-1">
                  {RESOURCE_LABEL[c.resource] || c.resource}
                </span>
                <span className="text-[0.6rem] tracking-[0.2em] uppercase text-ivory/40">
                  {fmtDate(c.created_at)}
                </span>
              </div>
              <p className="font-display text-xl text-ivory leading-snug">{c.summary}</p>
              <p className="text-xs text-ivory/50 mt-2">
                Proposed by <span className="text-ivory/80">{c.proposed_by}</span>
                <span className="text-ivory/30 mx-1.5">·</span>
                {c.proposed_by_role}
              </p>
              {payloadDetail(c.payload) && (
                <p className="text-xs text-ivory/50 mt-3 border-l-2 border-gold/25 pl-3 line-clamp-2">
                  {payloadDetail(c.payload)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => act(c.id, "approve")}
                disabled={busyId === `${c.id}-approve`}
                data-testid={`approve-${c.id}`}
                className="inline-flex items-center gap-1.5 text-[0.6rem] tracking-[0.2em] uppercase font-semibold bg-gold text-pavilion rounded-full px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {busyId === `${c.id}-approve` ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}
                Approve
              </button>
              <button
                onClick={() => act(c.id, "reject")}
                disabled={busyId === `${c.id}-reject`}
                data-testid={`reject-${c.id}`}
                aria-label="Reject change"
                title="Reject"
                className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-ivory/50 hover:text-red-300 hover:border-red-300/50 transition-colors disabled:opacity-50"
              >
                {busyId === `${c.id}-reject` ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
